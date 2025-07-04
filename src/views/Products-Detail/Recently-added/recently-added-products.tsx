"use client"
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { objCache, Product } from '@/app/globalProvider';
import ProductBox from '../../layouts/widgets/Product-Box/productbox';

const RecentlyAddedProducts: React.FC = () => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get recently added products
    const products = objCache.getRecentlyAddedProducts(8);
    setRecentProducts(products);
    setLoading(false);

    // Listen for updates in case new products are added
    const updateHandler = () => {
      const updatedProducts = objCache.getRecentlyAddedProducts(8);
      setRecentProducts(updatedProducts);
    };

    objCache.on('update', updateHandler);

    return () => {
      objCache.off('update', updateHandler);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading recent products...</div>;
  }

  if (recentProducts.length === 0) {
    return <div className="text-center py-4">No recently added products found.</div>;
  }

  return (
    <div className="rts-grocery-feature-area rts-section-gapBottom">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="title-area-between">
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
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="category-area-main-wrapper-one">
              <Swiper
                modules={[Navigation, Autoplay]}
                scrollbar={{ hide: true }}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                loop={true}
                navigation={{
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                }}
                className="mySwiper-category-1"
                breakpoints={{
                  0: { slidesPerView: 1, spaceBetween: 30 },
                  320: { slidesPerView: 2, spaceBetween: 30 },
                  480: { slidesPerView: 3, spaceBetween: 30 },
                  640: { slidesPerView: 3, spaceBetween: 30 },
                  840: { slidesPerView: 4, spaceBetween: 30 },
                  1140: { slidesPerView: 6, spaceBetween: 30 },
                }}
              >
                {recentProducts.map((product) => (
                  <SwiperSlide key={product.id}>
                    <div className="single-shopping-card-one w-full max-w-[250px]">
                      <ProductBox
                        id={Number(product.id)}
                        name={product.name}
                        img={product.img[0]}
                        price={product.sellingPrice}
                        discount={product.discount?.discount || 0}
                        rating={product.rating?.rating || 0}
                        addCart={() => console.log('Add to cart', product.id)}
                        addWish={() => console.log('Add to wishlist', product.id)}
                        addCompare={() => console.log('Add to compare', product.id)}
                        data={product}
                      />
                    </div>
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