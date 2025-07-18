
import React, { useState, useEffect, useCallback } from "react";
import { NextPage } from "next";
import { Col, Row} from "reactstrap";
import {  Product, StorePriceRanges, objCache, searchController } from "@/app/globalProvider";
import ProductBox from "./Product-Box/productbox";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CartContext } from "@/helpers/cart/cart.context";
import { CompareContext } from "@/helpers/compare/compare.context";
import { Navigation, Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

interface Props {
  priceRanges: StorePriceRanges;
}

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
    return searchController.getDetails(product.id, "getPrice") ||
      product.getPriceWithDiscount?.() ||
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

          () => searchController?.getAllProducts?.(),
          () => objCache?.getAllProducts?.(),
          () => objCache?.getAllKits?.()
        ];

        for (const source of sources) {
          try {
            const res: any = await source();
            if (res) {
              if (Array.isArray(res)) {
                products = res as Product[];
              } else if (res instanceof Map) {
                const mapValues = Array.from(res.values());
                products = mapValues.flat() as Product[];
              } else if (res && typeof res === 'object') {
                if (res.products && Array.isArray(res.products)) {
                  products = res.products as Product[];
                } else if (res.data && Array.isArray(res.data)) {
                  products = res.data as Product[];
                }
              }
              if (products.length > 0) break;
            }
          } catch (error) {
            console.warn('Failed to fetch from source:', error);
          }
        }

        // Remove duplicates and filter valid products
        const unique = products.filter((p, i, arr) =>
          p && p.id && arr.findIndex(x => x && x.id === p.id) === i
        );

        setAllProducts(unique);
        setError(unique.length === 0 ? "No products found" : null);
      } catch (error) {
        console.error('Error fetching products:', error);
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

  const clearSelection = () => {
    setActiveRange(null);
    setFilteredProducts([]);
  };

  // Render states
  if (loading.initial) {
    return (
      <div className="section-py-space">
        <div className="product-box single-shopping-card-one">
          <div className="text-center py-4">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error && !allProducts.length) {
    return (
      <div className="section-py-space">
        <div className="product-box single-shopping-card-one">
          <div className="text-center py-4">
            <h5>Unable to load products</h5>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ranges.length) {
    return (
      <div className="section-py-space">
        <div className="product-box single-shopping-card-one">
          <div className="text-center py-4">No price ranges available.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Price Range Selection */}
      <section className="section-py-space rts-category-area">
        <div className="product-box">
          <Row>
            <Col className="pe-0">
              <div className="custom-container title-area-between">
                <h2 className="title-left">Shop by Price</h2>
              </div>

              <div className="cover-card-main-over">
                <Swiper
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
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
                        <div className="single-category-one single-price-range ">
                          <div
                            onClick={() => filterByRange(range)}
                            className={`price-range-card ${activeRange === range ? 'active' : ''}`}
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

      {/* Products Display */}
      {filteredProducts.length > 0 && (
        <section className="section-py-space ratio_asos product">

          <div className="custom-container title-area-between">
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

          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="product product-slide-6 product-m no-arrow">
                  {loading.filter ? (
                    <div className="text-center py-4">Loading products...</div>
                  ) : (
                    <Swiper
                      slidesPerView={6}
                      spaceBetween={30}
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
                      {filteredProducts.map((product: any, i: number) => (
                        <SwiperSlide key={product.id || i}>
                          {/* <div className="product"> */}
                          <ProductBox
                            layout="layout-one"
                            data={product}
                            newLabel={product.new}
                            item={product}
                            hoverEffect={'icon-inline'}
                            price={getPrice(product)}
                            addCart={() => addToCart(product)}
                            addCompare={() => addToCompare(product)}
                            addWish={() => addToWish(product)}
                          />
                          {/* </div> */}
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

      {/* States: No Products, Default */}
      {!loading.filter && (
        <section className="section-py-space">
          <div className="product-box single-shopping-card-one">
            <div className="text-center py-4">
              {activeRange !== null && filteredProducts.length === 0 ? (
                <>
                  <h5>No products found</h5>
                  <p>No products available in the selected price range.</p>
                  <button className="btn btn-outline-primary" onClick={clearSelection}>
                    Clear Selection
                  </button>
                </>
              ) : activeRange === null ? (
                <>
                  <h5>Select a Price Range</h5>
                  <p>Choose a price range above to view products in that category.</p>
                  <span className="badge bg-light text-dark">
                    {allProducts.length} total products available
                  </span>
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