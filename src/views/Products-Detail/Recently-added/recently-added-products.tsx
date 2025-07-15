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
                  nextEl: '.swiper-button-next',
                  prevEl: '.swiper-button-prev',
                }}
                spaceBetween={20}
                slidesPerView={6}
                loop={false}
                speed={2000}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                className="mySwiper-category-1 swiper-data"
                breakpoints={{
                  0: { slidesPerView: 1, spaceBetween: 0 },
                  320: { slidesPerView: 2, spaceBetween: 10 },
                  480: { slidesPerView: 3, spaceBetween: 20 },
                  640: { slidesPerView: 4, spaceBetween: 20 },
                  840: { slidesPerView: 5, spaceBetween: 20 },
                  1140: { slidesPerView: 6, spaceBetween: 20 },
                }}

                modules={[Navigation, Autoplay]}
              >
                {recentProducts.map((product) => (
                  <SwiperSlide key={product.id}>
                    
                    <ProductBox
                      id={Number(product.id)}
                      name={product.name}
                      img={product.img[0]}
                      price={product.sellingPrice}
                      hoverEffect={'icon-inline'}
                      discount={product.discount?.discount || 0}
                      rating={product.rating?.rating || 0}
                      addCart={() => console.log('Add to cart', product.id)}
                      addWish={() => console.log('Add to wishlist', product.id)}
                      addCompare={() => console.log('Add to compare', product.id)}
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