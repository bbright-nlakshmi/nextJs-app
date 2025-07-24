"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import {
  objCache,
  Product,
  appConfig,
  searchController,
} from "@/app/globalProvider";
import ProductBox from "../../layouts/widgets/Product-Box/productbox";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CartContext } from "@/helpers/cart/cart.context";
import { CompareContext } from "@/helpers/compare/compare.context";

const RecentlyAddedProducts: React.FC = () => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const getPrice = (productId: string) => {
    const price = searchController.getDetails(productId, "getPrice");

    return price;
  };

  // Function to handle adding item to cart with price included
  const handleAddToCart = (item: any, qty = 1) => {
    const cartItem = {
      ...item,
      price: item.getPrice(),
      id: item.id,
    };
    addToCart(cartItem, qty);
  };

  useEffect(() => {
    // Get recently added products
    const products = objCache.getRecentlyAddedProducts(8);
    console.log("Recently added products:", products);
    setRecentProducts(products);
    setLoading(false);

    // Listen for updates in case new products are added
    const updateHandler = () => {
      const updatedProducts = objCache.getRecentlyAddedProducts(8);
      setRecentProducts(updatedProducts);
    };

    objCache.on("update", updateHandler);

    return () => {
      objCache.off("update", updateHandler);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading recent products...</div>;
  }

  if (recentProducts.length === 0) {
    return (
      <div className="text-center py-4">No recently added products found.</div>
    );
  }

  return (
    <div className="section-pt-space">
      <div className="custom-container title-area-between">
        <h2 className="title-left">New Products</h2>
        <div className="next-prev-swiper-wrapper">
          <div className="swiper-button-prev">
            <i className="fa-regular fa-chevron-left" />
          </div>
          <div className="swiper-button-next">
            <i className="fa-regular fa-chevron-right" />
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="product product-slide-6 product-m no-arrow">
              <Swiper
                navigation={{
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                }}
                spaceBetween={20}
                slidesPerView={6}
                loop={false}
                speed={2000}
                autoplay={{
                  delay: 3000,
                  pauseOnMouseEnter: false,
                }}
                className="mySwiper-category-1 swiper-data"
                breakpoints={appConfig.mediaQueries}
                modules={[Navigation, Autoplay]}
              >
                {recentProducts.map((product: Product) => (
                  <SwiperSlide key={product.id}>
                    <ProductBox
                      id={Number(product.id)}
                      name={product.name}
                      img={product.img}
                      price={product.getPrice()}
                      hoverEffect={"icon-inline"}
                      discount={product.discount?.discount || 0}
                      rating={product.rating?.calculateRating() || 0}
                      addCart={handleAddToCart}
                      addCompare={() => addToCompare(product)}
                      addWish={() => addToWish(product)}
                      data={product}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentlyAddedProducts;
