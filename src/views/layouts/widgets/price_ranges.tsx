import React, { useState, useEffect, useCallback, useRef } from "react";
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

// Optimized type definitions
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

// Memoized spinner component
const Spinner = React.memo(() => (
  <div className="price-range-spinner-overlay">
    <div className="price-range-spinner">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
));

const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  const [allProducts, setAllProducts] = useState<ExtendedProductItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProductItem[]>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const ranges = priceRanges?.price_ranges || [];
  const isProcessingRef = useRef(false);

  // Optimized price calculation with memoization
  const getPrice = useCallback((item: ExtendedProductItem): number => {
    if (!item) return 0;
    
    try {
      let basePrice = 0;
      
      // Get base price using priority order
      if ('getProductPrice' in item && typeof item.getProductPrice === 'function') {
        basePrice = item.getProductPrice();
      } else if (typeof item.sellingPrice === 'number' && item.sellingPrice > 1) {
        basePrice = item.sellingPrice;
      } else if (typeof item.price === 'number' && item.price > 1) {
        basePrice = item.price;
      } else if ('getPrice' in item && typeof item.getPrice === 'function') {
        const price = item.getPrice();
        if (typeof price === 'number' && price > 1) basePrice = price;
      }

      if (basePrice <= 1) return 0;

      // Apply pricing logic from ProductDetail
      const sizePrices = item.sellingPrices || [];
      const uniqueSize = item.sellingDisplayOptions || [];
      const activeIndex = uniqueSize.length > 0 ? 0 : null;
      
      return getProductFinalPrice({
        price: basePrice,
        discount: (item.discount && 'getDiscount' in item && typeof item.getDiscount === 'function') 
          ? item.getDiscount() : 0,
        sellingPrices: sizePrices,
        activeIndex: activeIndex,
      });
    } catch {
      return 0;
    }
  }, []);

  // Optimized utility functions
  const getName = useCallback((item: ExtendedProductItem): string => 
    item?.name || item?.title || `Product ${item?.id || 'Unknown'}`, []);

  const getId = useCallback((item: ExtendedProductItem): string => 
    item?.id || (item as any)?.productId || Math.random().toString(36), []);

  // Optimized product fetching
  const fetchAllProducts = useCallback(async () => {
    try {
      const fetchedProducts: ExtendedProductItem[] = [];

      // Fetch and convert products
      try {
        const products = objCache.getAllProducts() as unknown as Product[];
        if (Array.isArray(products)) {
          products.forEach(product => {
            fetchedProducts.push({
              ...product,
              id: product.id || (product as any).productId || Math.random().toString(36),
              name: product.name || `Product ${product.id || 'Unknown'}`
            } as ExtendedProduct);
          });
        }
      } catch {}

      // Fetch and convert kits
      try {
        const kits = objCache.getAllKits() as unknown as Kit[];
        if (Array.isArray(kits)) {
          kits.forEach(kit => {
            fetchedProducts.push({
              ...kit,
              id: kit.id || (kit as any).productId || Math.random().toString(36),
              name: kit.name || `Kit ${kit.id || 'Unknown'}`
            } as unknown as ExtendedKit);
          });
        }
      } catch {}

      // Filter valid products and remove duplicates in one pass
      const validProducts = new Map<string, ExtendedProductItem>();
      
      fetchedProducts.forEach(item => {
        const id = getId(item);
        const price = getPrice(item);
        
        if (id && price > 1 && !validProducts.has(id)) {
          validProducts.set(id, item);
        }
      });

      return Array.from(validProducts.values());
    } catch {
      return [];
    }
  }, [getPrice, getId]);

  // Optimized filtering with batch processing
  const filterByRange = useCallback((range: number, products: ExtendedProductItem[]) => {
    if (!range || !products.length) return [];

    const currentIndex = ranges.findIndex(r => r === range);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;

    return products
      .filter(item => {
        const price = getPrice(item);
        return price > 1 && (currentIndex === 0 ? price <= range : price > previousPrice && price <= range);
      })
      .sort((a, b) => getPrice(a) - getPrice(b));
  }, [ranges, getPrice]);

  // Range text generation
  const getRangeText = useCallback((range: number) => {
    if (!range) return { main: "", sub: "" };
    
    const currentIndex = ranges.findIndex(r => r === range);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    
    return currentIndex === 0
      ? { main: `₹${range.toLocaleString("en-IN")}`, sub: "& below" }
      : {
          main: `₹${(previousPrice + 1).toLocaleString("en-IN")} - ₹${range.toLocaleString("en-IN")}`,
          sub: "range",
        };
  }, [ranges]);

  // Header text generation
  const getHeaderText = useCallback(() => {
    if (!activeRange) return "";
    const currentIndex = ranges.findIndex(r => r === activeRange);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    return currentIndex === 0
      ? `Products under ₹${activeRange.toLocaleString("en-IN")}`
      : `Products ₹${(previousPrice + 1).toLocaleString("en-IN")} - ₹${activeRange.toLocaleString("en-IN")}`;
  }, [activeRange, ranges]);

  // Optimized cart handler
  const handleAddToCart = useCallback((item: ExtendedProductItem, qty = 1) => {
    try {
      addToCart({
        ...item,
        price: getPrice(item),
        id: getId(item),
      } as any, qty);
    } catch {}
  }, [addToCart, getPrice, getId]);

  // Optimized range selection
  const handleRangeSelect = useCallback((range: number) => {
    if (activeRange === range || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setActiveRange(range);
    
    requestAnimationFrame(() => {
      const filtered = filterByRange(range, allProducts);
      setFilteredProducts(filtered);
      isProcessingRef.current = false;
    });
  }, [activeRange, filterByRange, allProducts]);

  // Initialize component
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load products and set default range
  useEffect(() => {
    if (!mounted || !ranges.length) return;

    const initializeProducts = async () => {
      setLoading(true);
      try {
        const products = await fetchAllProducts();
        setAllProducts(products);
        
        // Set first range as default and filter products
        if (ranges.length > 0) {
          const defaultRange = ranges[0];
          setActiveRange(defaultRange);
          const filtered = filterByRange(defaultRange, products);
          setFilteredProducts(filtered);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeProducts();
  }, [mounted, ranges, fetchAllProducts, filterByRange]);

  // Listen for product updates
  useEffect(() => {
    if (!mounted) return;

    const handleUpdate = () => {
      fetchAllProducts().then(products => {
        setAllProducts(products);
        if (activeRange) {
          const filtered = filterByRange(activeRange, products);
          setFilteredProducts(filtered);
        }
      });
    };

    objCache.on('updateAllProducts', handleUpdate);
    objCache.on('updateKits', handleUpdate);

    return () => {
      objCache.off('updateAllProducts', handleUpdate);
      objCache.off('updateKits', handleUpdate);
    };
  }, [mounted, activeRange, fetchAllProducts, filterByRange]);

  // Loading state
  if (loading || !mounted) {
    return (
      <div className="section-py-space">
        <div className="product-box single-shopping-card-one">
          <Spinner />
        </div>
      </div>
    );
  }

  // No ranges available
  if (!ranges.length) return null;

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
                  slidesPerView={Math.min(6, ranges.length)}
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
                    const isActive = activeRange === range;
                    
                    return (
                      <SwiperSlide key={i}>
                        <div className="single-category-one single-price-range">
                          <div
                            onClick={() => handleRangeSelect(range)}
                            className={`price-range-card ${isActive ? "active" : ""}`}
                            style={{ 
                              pointerEvents: isProcessingRef.current ? 'none' : 'auto',
                              cursor: 'pointer'
                            }}
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

      {filteredProducts.length > 0 && (
        <section className="section-py-space ratio_asos product">
          <div className="custom-container title-area-between">
            <h2 className="title-left">{getHeaderText()}</h2>
          </div>
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="product product-slide-6 product-m no-arrow">
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
                          item={product as any}
                          hoverEffect="icon-inline"
                          price={getPrice(product)}
                          addCart={handleAddToCart}
                          addCompare={() => addToCompare(product as any)}
                          addWish={() => addToWish(product as any)}
                          data={product}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeRange !== null && filteredProducts.length === 0 && !loading && (
        <section className="section-py-space">
          <div className="product-box single-shopping-card-one">
            <div className="text-center py-4">
              <h5>No products found</h5>
              <p>No products available in the selected price range.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default PriceRanges;