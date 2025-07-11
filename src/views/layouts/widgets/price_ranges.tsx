"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NextPage } from "next";
import { Col, Row, TabContent, TabPane } from "reactstrap";
import { Kit, Product, StorePriceRanges, objCache, searchController } from "@/app/globalProvider";
import { API } from "@/app/services/api.service";
import ProductBox from "./Product-Box/productbox";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CartContext } from "@/helpers/cart/cart.context";
import { CompareContext } from "@/helpers/compare/compare.context";
import { Navigation, Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

interface Props { priceRanges: StorePriceRanges | undefined; }

const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loading, setLoading] = useState({ initial: true, filter: false });
  const [error, setError] = useState<string | null>(null);

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const ranges = priceRanges?.price_ranges || [];

  const getPrice = useCallback((product: Product): number => {
    return product.getPriceWithDiscount?.() || 
           (product.saleMode === 'custom' && product.sellingPrices?.[0]) || 
           product.sellingPrice || 0;
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let products: Product[] = [];
        
        // Try API, then fallbacks
        const sources = [
          () => API.getAllProducts(),
          () => searchController?.getAllProducts?.(),
          () => objCache?.getAllProducts?.(),
          () => objCache?.getAllKits?.()
        ];

        for (const source of sources) {
          try {
            const res = await source();
            if (Array.isArray(res)) products = res;
            else if (res instanceof Map) products = Array.from(res.values()).flat();
            else if (res?.products || res?.data) products = res.products || res.data;
            if (products.length > 0) break;
          } catch {}
        }

        // Remove duplicates
        const unique = products.filter((p, i, arr) => 
          p?.id && arr.findIndex(x => x.id === p.id) === i
        );

        setAllProducts(unique);
        setError(unique.length === 0 ? "No products found" : null);
      } catch {
        setError("Failed to load products");
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    fetchProducts();
  }, []);

  // Filter products by price range
  const filterByRange = useCallback((range: number) => {
    if (!range) return;
    
    setLoading(prev => ({ ...prev, filter: true }));
    setActiveRange(range);

    const rangeIndex = ranges.findIndex(r => r === range);
    const minPrice = rangeIndex > 0 ? ranges[rangeIndex - 1] : 0;

    const filtered = allProducts.filter(product => {
      const price = getPrice(product);
      return price > 0 && (rangeIndex === 0 ? price <= range : price > minPrice && price <= range);
    }).sort((a, b) => getPrice(a) - getPrice(b));

    setFilteredProducts(filtered);
    setLoading(prev => ({ ...prev, filter: false }));
  }, [allProducts, ranges, getPrice]);

  const getRangeText = useCallback((range: number) => {
    const index = ranges.findIndex(r => r === range);
    const prevPrice = index > 0 ? ranges[index - 1] : 0;
    return index === 0 
      ? { main: `₹${range.toLocaleString('en-IN')}`, sub: "& below" }
      : { main: `₹${prevPrice.toLocaleString('en-IN')} - ₹${range.toLocaleString('en-IN')}`, sub: "range" };
  }, [ranges]);

  const clearSelection = () => { setActiveRange(null); setFilteredProducts([]); };

  // Render states
  if (loading.initial) return <div className="section-py-space"><div className="custom-container"><div className="text-center py-4">Loading products...</div></div></div>;
  
  if (error && !allProducts.length) return (
    <div className="section-py-space"><div className="custom-container"><div className="text-center py-4">
      <h5>Unable to load products</h5><p>{error}</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div></div></div>
  );

  if (!ranges.length) return <div className="section-py-space"><div className="custom-container"><div className="text-center py-4">No price ranges available.</div></div></div>;

  return (
    <>
      {/* Price Range Selection */}
      <section className="section-py-space rts-category-area">
        <div className="custom-container">
          <Row><Col className="pe-0">
            <div className="title-area-between">
              <h2 className="title-left">Shop by Price</h2>
              <div className="next-prev-swiper-wrapper price-range-nav">
                <div className="swiper-button-prev"><i className="fas fa-chevron-left"></i></div>
                <div className="swiper-button-next"><i className="fas fa-chevron-right"></i></div>
              </div>
            </div>
            
            <div className="cover-card-main-over">
              <Swiper
                navigation={{ nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }}
                spaceBetween={15} slidesPerView={6} autoplay={true}
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
                {ranges.map((range, i) => {
                  const { main, sub } = getRangeText(range);
                  return (
                    <SwiperSlide key={i}>
                      <div className="single-category-one">
                        <div onClick={() => filterByRange(range)} className={`price-range-card ${activeRange === range ? 'active' : ''}`}>
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
          </Col></Row>
        </div>
      </section>

      {/* Products Display */}
      {filteredProducts.length > 0 && (
        <section className="section-py-space ratio_asos product">
          <div className="custom-container">
            <Row><Col className="pe-0">
              <div className="title-area-between">
                <h2 className="title-left">
                  {(() => {
                    const index = ranges.findIndex(r => r === activeRange);
                    const prevPrice = index > 0 ? ranges[index - 1] : 0;
                    return index === 0 
                      ? `Products under ₹${activeRange?.toLocaleString('en-IN')}`
                      : `Products ₹${prevPrice.toLocaleString('en-IN')} - ₹${activeRange?.toLocaleString('en-IN')}`;
                  })()}
                  <span className="product-count ml-2">({filteredProducts.length})</span>
                </h2>
              </div>
              
              <TabContent activeTab="1">
                <TabPane tabId="1">
                  <div className="product product-slide-6 product-m no-arrow">
                    {loading.filter ? (
                      <div className="text-center py-4">Loading products...</div>
                    ) : (
                      <Swiper
                        slidesPerView={6} spaceBetween={30} autoplay={true}
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
                        {filteredProducts.map((product, i) => {
                          const price = getPrice(product);
                          const originalPrice = product.saleMode === 'custom' && product.sellingPrices?.[0] || product.sellingPrice;

                          return (
                            <SwiperSlide key={product.id || i}>
                              <div className="product-item-wrapper">
                                {product.discount && (
                                  <div className="product-discount-ribbon">-₹{product.discount.discount} Off</div>
                                )}
                                <ProductBox
                                  layout="layout-one" id={Number(product.id)} name={product.name} img={product.img[0]}
                                  price={price} originalPrice={originalPrice} discount={product.discount?.discount || 0}
                                  rating={product.rating?.rating || 0} addCart={() => addToCart(product)}
                                  addWish={() => addToWish(product)} addCompare={() => addToCompare(product)}
                                  data={product} hasMultiplePrices={product.saleMode === 'custom' && product.sellingPrices?.length > 0}
                                />
                              </div>
                            </SwiperSlide>
                          );
                        })}
                      </Swiper>
                    )}
                  </div>
                </TabPane>
              </TabContent>
            </Col></Row>
          </div>
        </section>
      )}

      {/* States: No Products, Default */}
      {!loading.filter && (
        <section className="section-py-space">
          <div className="custom-container">
            <div className="text-center py-4">
              {activeRange !== null && filteredProducts.length === 0 ? (
                <>
                  <h5>No products found</h5>
                  <p>No products available in the selected price range.</p>
                  <button className="btn btn-outline-primary" onClick={clearSelection}>Clear Selection</button>
                </>
              ) : activeRange === null ? (
                <>
                  <h5>Select a Price Range</h5>
                  <p>Choose a price range above to view products in that category.</p>
                  <span className="badge bg-light text-dark">{allProducts.length} total products available</span>
                </>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default PriceRanges;