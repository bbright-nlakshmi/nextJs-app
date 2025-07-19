import React, { useState, useEffect, useCallback } from "react";
import { NextPage } from "next";
import { Col, Row } from "reactstrap";
import { Kit, Product, StorePriceRanges, objCache, searchController } from "@/app/globalProvider";
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

const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loading, setLoading] = useState({ initial: true, filter: false });

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const ranges = priceRanges?.price_ranges || [];

  const getPrice = (item: ProductItem): number => (item as any).sellingPrice || 0;
  
  const getName = (item: ProductItem): string => {
    const itemAny = item as any;
    return itemAny.name || itemAny.title || itemAny.productName || `Product ${itemAny.productId || itemAny.id || 'Unknown'}`;
  };

  const getRating = (item: ProductItem): number => (item as any).rating || (item as any).averageRating || 0;

  const fetchAllProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, initial: true }));
      let fetchedProducts: ProductItem[] = [];

      // Get products from search controller
      if (searchController?.getAllProducts) {
        const searchResults = searchController.getAllProducts();
        // if (searchResults instanceof Map) {
        //   for (const products of searchResults.values()) {
        //     if (Array.isArray(products)) fetchedProducts.push(...products);
        //   }
        // } else if (Array.isArray(searchResults)) {
        //   fetchedProducts = searchResults;
        // }
      }

      // Get products from cache
      if (objCache?.getAllProducts) {
        const cachedProducts = objCache.getAllProducts();
        if (Array.isArray(cachedProducts)) fetchedProducts.push(...cachedProducts);
      }

      // Add kits and remove duplicates
      try {
        const kits = objCache?.getAllKits?.() || [];
        fetchedProducts.push(...kits);
      } catch {}

      const uniqueProducts = fetchedProducts.filter((item, index, self) => {
        const id = (item as any).productId || item.id;
        return id && self.findIndex(p => ((p as any).productId || p.id) === id) === index;
      });

      setAllProducts(uniqueProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setAllProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  };

  const filterByRange = useCallback((range: number) => {
    setLoading(prev => ({ ...prev, filter: true }));
    setActiveRange(range);

    const currentIndex = ranges.findIndex(r => r === range);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;

    const filtered = allProducts
      .filter(item => {
        const price = getPrice(item);
        return price > 0 && price > previousPrice && price <= range;
      })
      .sort((a, b) => getPrice(a) - getPrice(b));

    setFilteredProducts(filtered);
    setLoading(prev => ({ ...prev, filter: false }));
  }, [allProducts, ranges]);

  const getRangeText = (range: number) => {
    const currentIndex = ranges.findIndex(r => r === range);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    return currentIndex === 0
      ? { main: `₹${range.toLocaleString('en-IN')}`, sub: "& below" }
      : { main: `₹${previousPrice.toLocaleString('en-IN')} - ₹${range.toLocaleString('en-IN')}`, sub: "range" };
  };

  const getHeaderText = () => {
    if (!activeRange) return "";
    const currentIndex = ranges.findIndex(r => r === activeRange);
    const previousPrice = currentIndex > 0 ? ranges[currentIndex - 1] : 0;
    return currentIndex === 0
      ? `Products under ₹${activeRange.toLocaleString('en-IN')}`
      : `Products ₹${previousPrice.toLocaleString('en-IN')} - ₹${activeRange.toLocaleString('en-IN')}`;
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (allProducts.length > 0 && ranges.length > 0 && activeRange === null) {
      filterByRange(ranges[0]);
    }
  }, [allProducts, ranges, activeRange, filterByRange]);

  if (loading.initial) {
    return (
      <div className="section-py-space">
        <div className="product-box single-shopping-card-one">
          <div className="text-center py-4">Loading products...</div>
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
                  navigation={{ nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }}
                  spaceBetween={15}
                  slidesPerView={6}
                  autoplay={true}
                  breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 0 },
                    350: { slidesPerView: 2, spaceBetween: 10 },
                    480: { slidesPerView: 3, spaceBetween: 20 },
                    640: { slidesPerView: 4, spaceBetween: 20 },
                    840: { slidesPerView: 5, spaceBetween: 20 },
                    1140: { slidesPerView: 6, spaceBetween: 20 },
                  }}
                  modules={[Navigation, Autoplay, Keyboard]}
                >
                  {ranges.map((range, i) => {
                    const { main, sub } = getRangeText(range);
                    return (
                      <SwiperSlide key={i}>
                        <div className="single-category-one single-price-range">
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
              {getHeaderText()}
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
                        <SwiperSlide key={product.id || product.productId || i}>
                          <ProductBox
                            layout="layout-one"
                            data={{
                              ...product,
                              name: getName(product),
                              productId: product.productId || product.id,
                              img: product.img || product.images || product.image || (product.picture ? [product.picture] : ["/images/default.jpg"]),
                              rating: getRating(product),
                              reviewCount: product.reviewCount || product.totalReviews || Math.floor(Math.random() * 50 + 10),
                              sale: product.sale || product.onSale || false,
                              active: product.active !== false,
                              description: product.description || product.shortDescription || "High quality product.",
                              brand: product.brand || product.manufacturer || "",
                              category: product.category || product.categoryName || "",
                              stock: product.stock || product.quantity || product.available || true,
                              originalPrice: product.originalPrice || product.mrp,
                              discount: product.discount || product.discountPercentage,
                            }}
                            newLabel={product.new}
                            item={product}
                            hoverEffect={'icon-inline'}
                            price={getPrice(product)}
                            addCart={() => addToCart(product)}
                            addCompare={() => addToCompare(product)}
                            addWish={() => addToWish(product)}
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

      {/* States: No Products, Default */}
      {!loading.filter && activeRange !== null && filteredProducts.length === 0 && (
        <section className="section-py-space">
          <div className="product-box single-shopping-card-one">
            <div className="text-center py-4">
              <h5>No products found</h5>
              <p>No products available in the selected price range.</p>
              <button className="btn btn-outline-primary" onClick={() => setActiveRange(null)}>
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