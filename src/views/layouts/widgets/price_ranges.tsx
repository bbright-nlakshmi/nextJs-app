import React, { useState, useEffect, useCallback, useMemo } from "react";
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
 
// Simplified types
interface ProductItem extends Product, Kit {
  id: string;
  name: string;
  calculatedPrice?: number;
}
 
interface PriceRangeBucket {
  rangeValue: number;
  products: ProductItem[];
  displayText: { main: string; sub: string };
}
 
interface Props {
  priceRanges: StorePriceRanges;
}
 
const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  // State - much simpler now!
  const [priceBuckets, setPriceBuckets] = useState<PriceRangeBucket[]>([]);
  const [activeRangeIndex, setActiveRangeIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
 
  // Context hooks
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
 
  // Memoized sorted ranges
  const sortedRanges = useMemo(() => {
    return [...(priceRanges?.price_ranges || [])].sort((a, b) => a - b);
  }, [priceRanges]);
 
  // Calculate product price - simplified
  const calculatePrice = useCallback((item: ProductItem): number => {
    if (!item) return 0;
 
    // Try different price sources
    const price = item.sellingPrice || item.price || 0;
    if (price <= 0) return 0;
 
    // Apply discount if available
    const discount = item.discount || 0;
    return getProductFinalPrice({
      price,
      discount,
      sellingPrices: item.sellingPrices || [],
      activeIndex: 0,
    });
  }, []);
 
  // Get all products once
  const getAllProducts = useCallback((): ProductItem[] => {
    const allItems: ProductItem[] = [];
    const seenIds = new Set<string>();
 
    // Get products
    try {
      const products = objCache.getAllProducts() as Product[];
      if (Array.isArray(products)) {
        products.forEach(product => {
          if (product?.id && !seenIds.has(product.id)) {
            const calculatedPrice = calculatePrice(product as ProductItem);
            if (calculatedPrice > 0) {
              allItems.push({
                ...product,
                id: product.id,
                name: product.name || product.title || 'Unnamed Product',
                calculatedPrice
              } as ProductItem);
              seenIds.add(product.id);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Error fetching products:', error);
    }
 
    // Get kits
    try {
      const kits = objCache.getAllKits() as Kit[];
      if (Array.isArray(kits)) {
        kits.forEach(kit => {
          if (kit?.id && !seenIds.has(kit.id)) {
            const calculatedPrice = calculatePrice(kit as ProductItem);
            if (calculatedPrice > 0) {
              allItems.push({
                ...kit,
                id: kit.id,
                name: kit.name || kit.title || 'Unnamed Kit',
                calculatedPrice
              } as ProductItem);
              seenIds.add(kit.id);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Error fetching kits:', error);
    }
 
    return allItems;
  }, [calculatePrice]);
 
  // Generate display text for range
  const getRangeDisplayText = useCallback((range: number, index: number) => {
    if (index === 0) {
      return {
        main: `₹${range.toLocaleString("en-IN")}`,
        sub: "& below"
      };
    }
   
    const previousRange = sortedRanges[index - 1];
    return {
      main: `₹${(previousRange + 1).toLocaleString("en-IN")} - ₹${range.toLocaleString("en-IN")}`,
      sub: "range"
    };
  }, [sortedRanges]);
 
  // THE KEY OPTIMIZATION: Pre-compute all price buckets once!
  const computePriceBuckets = useCallback(() => {
    if (!sortedRanges.length) return [];
 
    const allProducts = getAllProducts();
    if (!allProducts.length) return [];
 
    // Create buckets for each price range
    const buckets: PriceRangeBucket[] = sortedRanges.map((range, index) => {
      const minPrice = index === 0 ? 0 : sortedRanges[index - 1];
      const maxPrice = range;
 
      // Filter products for this range
      const productsInRange = allProducts.filter(product => {
        const price = product.calculatedPrice || 0;
        return index === 0 ? price <= maxPrice : price > minPrice && price <= maxPrice;
      });
 
      // Sort by price
      productsInRange.sort((a, b) => (a.calculatedPrice || 0) - (b.calculatedPrice || 0));
 
      return {
        rangeValue: range,
        products: productsInRange,
        displayText: getRangeDisplayText(range, index)
      };
    });
 
    return buckets;
  }, [sortedRanges, getAllProducts, getRangeDisplayText]);
 
  // Initialize buckets
  useEffect(() => {
    if (!mounted || !sortedRanges.length) return;
 
    setLoading(true);
   
    // Small delay to prevent blocking UI
    const timeoutId = setTimeout(() => {
      const buckets = computePriceBuckets();
      setPriceBuckets(buckets);
      setLoading(false);
    }, 100);
 
    return () => clearTimeout(timeoutId);
  }, [mounted, sortedRanges, computePriceBuckets]);
 
  // Listen for data updates and recompute buckets
  useEffect(() => {
    if (!mounted) return;
 
    const handleDataUpdate = () => {
      const buckets = computePriceBuckets();
      setPriceBuckets(buckets);
    };
 
    objCache.on('updateAllProducts', handleDataUpdate);
    objCache.on('updateKits', handleDataUpdate);
    objCache.on('dataLoaded', handleDataUpdate);
 
    return () => {
      objCache.off('updateAllProducts', handleDataUpdate);
      objCache.off('updateKits', handleDataUpdate);
      objCache.off('dataLoaded', handleDataUpdate);
    };
  }, [mounted, computePriceBuckets]);
 
  useEffect(() => {
    setMounted(true);
  }, []);
 
  // Event handlers - much simpler now
  const handleRangeSelection = useCallback((index: number) => {
    if (index !== activeRangeIndex && priceBuckets[index]) {
      setActiveRangeIndex(index);
    }
  }, [activeRangeIndex, priceBuckets]);
 
  const handleAddToCart = useCallback((item: ProductItem, quantity = 1) => {
    addToCart(item as any, quantity);
  }, [addToCart]);
 
  const handleAddToWish = useCallback((item: ProductItem) => {
    addToWish(item as any);
  }, [addToWish]);
 
  const handleAddToCompare = useCallback((item: ProductItem) => {
    addToCompare(item as any);
  }, [addToCompare]);
 
  // Get current products - O(1) lookup!
  const currentProducts = priceBuckets[activeRangeIndex]?.products || [];
  const currentRange = priceBuckets[activeRangeIndex];
 
  // Early returns
  if (!mounted || loading) {
    return (
      <div className="section-py-space">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading products...</span>
          </div>
        </div>
      </div>
    );
  }
 
  if (!priceBuckets.length) {
    return (
      <div className="section-py-space">
        <div className="text-center py-5">
          <h5 className="text-muted">No price ranges available</h5>
        </div>
      </div>
    );
  }
 
  return (
    <>
      {/* Price Range Selection */}
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
                    nextEl: ".price-range-next",
                    prevEl: ".price-range-prev",
                  }}
                  spaceBetween={15}
                  slidesPerView={Math.min(6, priceBuckets.length)}
                  autoplay={false}
                  loop={false}
                  keyboard={{ enabled: true }}
                  breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 10 },
                    320: { slidesPerView: 2, spaceBetween: 10 },
                    480: { slidesPerView: 3, spaceBetween: 12 },
                    640: { slidesPerView: 4, spaceBetween: 15 },
                    768: { slidesPerView: Math.min(5, priceBuckets.length), spaceBetween: 15 },
                    1024: { slidesPerView: Math.min(6, priceBuckets.length), spaceBetween: 15 },
                  }}
                  modules={[Navigation, Keyboard]}
                  className="price-range-swiper"
                >
                  {priceBuckets.map((bucket, index) => (
                    <SwiperSlide key={`range-${bucket.rangeValue}`}>
                      <div className="single-category-one single-price-range">
                        <div
                          onClick={() => handleRangeSelection(index)}
                          className={`price-range-card ${index === activeRangeIndex ? "active" : ""}`}
                          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => e.key === 'Enter' && handleRangeSelection(index)}
                        >
                          <div className="price-range-content">
                            <div className="price-main">{bucket.displayText.main}</div>
                            <p className="price-subtitle">{bucket.displayText.sub}</p>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
               
                <div className="swiper-button-prev price-range-prev"></div>
                <div className="swiper-button-next price-range-next"></div>
              </div>
            </Col>
          </Row>
        </div>
      </section>
 
      {/* Products Display - Instant switching! */}
      {currentRange && (
        <section className="section-py-space ratio_asos product">
          <div className="custom-container title-area-between">
            <h2 className="title-left">
              Products {currentRange.displayText.main}
            </h2>
          </div>
         
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                {currentProducts.length > 0 ? (
                  <div className="product product-slide-6 product-m no-arrow">
                    <Swiper
                      slidesPerView={Math.min(6, currentProducts.length)}
                      spaceBetween={20}
                      autoplay={{
                        delay: 4000,
                        pauseOnMouseEnter: true,
                        disableOnInteraction: false
                      }}
                      loop={currentProducts.length > 6}
                      keyboard={{ enabled: true }}
                      breakpoints={appConfig.mediaQueries}
                      modules={[Autoplay, Navigation, Keyboard]}
                      className="filtered-products-swiper"
                      key={`products-${activeRangeIndex}`} // Force re-render when range changes
                    >
                      {currentProducts.map((product, index) => (
                        <SwiperSlide key={`${product.id}-${activeRangeIndex}-${index}`}>
                          <ProductBox
                            layout="layout-one"
                            newLabel={(product as any).new}
                            item={product as any}
                            hoverEffect="icon-inline"
                            price={product.calculatedPrice || 0}
                            addCart={(item, qty) => handleAddToCart(product, qty)}
                            addCompare={() => handleAddToCompare(product)}
                            addWish={() => handleAddToWish(product)}
                            data={product}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="fas fa-search fa-3x text-muted"></i>
                    </div>
                    <h5 className="text-muted">No products found in this price range</h5>
                  </div>
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