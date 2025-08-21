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

type ProductItem = Product | Kit;

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
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false); // New state to track initialization

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const ranges = priceRanges?.price_ranges || [];
  const processingRef = useRef(false);

  const getPrice = (item: ProductItem): number => {
    if ('sellingPrice' in item && item.sellingPrice) return item.sellingPrice;
    if ('getProductPrice' in item && typeof item.getProductPrice === 'function') return item.getProductPrice();
    if ('price' in item && item.price) return item.price;
    if ('getPrice' in item && typeof item.getPrice === 'function') return item.getPrice();
    return 0;
  };

  const getName = (item: ProductItem): string => {
    if ('name' in item && item.name) return item.name;
    if ('title' in item && item.title) return item.title;
    return `Product ${(item as Product)?.productId || item.id || "Unknown"}`;
  };

  const fetchAllProducts = useCallback(async () => {
    try {
      setLoadingInitial(true);
      let fetchedProducts: ProductItem[] = [];

      try {
        const products = objCache.getAllProducts();
        if (Array.isArray(products)) fetchedProducts = [...products];
      } catch (error) {
        // Silent fail
      }

      try {
        const kits = objCache.getAllKits();
        if (Array.isArray(kits)) fetchedProducts = [...fetchedProducts, ...kits];
      } catch (error) {
        // Silent fail
      }

      // Remove duplicates
      const uniqueProducts = fetchedProducts.filter((item, index, self) => {
        const id = (item as Product)?.productId || item.id;
        return id && self.findIndex((p) => ((p as Product)?.productId || p.id) === id) === index;
      });

      setAllProducts(uniqueProducts);
    } catch (err) {
      setAllProducts([]);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  // Memoized filtering function for better performance
  const filterByRange = useCallback(
    (range: number) => {
      if (!range || !allProducts.length) {
        setFilteredProducts([]);
        return;
      }

      if (processingRef.current) return; // Prevent multiple simultaneous operations
      
      processingRef.current = true;
      setLoadingFilter(true);
      
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
        try {
          const currentIndex = ranges.findIndex((r) => r === range);
          const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;

          const filtered = allProducts
            .filter((item) => {
              const price = getPrice(item);
              return price > 0 && price > previousPrice && price <= range;
            })
            .sort((a, b) => getPrice(a) - getPrice(b));

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
    [allProducts, ranges]
  );

  const getRangeText = useCallback((range: number) => {
    if (!range) return { main: "", sub: "" };
    
    const currentIndex = ranges.findIndex((r) => r === range);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    
    return currentIndex === 0
      ? { main: `₹${range.toLocaleString("en-IN")}`, sub: "& below" }
      : {
          main: `₹${previousPrice.toLocaleString("en-IN")} - ₹${range.toLocaleString("en-IN")}`,
          sub: "range",
        };
  }, [ranges]);

  const getHeaderText = useCallback(() => {
    if (!activeRange) return "";
    const currentIndex = ranges.findIndex((r) => r === activeRange);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    return currentIndex === 0
      ? `Products under ₹${activeRange.toLocaleString("en-IN")}`
      : `Products ₹${previousPrice.toLocaleString("en-IN")} - ₹${activeRange.toLocaleString("en-IN")}`;
  }, [activeRange, ranges]);

  const handleAddToCart = useCallback((item: any, qty = 1) => {
    try {
      const cartItem = {
        ...item,
        price: getPrice(item),
        id: item.productId || item.id,
      };
      addToCart(cartItem, qty);
    } catch (error) {
      // Silent fail
    }
  }, [addToCart]);

  // Handle price range selection with debouncing
  const handleRangeSelect = useCallback((range: number) => {
    if (activeRange === range || isProcessing) return; // Prevent unnecessary re-filtering
    
    setIsProcessing(true);
    setActiveRange(range);
    filterByRange(range);
    
    // Reset processing state after a short delay
    setTimeout(() => setIsProcessing(false), 300);
  }, [activeRange, filterByRange, isProcessing]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) fetchAllProducts();
  }, [mounted, fetchAllProducts]);

  // Set default active range and initialize products
  useEffect(() => {
    if (ranges.length > 0 && allProducts.length > 0 && !hasInitialized) {
      const defaultRange = ranges[0];
      setActiveRange(defaultRange);
      setHasInitialized(true); // Mark as initialized
      
      // Immediately filter for the default range
      const currentIndex = ranges.findIndex((r) => r === defaultRange);
      const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;

      const filtered = allProducts
        .filter((item) => {
          const price = getPrice(item);
          return price > 0 && price > previousPrice && price <= defaultRange;
        })
        .sort((a, b) => getPrice(a) - getPrice(b));

      setFilteredProducts(filtered);
    }
  }, [ranges, allProducts, hasInitialized, getPrice]);

  // Listen for product updates
  useEffect(() => {
    const handleProductsUpdate = () => {
      fetchAllProducts();
      setHasInitialized(false); // Reset initialization when products update
    };
    const handleKitsUpdate = () => {
      fetchAllProducts();
      setHasInitialized(false); // Reset initialization when kits update
    };

    objCache.on('updateAllProducts', handleProductsUpdate);
    objCache.on('updateKits', handleKitsUpdate);

    return () => {
      objCache.off('updateAllProducts', handleProductsUpdate);
      objCache.off('updateKits', handleKitsUpdate);
    };
  }, [fetchAllProducts]);

  if (loadingInitial) {
    return (
      <div className="section-py-space">
        <div className="product-box single-shopping-card-one">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!ranges.length) return null;

  // Show products for selected range - modified condition
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
                  slidesPerView={6}
                  autoplay={true}
                  breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 10 },
                    350: { slidesPerView: 2, spaceBetween: 10 },
                    480: { slidesPerView: 3, spaceBetween: 12 },
                    640: { slidesPerView: 4, spaceBetween: 15 },
                    840: { slidesPerView: 5, spaceBetween: 15 },
                    1140: { slidesPerView: 6, spaceBetween: 15 },
                  }}
                  modules={[Navigation, Autoplay, Keyboard]}
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
                      slidesPerView={6}
                      spaceBetween={30}
                      autoplay={{ delay: 1000, pauseOnMouseEnter: true }}
                      breakpoints={appConfig.mediaQueries}
                      modules={[Autoplay, Navigation, Keyboard]}
                    >
                      {filteredProducts.map((product: any, i: number) => (
                        <SwiperSlide key={`${product.id || product.productId || i}-${activeRange}`}>
                          <ProductBox
                            layout="layout-one"
                            newLabel={product.new}
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