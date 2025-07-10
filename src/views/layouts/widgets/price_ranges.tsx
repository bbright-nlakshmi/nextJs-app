"use client";

import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Col, Container, Row, Spinner } from "reactstrap";
import { TabContent, TabPane } from "reactstrap";
import {
  Kit,
  Product,
  StorePriceRanges,
  objCache,
  searchController,
} from "@/app/globalProvider";
import { API } from "@/app/services/api.service";
import ProductBox from "./Product-Box/productbox";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CartContext } from "@/helpers/cart/cart.context";
import { CompareContext } from "@/helpers/compare/compare.context";
import { Navigation, Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface Props {
  priceRanges: StorePriceRanges | undefined;
}

const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  const [products, setProducts] = useState<Array<Product | Kit>>([]);
  const [allProducts, setAllProducts] = useState<Array<Product | Kit>>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const dynamicRanges = priceRanges?.price_ranges || [];

  // Enhanced product fetching with better error handling
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        console.log("Fetching all products from API...");

        let fetchedProducts: Array<Product | Kit> = [];

        // Primary API call
        try {
          const res = await API.getAllProducts();
          console.log("API Response:", res);

          if (Array.isArray(res)) {
            fetchedProducts = res;
          } else if (res && typeof res === 'object') {
            // Handle Map response type
            if (res instanceof Map) {
              for (const [category, products] of res.entries()) {
                if (Array.isArray(products)) {
                  fetchedProducts = [...fetchedProducts, ...products];
                }
              }
            } else {
              // Handle object responses
              const resAny = res as any;
              
              // Try different possible data structures
              const possibleDataPaths = [
                resAny.products,
                resAny.data,
                resAny.items,
                resAny.result,
                resAny.content
              ];

              for (const dataPath of possibleDataPaths) {
                if (Array.isArray(dataPath)) {
                  fetchedProducts = [...fetchedProducts, ...dataPath];
                  break;
                }
              }

              // If no direct array found, try extracting from object values
              if (fetchedProducts.length === 0) {
                const values = Object.values(resAny);
                for (const value of values) {
                  if (Array.isArray(value)) {
                    fetchedProducts = [...fetchedProducts, ...value];
                    break;
                  }
                }
              }
            }
          }
        } catch (apiError) {
          console.warn("Primary API call failed:", apiError);
          setError("Failed to fetch products from API");
        }

        // Fallback methods if primary API fails
        if (fetchedProducts.length === 0) {
          console.log("Attempting fallback methods...");
          
          // Try searchController
          try {
            if (searchController && typeof searchController.getAllProducts === 'function') {
              const searchResults = searchController.getAllProducts();
              if (searchResults instanceof Map) {
                for (const [category, products] of searchResults.entries()) {
                  if (Array.isArray(products)) {
                    fetchedProducts = [...fetchedProducts, ...products];
                  }
                }
              } else if (Array.isArray(searchResults)) {
                fetchedProducts = [...fetchedProducts, ...searchResults];
              }
            }
          } catch (searchError) {
            console.warn("Search controller fallback failed:", searchError);
          }

          // Try objCache
          try {
            if (objCache && typeof objCache.getAllProducts === 'function') {
              const cachedProducts = objCache.getAllProducts();
              if (Array.isArray(cachedProducts)) {
                fetchedProducts = [...fetchedProducts, ...cachedProducts];
              }
            }
          } catch (cacheError) {
            console.warn("Cache fallback failed:", cacheError);
          }

          // Try to get kits separately
          try {
            if (objCache && typeof objCache.getAllKits === 'function') {
              const allKits = objCache.getAllKits();
              if (Array.isArray(allKits)) {
                fetchedProducts = [...fetchedProducts, ...allKits];
              }
            }
          } catch (kitError) {
            console.warn("Kit fallback failed:", kitError);
          }
        }

        // Remove duplicates and validate products
        const uniqueProducts = fetchedProducts.filter((product, index, self) => {
          if (!product || typeof product !== 'object') return false;
          
          const productId = (product as any).productId || product.id;
          if (!productId) return false;
          
          return self.findIndex(p => ((p as any).productId || p.id) === productId) === index;
        });

        console.log("Fetched unique products:", uniqueProducts.length);
        
        if (uniqueProducts.length === 0) {
          setError("No products found");
        } else {
          setError(null);
        }

        setAllProducts(uniqueProducts);

      } catch (err) {
        console.error("Error fetching all products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Enhanced price extraction with better validation
  const getPrice = (item: Product | Kit): number => {
    if (!item || typeof item !== 'object') return 0;
    
    try {
      const product = item as Product;
      
      // For Product type, use the same logic as RecentlyAddedProducts
      if (product.getPriceWithDiscount) {
        return product.getPriceWithDiscount();
      }
      
      if (product.saleMode === 'custom' && product.sellingPrices?.length > 0) {
        return product.sellingPrices[0];
      }
      
      return product.sellingPrice || 0;
    } catch (error) {
      console.error("Error extracting price for item:", item, error);
      return 0;
    }
  };

  // Enhanced name extraction
  const getName = (item: Product | Kit): string => {
    if (!item || typeof item !== 'object') return "Unknown Product";
    
    try {
      const product = item as Product;
      return product.name || `Product ${product.id || 'Unknown'}`;
    } catch (error) {
      console.error("Error extracting name for item:", item, error);
      return "Unknown Product";
    }
  };

  // Enhanced image extraction
  const getImages = (item: Product | Kit): string[] => {
    if (!item || typeof item !== 'object') return ["/images/default.jpg"];
    
    try {
      const product = item as Product;
      return product.img && product.img.length > 0 ? product.img : ["/images/default.jpg"];
    } catch (error) {
      console.error("Error extracting images for item:", item, error);
      return ["/images/default.jpg"];
    }
  };

  // Filter products by price range
  const switchPriceRange = async (range: number) => {
    if (!range || range <= 0) return;
    
    setLoading(true);
    setActiveRange(range);

    try {
      console.log(`Filtering products for price range: ₹${range}`);
      
      // Get products with valid prices
      const itemsWithPrices = allProducts.map(item => ({
        item,
        price: getPrice(item),
        name: getName(item)
      })).filter(({ price }) => price > 0);

      console.log("Items with valid prices:", itemsWithPrices.length);

      // Find the previous price range
      const currentIndex = dynamicRanges.findIndex(r => r === range);
      const previousPrice = currentIndex > 0 ? dynamicRanges[currentIndex - 1] : 0;

      // Filter products based on price range
      const filteredItems = itemsWithPrices.filter(({ price }) => {
        if (currentIndex === 0) {
          return price <= range;
        } else {
          return price > previousPrice && price <= range;
        }
      });

      console.log(`Filtered products for range ₹${range}:`, filteredItems.length);

      // Sort by price (ascending)
      const sortedItems = filteredItems.sort((a, b) => a.price - b.price);

      setProducts(sortedItems.map(({ item }) => item));
    } catch (error) {
      console.error("Error filtering products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get price range display text
  const getPriceRangeText = (range: number): { main: string; subtitle: string } => {
    const currentIndex = dynamicRanges.findIndex(r => r === range);
    const previousPrice = currentIndex > 0 ? dynamicRanges[currentIndex - 1] : 0;

    if (currentIndex === 0) {
      return {
        main: `₹${range.toLocaleString('en-IN')}`,
        subtitle: "& below"
      };
    } else {
      return {
        main: `₹${previousPrice.toLocaleString('en-IN')} - ₹${range.toLocaleString('en-IN')}`,
        subtitle: "range"
      };
    }
  };

  // Show initial loading
  if (initialLoading) {
    return (
      <section className="section-py-space">
        <div className="custom-container">
          <div className="text-center py-4">Loading products...</div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error && allProducts.length === 0) {
    return (
      <section className="section-py-space">
        <div className="custom-container">
          <div className="text-center py-4">
            <h5>Unable to load products</h5>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Show no price ranges
  if (!priceRanges || !dynamicRanges.length) {
    return (
      <section className="section-py-space">
        <div className="custom-container">
          <div className="text-center py-4">No price ranges available.</div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Price Range Selection */}
      <section className="section-py-space rts-category-area">
        <div className="custom-container">
          <Row>
            <Col className="pe-0">
              <div className="title-area-between">
                <h2 className="title-left">Shop by Price</h2>
                <div className="next-prev-swiper-wrapper price-range-nav">
                  <div className="swiper-button-prev">
                    <i className="fas fa-chevron-left"></i>
                  </div>
                  <div className="swiper-button-next">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              </div>
              
              <div className="cover-card-main-over">
                <Swiper
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                  }}
                  spaceBetween={15}
                  slidesPerView={6}
                  loop={false}
                  autoplay={true}
                  className="mySwiper-category-1 swiper-data"
                  breakpoints={{
                    0: { slidesPerView: 1.5, spaceBetween: 10 },
                    350: { slidesPerView: 2, spaceBetween: 10 },
                    480: { slidesPerView: 2.5, spaceBetween: 12 },
                    640: { slidesPerView: 3, spaceBetween: 15 },
                    768: { slidesPerView: 4, spaceBetween: 15 },
                    1024: { slidesPerView: 5, spaceBetween: 15 },
                    1200: { slidesPerView: 6, spaceBetween: 15 },
                  }}
                  modules={[Navigation, Autoplay, Keyboard]}
                >
                  {dynamicRanges.map((range, i) => {
                    const { main, subtitle } = getPriceRangeText(range);
                    return (
                      <SwiperSlide key={i}>
                        <div className="single-category-one">
                          <div
                            onClick={() => switchPriceRange(range)}
                            className={`price-range-card ${
                              activeRange === range ? 'active' : ''
                            }`}
                          >
                            <div className="price-range-content">
                              <div className="price-main">{main}</div>
                              <p className="price-subtitle">{subtitle}</p>
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

      {/* Product Display */}
      {products.length > 0 && (
        <section className="section-py-space ratio_asos product">
          <div className="custom-container">
            <Row>
              <Col className="pe-0">
                <div className="title-area-between">
                  <h2 className="title-left">
                    {(() => {
                      const currentIndex = dynamicRanges.findIndex(r => r === activeRange);
                      const previousPrice = currentIndex > 0 ? dynamicRanges[currentIndex - 1] : 0;

                      if (currentIndex === 0) {
                        return `Products under ₹${activeRange?.toLocaleString('en-IN')}`;
                      } else {
                        return `Products ₹${previousPrice.toLocaleString('en-IN')} - ₹${activeRange?.toLocaleString('en-IN')}`;
                      }
                    })()}
                    <span className="product-count ml-2">({products.length})</span>
                  </h2>
                </div>
                
                <TabContent activeTab="1">
                  <TabPane tabId="1">
                    <div className="product product-slide-6 product-m no-arrow">
                      <div>
                        {loading ? (
                          <div className="text-center py-4">Loading products...</div>
                        ) : (
                          <Swiper
                            slidesPerView={6}
                            spaceBetween={30}
                            loop={false}
                            autoplay={true}
                            breakpoints={{
                              0: { slidesPerView: 1, spaceBetween: 0 },
                              320: { slidesPerView: 2, spaceBetween: 20 },
                              480: { slidesPerView: 3, spaceBetween: 20 },
                              640: { slidesPerView: 4, spaceBetween: 20 },
                              840: { slidesPerView: 6, spaceBetween: 20 },
                              1140: { slidesPerView: 6, spaceBetween: 20 },
                            }}
                            modules={[Autoplay, Navigation, Keyboard]}
                          >
                            {products.map((item: Product | Kit, i: number) => {
                              const product = item as Product;
                              const displayPrice = product.getPriceWithDiscount
                                ? product.getPriceWithDiscount()
                                : (product.saleMode === 'custom' && product.sellingPrices?.length > 0)
                                  ? product.sellingPrices[0]
                                  : product.sellingPrice;

                              const originalPrice = product.saleMode === 'custom' && product.sellingPrices?.length > 0
                                ? product.sellingPrices[0]
                                : product.sellingPrice;

                              return (
                                <SwiperSlide key={product.id || i}>
                                  <div className="product-item-wrapper">
                                    {/* Discount Ribbon for individual products */}
                                    {product.discount && (
                                      <div className="product-discount-ribbon">
                                        -₹{product.discount.discount} Off
                                      </div>
                                    )}
                                    <ProductBox
                                      layout="layout-one"
                                      id={Number(product.id)}
                                      name={product.name}
                                      img={product.img[0]}
                                      price={displayPrice}
                                      originalPrice={originalPrice}
                                      discount={product.discount?.discount || 0}
                                      rating={product.rating?.rating || 0}
                                      addCart={() => addToCart(product)}
                                      addWish={() => addToWish(product)}
                                      addCompare={() => addToCompare(product)}
                                      data={product}
                                      hasMultiplePrices={product.saleMode === 'custom' && product.sellingPrices?.length > 0}
                                    />
                                  </div>
                                </SwiperSlide>
                              );
                            })}
                          </Swiper>
                        )}
                      </div>
                    </div>
                  </TabPane>
                </TabContent>
              </Col>
            </Row>
          </div>
        </section>
      )}

      {/* No Products Found */}
      {!loading && activeRange !== null && products.length === 0 && (
        <section className="section-py-space">
          <div className="custom-container">
            <div className="text-center py-4">
              <h5>No products found</h5>
              <p>
                {(() => {
                  const currentIndex = dynamicRanges.findIndex(r => r === activeRange);
                  const previousPrice = currentIndex > 0 ? dynamicRanges[currentIndex - 1] : 0;

                  if (currentIndex === 0) {
                    return `No products available under ₹${activeRange.toLocaleString('en-IN')}.`;
                  } else {
                    return `No products available between ₹${previousPrice.toLocaleString('en-IN')} - ₹${activeRange.toLocaleString('en-IN')}.`;
                  }
                })()}
              </p>
              <button 
                className="btn btn-outline-primary" 
                onClick={() => {
                  setActiveRange(null);
                  setProducts([]);
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Default State */}
      {!loading && activeRange === null && (
        <section className="section-py-space">
          <div className="custom-container">
            <div className="text-center py-4">
              <h5>Select a Price Range</h5>
              <p>Choose a price range above to view products in that category.</p>
              <div className="mt-3">
                <span className="badge bg-light text-dark">
                  {allProducts.length} total products available
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default PriceRanges;