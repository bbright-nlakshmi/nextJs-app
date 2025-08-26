//price ranges 



import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import "swiper/css";
import "swiper/css/navigation";

// Define proper types
type ProductItem = Product | Kit;

interface ExtendedProduct extends Product {
  productId?: number;
  id?: number;
  sellingPrice?: number;
  price?: number;
  name?: string;
  title?: string;
}

interface ExtendedKit extends Kit {
  id?: number;
  sellingPrice?: number;
  price?: number;
  name?: string;
  title?: string;
  getProductPrice?: () => number;
  getPrice?: () => number;
}

type ExtendedProductItem = ExtendedProduct | ExtendedKit;

interface Props {
  priceRanges: StorePriceRanges;
}

const Spinner = () => (
  <div className="price-range-spinner-overlay">
    <div className="price-range-spinner">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
);

const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  const [allProducts, setAllProducts] = useState<ExtendedProductItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProductItem[]>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const ranges = priceRanges?.price_ranges || [];
  const processingRef = useRef(false);

  const getPrice = useCallback((item: ExtendedProductItem): number => {
    try {
      // Check for sellingPrice first
      if (item.sellingPrice && typeof item.sellingPrice === 'number' && item.sellingPrice > 1) {
        return item.sellingPrice;
      }
      
      // Check for price property
      if (item.price && typeof item.price === 'number' && item.price > 1) {
        return item.price;
      }
      
      // Check for method-based prices (for Kits)
      if ('getProductPrice' in item && typeof item.getProductPrice === 'function') {
        const price = item.getProductPrice();
        if (typeof price === 'number' && price > 1) return price;
      }
      
      if ('getPrice' in item && typeof item.getPrice === 'function') {
        const price = item.getPrice();
        if (typeof price === 'number' && price > 1) return price;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting price for item:', item, error);
      return 0;
    }
  }, []);

  const getName = useCallback((item: ExtendedProductItem): string => {
    try {
      if (item.name && typeof item.name === 'string') return item.name;
      if (item.title && typeof item.title === 'string') return item.title;
      
      const id = item.productId || item.id || 'Unknown';
      return `Product ${id}`;
    } catch (error) {
      return 'Unknown Product';
    }
  }, []);

  const getId = useCallback((item: ExtendedProductItem): string | number => {
    return item.productId || item.id || Math.random().toString(36);
  }, []);

  const fetchAllProducts = useCallback(async () => {
    try {
      setLoadingInitial(true);
      let fetchedProducts: ExtendedProductItem[] = [];

      try {
        const products = objCache.getAllProducts() as ExtendedProduct[];
        if (Array.isArray(products)) {
          fetchedProducts = [...products];
        }
      } catch (error) {
        console.warn('Failed to fetch products:', error);
      }

      try {
        const kits = objCache.getAllKits() as ExtendedKit[];
        if (Array.isArray(kits)) {
          fetchedProducts = [...fetchedProducts, ...kits];
        }
      } catch (error) {
        console.warn('Failed to fetch kits:', error);
      }

      // Remove duplicates and filter out items with invalid prices
      const uniqueProducts = fetchedProducts.filter((item, index, self) => {
        const id = getId(item);
        const price = getPrice(item);
        
        // Only include items with valid prices and unique IDs
        if (!id || price <= 1) return false;
        
        return self.findIndex((p) => getId(p) === id) === index;
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetched ${uniqueProducts.length} valid products with prices`);
      }
      setAllProducts(uniqueProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setAllProducts([]);
    } finally {
      setLoadingInitial(false);
    }
  }, [getPrice, getId]);

  // Fixed filtering function with correct price range logic
  const filterByRange = useCallback(
    (range: number) => {
      if (!range || !allProducts.length) {
        setFilteredProducts([]);
        return;
      }

      if (processingRef.current) return;
      
      processingRef.current = true;
      setLoadingFilter(true);
      
      requestAnimationFrame(() => {
        try {
          const currentIndex = ranges.findIndex((r) => r === range);
          const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;

          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`\n=== Filtering for range: ₹${range} ===`);
            console.log(`Current index: ${currentIndex}`);
            console.log(`Previous price: ${previousPrice}`);
            console.log(`Total products to filter: ${allProducts.length}`);
          }

          const filtered = allProducts
            .filter((item) => {
              const price = getPrice(item);
              const name = getName(item);
              
              if (price <= 1) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`❌ Excluded: ${name} - Invalid price: ${price}`);
                }
                return false;
              }
              
              let isIncluded = false;
              
              // For the first range (e.g., "₹100 & below")
              if (currentIndex === 0) {
                isIncluded = price <= range;
                if (process.env.NODE_ENV === 'development') {
                  console.log(`✅ First range: ${name} (₹${price}) <= ₹${range} = ${isIncluded}`);
                }
              } else {
                // For other ranges (e.g., "₹101 - ₹200")
                isIncluded = price > previousPrice && price <= range;
                if (process.env.NODE_ENV === 'development') {
                  console.log(`✅ Range check: ${name} (₹${price}) > ₹${previousPrice} && <= ₹${range} = ${isIncluded}`);
                }
              }
              
              return isIncluded;
            })
            .sort((a, b) => getPrice(a) - getPrice(b));

          if (process.env.NODE_ENV === 'development') {
            console.log(`\n📊 Final Results:`);
            console.log(`Filtered products count: ${filtered.length}`);
            console.log('Filtered products:', filtered.map(item => 
              `${getName(item)}: ₹${getPrice(item)}`
            ));
          }

          setFilteredProducts(filtered);
        } catch (error) {
          console.error('Error filtering products:', error);
          setFilteredProducts([]);
        } finally {
          setLoadingFilter(false);
          processingRef.current = false;
        }
      });
    },
    [allProducts, ranges, getPrice, getName]
  );

  const getRangeText = useCallback((range: number) => {
    if (!range) return { main: "", sub: "" };
    
    const currentIndex = ranges.findIndex((r) => r === range);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    
    return currentIndex === 0
      ? { main: `₹${range.toLocaleString("en-IN")}`, sub: "& below" }
      : {
          main: `₹${(previousPrice + 1).toLocaleString("en-IN")} - ₹${range.toLocaleString("en-IN")}`,
          sub: "range",
        };
  }, [ranges]);

  const getHeaderText = useCallback(() => {
    if (!activeRange) return "";
    const currentIndex = ranges.findIndex((r) => r === activeRange);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    return currentIndex === 0
      ? `Products under ₹${activeRange.toLocaleString("en-IN")}`
      : `Products ₹${(previousPrice + 1).toLocaleString("en-IN")} - ₹${activeRange.toLocaleString("en-IN")}`;
  }, [activeRange, ranges]);

  const handleAddToCart = useCallback((item: ExtendedProductItem, qty = 1) => {
    try {
      const cartItem = {
        ...item,
        price: getPrice(item),
        id: getId(item),
      };
      addToCart(cartItem, qty);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, [addToCart, getPrice, getId]);

  const handleRangeSelect = useCallback((range: number) => {
    if (activeRange === range || isProcessing) return;
    
    console.log(`\n🔄 Range selected: ₹${range}`);
    setIsProcessing(true);
    setActiveRange(range);
    filterByRange(range);
    
    setTimeout(() => setIsProcessing(false), 300);
  }, [activeRange, filterByRange, isProcessing]);

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted && isClient) fetchAllProducts();
  }, [mounted, isClient, fetchAllProducts]);

  // Set default active range and initialize products
  useEffect(() => {
    if (ranges.length > 0 && allProducts.length > 0 && !hasInitialized) {
      const defaultRange = ranges[0];
      setActiveRange(defaultRange);
      setHasInitialized(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🚀 Initializing with default range: ₹${defaultRange}`);
        console.log(`Total products available: ${allProducts.length}`);
      }
      
      // Use the same filtering logic
      filterByRange(defaultRange);
    }
  }, [ranges, allProducts, hasInitialized, filterByRange]);

  // Listen for product updates
  useEffect(() => {
    const handleProductsUpdate = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Products updated, refetching...');
      }
      fetchAllProducts();
      setHasInitialized(false);
    };
    const handleKitsUpdate = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Kits updated, refetching...');
      }
      fetchAllProducts();
      setHasInitialized(false);
    };

    objCache.on('updateAllProducts', handleProductsUpdate);
    objCache.on('updateKits', handleKitsUpdate);

    return () => {
      objCache.off('updateAllProducts', handleProductsUpdate);
      objCache.off('updateKits', handleKitsUpdate);
    };
  }, [fetchAllProducts]);

  if (loadingInitial || !isClient) {
    return (
      <div className="section-py-space">
        <div className="product-box single-shopping-card-one">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!ranges.length) return null;

  const shouldShowProducts = (filteredProducts.length > 0 || loadingFilter) && hasInitialized;

  return (
    <>
      <section className="rts-category-area">
        <div className="product-box">
          <Row>
            <Col className="pe-0">
              <div className="custom-container title-area-between">
                <h2 className="title-left">Shop by Price</h2>
              </div>
              <div className="cover-card-main-over">
                <Swiper
                  navigation={{
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev",
                  }}
                  spaceBetween={15}
                  slidesPerView={ranges.length >= 6 ? 6 : ranges.length}
                  autoplay={false}
                  loop={false}
                  breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 10 },
                    350: { slidesPerView: 2, spaceBetween: 10 },
                    480: { slidesPerView: 3, spaceBetween: 12 },
                    640: { slidesPerView: 4, spaceBetween: 15 },
                    840: { slidesPerView: Math.min(5, ranges.length), spaceBetween: 15 },
                    1140: { slidesPerView: Math.min(6, ranges.length), spaceBetween: 15 },
                  }}
                  modules={[Navigation, Keyboard]}
                >
                  {ranges.map((range, i) => {
                    const { main, sub } = getRangeText(range);
                    return (
                      <SwiperSlide key={i}>
                        <div className="single-category-one single-price-range">
                          <div
                            onClick={() => handleRangeSelect(range)}
                            className={`price-range-card ${activeRange === range ? "active" : ""} ${isProcessing ? "processing" : ""}`}
                            style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
                          >
                            <div className="price-range-content">
                              <div className="price-main">{main}</div>
                              <p className="price-subtitle">{sub}</p>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {shouldShowProducts && (
        <section className="section-py-space ratio_asos product" style={{ position: 'relative' }}>
          <div className="custom-container title-area-between">
            <h2 className="title-left">{getHeaderText()}</h2>
          </div>
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="product product-slide-6 product-m no-arrow">
                  {loadingFilter ? (
                    <div className="text-center py-5">
                      <Spinner />
                    </div>
                  ) : (
                    <Swiper
                      slidesPerView={Math.min(6, filteredProducts.length)}
                      spaceBetween={30}
                      autoplay={{ delay: 3000, pauseOnMouseEnter: true }}
                      loop={filteredProducts.length > 6}
                      breakpoints={appConfig.mediaQueries}
                      modules={[Autoplay, Navigation, Keyboard]}
                    >
                      {filteredProducts.map((product, i) => (
                        <SwiperSlide key={`${getId(product)}-${activeRange}-${i}`}>
                          <ProductBox
                            layout="layout-one"
                            newLabel={(product as any).new}
                            item={product}
                            hoverEffect={"icon-inline"}
                            price={getPrice(product)}
                            addCart={handleAddToCart}
                            addCompare={() => addToCompare(product)}
                            addWish={() => addToWish(product)}
                            data={product}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {hasInitialized && activeRange !== null && filteredProducts.length === 0 && !loadingFilter && (
        <section className="section-py-space">
          <div className="product-box single-shopping-card-one">
            <div className="text-center py-4">
              <h5>No products found</h5>
              <p>No products available in the selected price range.</p>
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  setActiveRange(null);
                  setFilteredProducts([]);
                  setHasInitialized(false);
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default PriceRanges;