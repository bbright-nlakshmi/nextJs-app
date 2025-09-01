import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { NextPage } from "next";
import { Col, Row } from "reactstrap";
import {
  Kit,
  Product,
  StorePriceRanges,
  appConfig,
  objCache,
} from "@/app/globalProvider";
import ProductBox from "./Product-Box/productbox";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CartContext } from "@/helpers/cart/cart.context";
import { CompareContext } from "@/helpers/compare/compare.context";
import { Navigation, Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { getProductFinalPrice } from "@/utils/price.helper";
import "swiper/css";
import "swiper/css/navigation";

// Enhanced type definitions
interface ExtendedProduct extends Omit<Product, 'id' | 'name'> {
  id: string;
  name: string;
  sellingPrice?: number;
  price?: number;
  title?: string;
  sellingPrices?: number[];
  sellingDisplayOptions?: string[];
  discount?: number;
  getProductPrice?: () => number;
  getDiscount?: () => number;
}

interface ExtendedKit extends Omit<Kit, 'id' | 'name'> {
  id: string;
  name: string;
  sellingPrice?: number;
  price?: number;
  title?: string;
  sellingPrices?: number[];
  sellingDisplayOptions?: string[];
  discount?: number;
  getProductPrice?: () => number;
  getPrice?: () => number;
  getDiscount?: () => number;
}

type ExtendedProductItem = ExtendedProduct | ExtendedKit;

interface Props {
  priceRanges: StorePriceRanges;
}

// Loading spinner component
const LoadingSpinner = React.memo(() => (
  <div className="price-range-loading">
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading products...</span>
      </div>
    </div>
  </div>
));

// Empty state component
const EmptyState = React.memo(({ message }: { message: string }) => (
  <div className="text-center py-5">
    <div className="mb-3">
      <i className="fas fa-search fa-3x text-muted"></i>
    </div>
    <h5 className="text-muted">{message}</h5>
    <p className="text-muted">Try selecting a different price range</p>
  </div>
));

const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  // State management
  const [allProducts, setAllProducts] = useState<ExtendedProductItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProductItem[]>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Context hooks
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  // Refs
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized values
  const ranges = useMemo(() => {
    const rangeArray = priceRanges?.price_ranges || [];
    return rangeArray.sort((a, b) => a - b); // Ensure sorted order
  }, [priceRanges?.price_ranges]);

  const tenantConfig = useMemo(() => ({
    tenantId: appConfig.tenantId,
    storeId: appConfig.defaultStoreId,
    apiBaseUrl: appConfig.apiBaseUrl,
  }), []);

  // Utility functions
  const getProductId = useCallback((item: ExtendedProductItem): string => {
    return item?.id || (item as any)?.productId || `product-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const getProductName = useCallback((item: ExtendedProductItem): string => {
    return item?.name || item?.title || `Product ${getProductId(item)}`;
  }, [getProductId]);

  // Enhanced price calculation
  const calculateProductPrice = useCallback((item: ExtendedProductItem): number => {
    if (!item) return 0;

    try {
      let basePrice = 0;

      // Priority-based price extraction
      if ('getProductPrice' in item && typeof item.getProductPrice === 'function') {
        basePrice = item.getProductPrice();
      } else if ('getPrice' in item && typeof item.getPrice === 'function') {
        basePrice = item.getPrice();
      } else if (typeof item.sellingPrice === 'number' && item.sellingPrice > 0) {
        basePrice = item.sellingPrice;
      } else if (typeof item.price === 'number' && item.price > 0) {
        basePrice = item.price;
      }

      if (basePrice <= 0) return 0;

      // Apply discount and size-based pricing
      const sizePrices = item.sellingPrices || [];
      const sizeOptions = item.sellingDisplayOptions || [];
      const discount = ('getDiscount' in item && typeof item.getDiscount === 'function') 
        ? item.getDiscount() : (item.discount || 0);

      return getProductFinalPrice({
        price: basePrice,
        discount: discount,
        sellingPrices: sizePrices,
        activeIndex: sizeOptions.length > 0 ? 0 : null,
      });
    } catch (error) {
      console.warn(`Price calculation failed for product ${getProductId(item)}:`, error);
      return 0;
    }
  }, [getProductId]);

  // Enhanced product fetching
  const fetchAllProducts = useCallback(async (): Promise<ExtendedProductItem[]> => {
    try {
      // Cancel any ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const fetchedProducts: ExtendedProductItem[] = [];
      const productMap = new Map<string, ExtendedProductItem>();

      // Fetch products with error handling
      try {
        const products = objCache.getAllProducts() as unknown as Product[];
        if (Array.isArray(products)) {
          products.forEach(product => {
            if (product && typeof product === 'object') {
              const extendedProduct: ExtendedProduct = {
                ...product,
                id: getProductId(product as ExtendedProduct),
                name: getProductName(product as ExtendedProduct)
              };
              
              const price = calculateProductPrice(extendedProduct);
              if (price > 0) {
                const id = getProductId(extendedProduct);
                if (!productMap.has(id)) {
                  productMap.set(id, extendedProduct);
                }
              }
            }
          });
        }
      } catch (error) {
        // console.warn('Error fetching products:', error);
      }

      // Fetch kits with error handling
      try {
        const kits = objCache.getAllKits() as unknown as Kit[];
        if (Array.isArray(kits)) {
          kits.forEach(kit => {
            if (kit && typeof kit === 'object') {
              const extendedKit: ExtendedKit = {
                ...kit,
                id: getProductId(kit as ExtendedKit),
                name: getProductName(kit as ExtendedKit)
              } as ExtendedKit;
              
              const price = calculateProductPrice(extendedKit);
              if (price > 0) {
                const id = getProductId(extendedKit);
                if (!productMap.has(id)) {
                  productMap.set(id, extendedKit);
                }
              }
            }
          });
        }
      } catch (error) {
        // console.warn('Error fetching kits:', error);
      }

      return Array.from(productMap.values()).sort((a, b) => {
        const priceA = calculateProductPrice(a);
        const priceB = calculateProductPrice(b);
        return priceA - priceB;
      });
    } catch (error) {
      // console.error('Error in fetchAllProducts:', error);
      setError('Failed to load products. Please refresh the page.');
      return [];
    }
  }, [getProductId, getProductName, calculateProductPrice]);

  // Enhanced filtering with performance optimization
  const filterProductsByRange = useCallback((
    targetRange: number, 
    products: ExtendedProductItem[]
  ): ExtendedProductItem[] => {
    if (!targetRange || !products.length) return [];

    try {
      const rangeIndex = ranges.findIndex(r => r === targetRange);
      if (rangeIndex === -1) return [];

      const minPrice = rangeIndex > 0 ? ranges[rangeIndex - 1] : 0;
      const maxPrice = targetRange;

      return products.filter(item => {
        const price = calculateProductPrice(item);
        return price > minPrice && price <= maxPrice;
      }).sort((a, b) => calculateProductPrice(a) - calculateProductPrice(b));
    } catch (error) {
      // console.error('Error filtering products:', error);
      return [];
    }
  }, [ranges, calculateProductPrice]);

  // Range display text generation
  const getRangeDisplayText = useCallback((range: number) => {
    const rangeIndex = ranges.findIndex(r => r === range);
    if (rangeIndex === -1) return { main: "", sub: "" };

    const previousPrice = rangeIndex > 0 ? ranges[rangeIndex - 1] : 0;
    
    if (rangeIndex === 0) {
      return {
        main: `₹${range.toLocaleString("en-IN")}`,
        sub: "& below"
      };
    } else {
      return {
        main: `₹${(previousPrice + 1).toLocaleString("en-IN")} - ₹${range.toLocaleString("en-IN")}`,
        sub: "range"
      };
    }
  }, [ranges]);

  // Header text for filtered products
  const getFilteredProductsHeader = useCallback(() => {
    if (!activeRange) return "Products";
    
    const rangeIndex = ranges.findIndex(r => r === activeRange);
    const previousPrice = rangeIndex > 0 ? ranges[rangeIndex - 1] : 0;
    
    return rangeIndex === 0
      ? `Products under ₹${activeRange.toLocaleString("en-IN")}`
      : `Products ₹${(previousPrice + 1).toLocaleString("en-IN")} - ₹${activeRange.toLocaleString("en-IN")}`;
  }, [activeRange, ranges]);

  // Event handlers
  const handleAddToCart = useCallback((item: ExtendedProductItem, quantity = 1) => {
    try {
      const price = calculateProductPrice(item);
      addToCart({
        ...item,
        price: price,
        id: getProductId(item),
        name: getProductName(item)
      } as any, quantity);
    } catch (error) {
      // console.error('Error adding to cart:', error);
    }
  }, [addToCart, calculateProductPrice, getProductId, getProductName]);

  const handleAddToWish = useCallback((item: ExtendedProductItem) => {
    try {
      addToWish({
        ...item,
        id: getProductId(item),
        name: getProductName(item)
      } as any);
    } catch (error) {
      // console.error('Error adding to wishlist:', error);
    }
  }, [addToWish, getProductId, getProductName]);

  const handleAddToCompare = useCallback((item: ExtendedProductItem) => {
    try {
      addToCompare({
        ...item,
        id: getProductId(item),
        name: getProductName(item)
      } as any);
    } catch (error) {
      // console.error('Error adding to compare:', error);
    }
  }, [addToCompare, getProductId, getProductName]);

  const handleRangeSelection = useCallback(async (range: number) => {
    if (activeRange === range || isProcessingRef.current || !allProducts.length) return;
    
    isProcessingRef.current = true;
    setFiltering(true);
    setError(null);

    try {
      // Use requestAnimationFrame for smooth UI updates
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setActiveRange(range);
          const filtered = filterProductsByRange(range, allProducts);
          setFilteredProducts(filtered);
          resolve(void 0);
        });
      });
    } catch (error) {
      // console.error('Error selecting range:', error);
      setError('Failed to filter products. Please try again.');
    } finally {
      setFiltering(false);
      isProcessingRef.current = false;
    }
  }, [activeRange, allProducts, filterProductsByRange]);

  // Component initialization
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load and initialize products
  useEffect(() => {
    if (!mounted || !ranges.length) return;

    const initializeProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const products = await fetchAllProducts();
        setAllProducts(products);

        // Set default range (first one) and filter products
        if (ranges.length > 0 && products.length > 0) {
          const defaultRange = ranges[0];
          setActiveRange(defaultRange);
          const filtered = filterProductsByRange(defaultRange, products);
          setFilteredProducts(filtered);
        }
      } catch (error) {
        // console.error('Initialization error:', error);
        setError('Failed to initialize products. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(initializeProducts, 100); // Small delay for smoother UX
    return () => clearTimeout(timeoutId);
  }, [mounted, ranges, fetchAllProducts, filterProductsByRange]);

  // Listen for cache updates
  useEffect(() => {
    if (!mounted) return;

    const handleCacheUpdate = async () => {
      try {
        const products = await fetchAllProducts();
        setAllProducts(products);
        
        if (activeRange && products.length > 0) {
          const filtered = filterProductsByRange(activeRange, products);
          setFilteredProducts(filtered);
        }
      } catch (error) {
        // console.error('Cache update error:', error);
      }
    };

    // Listen to relevant cache events
    objCache.on('updateAllProducts', handleCacheUpdate);
    objCache.on('updateKits', handleCacheUpdate);
    objCache.on('dataLoaded', handleCacheUpdate);

    return () => {
      objCache.off('updateAllProducts', handleCacheUpdate);
      objCache.off('updateKits', handleCacheUpdate);
      objCache.off('dataLoaded', handleCacheUpdate);
    };
  }, [mounted, activeRange, fetchAllProducts, filterProductsByRange]);

  // Early returns for loading and error states
  if (!mounted || loading) {
    return (
      <div className="section-py-space">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-py-space">
        <div className="container">
          <div className="alert alert-danger text-center">
            <i className="fas fa-exclamation-triangle mb-2"></i>
            <h5>{error}</h5>
            <button 
              className="btn btn-primary mt-2"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ranges.length) {
    return (
      <div className="section-py-space">
        <EmptyState message="No price ranges available" />
      </div>
    );
  }

  // Main component render
  return (
    <>
      {/* Price Range Selection Section */}
      <section className="rts-category-area">
        <div className="product-box">
          <Row>
            <Col className="pe-0">
              <div className="custom-container title-area-between">
                <h2 className="title-left">Shop by Price</h2>
                {/* <small className="text-muted">
                  Store: {tenantConfig.storeId} | Tenant: {tenantConfig.tenantId}
                </small> */}
              </div>
              
              <div className="cover-card-main-over">
                <Swiper
                  navigation={{
                    nextEl: ".price-range-next",
                    prevEl: ".price-range-prev",
                  }}
                  spaceBetween={15}
                  slidesPerView={Math.min(6, ranges.length)}
                  autoplay={false}
                  loop={false}
                  keyboard={{ enabled: true }}
                  breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 10 },
                    320: { slidesPerView: 2, spaceBetween: 10 },
                    480: { slidesPerView: 3, spaceBetween: 12 },
                    640: { slidesPerView: 4, spaceBetween: 15 },
                    768: { slidesPerView: Math.min(5, ranges.length), spaceBetween: 15 },
                    1024: { slidesPerView: Math.min(6, ranges.length), spaceBetween: 15 },
                  }}
                  modules={[Navigation, Keyboard]}
                  className="price-range-swiper"
                >
                  {ranges.map((range, index) => {
                    const { main, sub } = getRangeDisplayText(range);
                    const isActive = activeRange === range;
                    const isDisabled = filtering || isProcessingRef.current;
                    
                    return (
                      <SwiperSlide key={`range-${range}-${index}`}>
                        <div className="single-category-one single-price-range">
                          <div
                            onClick={() => !isDisabled && handleRangeSelection(range)}
                            className={`price-range-card ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                            style={{ 
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.6 : 1,
                              transition: 'all 0.3s ease'
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !isDisabled) {
                                handleRangeSelection(range);
                              }
                            }}
                          >
                            <div className="price-range-content">
                              <div className="price-main">{main}</div>
                              <p className="price-subtitle">{sub}</p>
                              {isActive && filtering && (
                                <div className="small-spinner">
                                  <div className="spinner-border spinner-border-sm" role="status"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
                
                {/* Custom navigation buttons */}
                <div className="swiper-button-prev price-range-prev"></div>
                <div className="swiper-button-next price-range-next"></div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Filtered Products Section */}
      {activeRange !== null && (
        <section className="section-py-space ratio_asos product">
          <div className="custom-container title-area-between">
            <h2 className="title-left">{getFilteredProductsHeader()}</h2>
          </div>
          
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                {filtering ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Filtering products...</span>
                    </div>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="product product-slide-6 product-m no-arrow">
                    <Swiper
                      slidesPerView={Math.min(6, filteredProducts.length)}
                      spaceBetween={20}
                      autoplay={{ 
                        delay: 4000, 
                        pauseOnMouseEnter: true,
                        disableOnInteraction: false
                      }}
                      loop={filteredProducts.length > 6}
                      keyboard={{ enabled: true }}
                      breakpoints={appConfig.mediaQueries}
                      modules={[Autoplay, Navigation, Keyboard]}
                      className="filtered-products-swiper"
                    >
                      {filteredProducts.map((product, index) => {
                        const productId = getProductId(product);
                        const productPrice = calculateProductPrice(product);
                        
                        return (
                          <SwiperSlide key={`${productId}-${activeRange}-${index}`}>
                            <ProductBox
                              layout="layout-one"
                              newLabel={(product as any).new}
                              item={product as any}
                              hoverEffect="icon-inline"
                              price={productPrice}
                              addCart={(item, qty) => handleAddToCart(product, qty)}
                              addCompare={() => handleAddToCompare(product)}
                              addWish={() => handleAddToWish(product)}
                              data={product}
                            />
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                  </div>
                ) : (
                  <EmptyState message="No products found in this price range" />
                )}
              </div>
            </div>
          </div>
        </section>
      )}


    </>
  );
};

export default PriceRanges;