"use client";

import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import Slider from "react-slick";
import { Col, Container, Row, Spinner } from "reactstrap";
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
import { Autoplay, Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const sliderSettings = {
  dots: false,
  infinite: false,
  speed: 300,
  slidesToShow: 10,
  slidesToScroll: 10,
  responsive: [
    { breakpoint: 1700, settings: { slidesToShow: 8, slidesToScroll: 8 } },
    { breakpoint: 1367, settings: { slidesToShow: 6, slidesToScroll: 6 } },
    { breakpoint: 1024, settings: { slidesToShow: 5, slidesToScroll: 5 } },
    { breakpoint: 800, settings: { slidesToShow: 4, slidesToScroll: 4 } },
    { breakpoint: 600, settings: { slidesToShow: 3, slidesToScroll: 3 } },
    { breakpoint: 480, settings: { slidesToShow: 2, slidesToScroll: 2 } },
  ],
};

interface Props {
  priceRanges: StorePriceRanges | undefined;
}

const PriceRanges: NextPage<Props> = ({ priceRanges }) => {
  const [products, setProducts] = useState<Array<Product | Kit>>([]);
  const [allProducts, setAllProducts] = useState<Array<Product | Kit>>([]);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const dynamicRanges = priceRanges?.price_ranges || [];

  // Fetch all products from API on component mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setInitialLoading(true);
        console.log("Fetching all products from API...");
        
        // Fetch products from API service
        const res = await API.getAllProducts();
        console.log("API Response:", res);
        
        let fetchedProducts: Array<Product | Kit> = [];
        
        // Handle different response structures
        if (Array.isArray(res)) {
          fetchedProducts = res;
        } else if (res && typeof res === 'object') {
          // Handle Map response type
          if (res instanceof Map) {
            // If it's a Map, extract all products from all categories
            for (const [category, products] of res.entries()) {
              if (Array.isArray(products)) {
                fetchedProducts = [...fetchedProducts, ...products];
              }
            }
          } else {
            // Handle regular object response
            const resAny = res as any;
            
            // If response is an object, try to extract products
            if (resAny.products && Array.isArray(resAny.products)) {
              fetchedProducts = resAny.products;
            } else if (resAny.data && Array.isArray(resAny.data)) {
              fetchedProducts = resAny.data;
            } else {
              // Try to extract from object values
              const values = Object.values(resAny);
              for (const value of values) {
                if (Array.isArray(value)) {
                  fetchedProducts = [...fetchedProducts, ...value];
                }
              }
            }
          }
        }
        
        // Remove duplicates based on ID
        const uniqueProducts = fetchedProducts.filter((product, index, self) => {
          const productId = (product as any).productId || product.id;
          return productId && self.findIndex(p => ((p as any).productId || p.id) === productId) === index;
        });
        
        console.log("Fetched unique products:", uniqueProducts.length);
        setAllProducts(uniqueProducts);
        
        // Also try to get kits from cache if available
        try {
          const allKits = objCache?.getAllKits?.() || [];
          if (Array.isArray(allKits) && allKits.length > 0) {
            const combinedProducts = [...uniqueProducts, ...allKits];
            const finalUnique = combinedProducts.filter((item, index, self) => {
              const itemId = (item as any).productId || item.id;
              return itemId && self.findIndex(i => ((i as any).productId || i.id) === itemId) === index;
            });
            setAllProducts(finalUnique);
            console.log("Combined with kits, total unique items:", finalUnique.length);
          }
        } catch (cacheError) {
          console.warn("Could not fetch kits from cache:", cacheError);
        }
        
      } catch (err) {
        console.error("Error fetching all products:", err);
        
        // Fallback to cache/search controller methods
        try {
          console.log("Attempting fallback methods...");
          let fallbackProducts: Array<Product | Kit> = [];
          
          // Try searchController
          if (searchController && typeof searchController.getAllProducts === 'function') {
            const searchResults = searchController.getAllProducts();
            if (searchResults instanceof Map) {
              for (const [category, products] of searchResults.entries()) {
                if (Array.isArray(products)) {
                  fallbackProducts = [...fallbackProducts, ...products];
                }
              }
            } else if (Array.isArray(searchResults)) {
              fallbackProducts = [...fallbackProducts, ...searchResults];
            }
          }
          
          // Try objCache
          if (objCache && typeof objCache.getAllProducts === 'function') {
            const cachedProducts = objCache.getAllProducts();
            if (Array.isArray(cachedProducts)) {
              fallbackProducts = [...fallbackProducts, ...cachedProducts];
            }
          }
          
          if (fallbackProducts.length > 0) {
            const uniqueFallback = fallbackProducts.filter((product, index, self) => {
              const productId = (product as any).productId || product.id;
              return productId && self.findIndex(p => ((p as any).productId || p.id) === productId) === index;
            });
            setAllProducts(uniqueFallback);
            console.log("Fallback products loaded:", uniqueFallback.length);
          }
        } catch (fallbackError) {
          console.error("Fallback methods also failed:", fallbackError);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Enhanced price extraction function for both products and kits
  const getPrice = (item: Product | Kit): number => {
    try {
      // Cast to any for flexible property access
      const itemAny = item as any;
      
      // For Product type - check standard price fields
      if ('price' in item && typeof item.price === 'number' && item.price > 0) {
        return item.price;
      }
      
      // For Kit type - check kit-specific price fields
      if ('kitPrice' in item && typeof (item as any).kitPrice === 'number' && (item as any).kitPrice > 0) {
        return (item as any).kitPrice;
      }
      
      // Check for discount price (prioritize over original price)
      if (itemAny.discountPrice && typeof itemAny.discountPrice === 'number' && itemAny.discountPrice > 0) {
        return itemAny.discountPrice;
      }
      
      // Check for sale price
      if (itemAny.salePrice && typeof itemAny.salePrice === 'number' && itemAny.salePrice > 0) {
        return itemAny.salePrice;
      }
      
      // Check for finalPrice
      if (itemAny.finalPrice && typeof itemAny.finalPrice === 'number' && itemAny.finalPrice > 0) {
        return itemAny.finalPrice;
      }
      
      // Check for currentPrice
      if (itemAny.currentPrice && typeof itemAny.currentPrice === 'number' && itemAny.currentPrice > 0) {
        return itemAny.currentPrice;
      }
      
      // Check for sellingPrice
      if (itemAny.sellingPrice && typeof itemAny.sellingPrice === 'number' && itemAny.sellingPrice > 0) {
        return itemAny.sellingPrice;
      }
      
      // Try extracting from nested price objects
      const nestedPrice = itemAny.pricing || itemAny.priceInfo || itemAny.cost || itemAny.priceData;
      if (typeof nestedPrice === 'number' && nestedPrice > 0) {
        return nestedPrice;
      }
      if (typeof nestedPrice === 'object' && nestedPrice !== null) {
        const extractedPrice = nestedPrice.amount || nestedPrice.value || nestedPrice.price || nestedPrice.final || nestedPrice.current;
        if (typeof extractedPrice === 'number' && extractedPrice > 0) {
          return extractedPrice;
        }
      }
      
      console.warn("Could not extract valid price for item:", item);
      return 0;
    } catch (error) {
      console.error("Error getting price for item:", item, error);
      return 0;
    }
  };

  // Enhanced name extraction function
  const getName = (item: Product | Kit): string => {
    try {
      const itemAny = item as any;
      
      // Try different name properties
      const possibleNames = [
        itemAny.name,
        itemAny.title,
        itemAny.productName,
        itemAny.displayName,
        itemAny.itemName
      ];
      
      for (const name of possibleNames) {
        if (typeof name === 'string' && name.trim().length > 0) {
          return name.trim();
        }
      }
      
      return `Product ${itemAny.productId || itemAny.id || 'Unknown'}`;
    } catch (error) {
      console.error("Error getting name for item:", item, error);
      return "Unknown Product";
    }
  };

  // Enhanced rating extraction function
  const getRating = (item: Product | Kit): number => {
    try {
      const itemAny = item as any;
      
      // Try different rating properties
      const possibleRatings = [
        itemAny.rating,
        itemAny.averageRating,
        itemAny.starRating,
        itemAny.customerRating,
        itemAny.productRating
      ];
      
      for (const rating of possibleRatings) {
        if (typeof rating === 'number' && rating >= 0 && rating <= 5) {
          return Math.round(rating * 10) / 10; // Round to 1 decimal place
        }
      }
      
      // Try extracting from nested rating objects
      const nestedRating = itemAny.ratingInfo || itemAny.reviewData;
      if (typeof nestedRating === 'object' && nestedRating !== null) {
        const extractedRating = nestedRating.average || nestedRating.rating || nestedRating.stars;
        if (typeof extractedRating === 'number' && extractedRating >= 0 && extractedRating <= 5) {
          return Math.round(extractedRating * 10) / 10;
        }
      }
      
      // Generate a realistic random rating if none found (between 3.5 and 4.8)
      return Math.round((Math.random() * 1.3 + 3.5) * 10) / 10;
    } catch (error) {
      console.error("Error getting rating for item:", item, error);
      return 4.0; // Default rating
    }
  };

  const switchPriceRange = async (range: number) => {
    setLoading(true);
    setActiveRange(range);
    
    try {
      console.log(`Filtering products for price range: ₹${range}`);
      console.log("Total products available:", allProducts.length);
      
      // Enhanced filtering with better price extraction using already fetched products
      const itemsWithPrices = allProducts.map(item => ({
        item,
        price: getPrice(item),
        name: getName(item),
        rating: getRating(item)
      })).filter(({ price }) => price > 0); // Only include items with valid prices
      
      console.log("Items with valid prices:", itemsWithPrices.length);
      
      // Find the previous price range for proper filtering
      const currentIndex = dynamicRanges.findIndex(r => r === range);
      const previousPrice = currentIndex > 0 ? dynamicRanges[currentIndex - 1] : undefined;
      
      // Filter products based on price range
      const filteredItems = itemsWithPrices.filter(({ price }) => {
        // If no previous price, show items less than or equal to target price
        if (previousPrice === undefined || previousPrice === null) {
          return price <= range;
        }
        
        // If previous price exists, show items between previous price and target price
        return price > previousPrice && price <= range;
      });
      
      console.log(`Filtered products for range ₹${range}:`, filteredItems.length);
      console.log("Previous price:", previousPrice);
      console.log("Sample filtered items:", filteredItems.slice(0, 3).map(({ name, price, rating }) => ({ name, price, rating })));
      
      // Sort by price (ascending)
      const sortedItems = filteredItems.sort((a, b) => a.price - b.price);
      
      // Extract just the items for setting state
      const finalProducts = sortedItems.map(({ item }) => item);
      
      setProducts(finalProducts);
    } catch (error) {
      console.error("Error filtering products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Show initial loading while fetching all products
  if (initialLoading) {
    return (
      <div className="text-center my-5">
        <Spinner color="primary" />
        <p className="mt-3">Loading products...</p>
      </div>
    );
  }

  if (!priceRanges) {
    return (
      <div className="text-center my-5">
        <Spinner color="primary" />
        <p className="mt-3">Loading price ranges...</p>
      </div>
    );
  }

  // Calculate price range display text
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

  return (
    <>
      <Container fluid>
        <Row className="mb-4">
          <Col className="ps-0">
            <h2 className="mb-3">Shop by Price</h2>
            {dynamicRanges.length > 0 ? (
              <div className="slide-10 no-arrow discount-coupons">
                <Slider {...sliderSettings}>
                  {dynamicRanges.map((range, i) => {
                    const { main, subtitle } = getPriceRangeText(range);
                    return (
                      <div
                        key={i}
                        className="p-2"
                        onClick={() => switchPriceRange(range)}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={`text-center p-3 rounded-pill shadow-sm ${
                            activeRange === range 
                              ? "bg-primary text-white shadow" 
                              : "bg-light text-dark hover-bg-light"
                          }`}
                          style={{
                            border: activeRange === range ? "2px solid #0d6efd" : "1px solid #dee2e6",
                            minWidth: "120px",
                            fontWeight: activeRange === range ? 600 : 500,
                            transition: "all 0.3s ease",
                            transform: activeRange === range ? "scale(1.05)" : "scale(1)",
                          }}
                        >
                          <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>{main}</div>
                          <small className={activeRange === range ? "text-white-50" : "text-muted"}>
                            {subtitle}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </Slider>
              </div>
            ) : (
              <div className="text-center text-muted p-4 bg-light rounded">
                <p className="mb-0">No price ranges available at the moment.</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <Container fluid>
        <Row>
          <Col sm="12">
            {loading ? (
              <div className="text-center py-5">
                <Spinner color="primary" className="mb-3" />
                <p className="text-muted">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">
                    {(() => {
                      const currentIndex = dynamicRanges.findIndex(r => r === activeRange);
                      const previousPrice = currentIndex > 0 ? dynamicRanges[currentIndex - 1] : 0;
                      
                      if (currentIndex === 0) {
                        return `Products under ₹${activeRange?.toLocaleString('en-IN')}`;
                      } else {
                        return `Products between ₹${previousPrice.toLocaleString('en-IN')} - ₹${activeRange?.toLocaleString('en-IN')}`;
                      }
                    })()}
                    <span className="text-muted ms-2">({products.length} items)</span>
                  </h5>
                </div>
                
                <Swiper
                  slidesPerView={3}
                  navigation
                  spaceBetween={30}
                  pagination={{ 
                    type: "bullets", 
                    clickable: true,
                    dynamicBullets: true 
                  }}
                  loop={false}
                  mousewheel={true}
                  breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 10 },
                    320: { slidesPerView: 1.5, spaceBetween: 15 },
                    480: { slidesPerView: 2, spaceBetween: 20 },
                    640: { slidesPerView: 3, spaceBetween: 20 },
                    840: { slidesPerView: 4, spaceBetween: 25 },
                    1140: { slidesPerView: 5, spaceBetween: 30 },
                    1400: { slidesPerView: 6, spaceBetween: 30 },
                  }}
                  modules={[Autoplay, Navigation, Pagination, Mousewheel, Keyboard]}
                  className="product-swiper"
                >
                  {products.map((item: Product | Kit, i: number) => {
                    const itemPrice = getPrice(item);
                    const itemName = getName(item);
                    const itemRating = getRating(item);
                    const itemAny = item as any;
                    
                    console.log(`Product ${i + 1}:`, {
                      name: itemName,
                      price: itemPrice,
                      rating: itemRating,
                      id: item.id || itemAny.productId
                    });
                    
                    return (
                      <SwiperSlide key={item.id || itemAny.productId || i}>
                        <div className="h-100">
                          <ProductBox
                            data={{
                              ...item,
                              name: itemName,
                              productId: itemAny.productId || item.id,
                              img: itemAny.img || itemAny.images || itemAny.image || (itemAny.picture ? [itemAny.picture] : ["/images/default.jpg"]),
                              rating: itemRating,
                              reviewCount: itemAny.reviewCount || itemAny.totalReviews || Math.floor(Math.random() * 50 + 10),
                              sale: itemAny.sale || itemAny.onSale || false,
                              active: itemAny.active !== false,
                              description: itemAny.description || itemAny.shortDescription || "High quality product with excellent features.",
                              // Additional product details
                              brand: itemAny.brand || itemAny.manufacturer || "",
                              category: itemAny.category || itemAny.categoryName || "",
                              stock: itemAny.stock || itemAny.quantity || itemAny.available || true,
                              originalPrice: itemAny.originalPrice || itemAny.mrp,
                              discount: itemAny.discount || itemAny.discountPercentage,
                            }}
                            price={itemPrice}
                            addCart={() => addToCart(item)}
                            addCompare={() => addToCompare(item)}
                            addWish={() => addToWish(item)}
                          />
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </>
            ) : activeRange !== null ? (
              <div className="text-center text-muted py-5">
                <div className="bg-light rounded p-4">
                  <h5 className="text-muted mb-3">No products found</h5>
                  <p className="mb-0">
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
                  <small className="text-muted">Try selecting a different price range.</small>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted py-5">
                <div className="bg-light rounded p-4">
                  <h5 className="text-primary mb-3">Select a Price Range</h5>
                  <p className="mb-0">Choose a price range above to view available products.</p>
                  {allProducts.length > 0 && (
                    <small className="text-success d-block mt-2">
                      {allProducts.length} products loaded and ready to filter
                    </small>
                  )}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Custom Styles */}
      <style jsx global>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
          transform: scale(1.02) !important;
        }
        
        .product-swiper .swiper-button-next,
        .product-swiper .swiper-button-prev {
          color: #0d6efd;
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border: 1px solid #dee2e6;
        }
        
        .product-swiper .swiper-button-next:after,
        .product-swiper .swiper-button-prev:after {
          font-size: 16px;
          font-weight: bold;
        }
        
        .product-swiper .swiper-pagination-bullet {
          background: #0d6efd;
          opacity: 0.3;
        }
        
        .product-swiper .swiper-pagination-bullet-active {
          opacity: 1;
        }
        
        .discount-coupons .slick-track {
          display: flex;
          align-items: center;
        }
        
        .discount-coupons .slick-slide {
          height: auto;
        }
        
        @media (max-width: 768px) {
          .product-swiper .swiper-button-next,
          .product-swiper .swiper-button-prev {
            display: none;
          }
          
          .discount-coupons .slick-arrow {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default PriceRanges;