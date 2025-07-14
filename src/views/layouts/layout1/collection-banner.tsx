import { NextPage } from "next";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Media, Row } from "reactstrap";
import { Grid, Navigation, Pagination, Mousewheel, Keyboard, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/grid";
import { Category, Product } from "@bbright-nlakshmi/rupeecom-services";

import router from "next/router";

interface Props {
  categories: Category[];
  categoryProducts:Product[];
}

const CollectionBanner: NextPage<Props> = ({ categories,categoryProducts }) => {

  const handleClickEvent = (id: string) => {
    router.push(`/product-details/${id}`);
  }

  if (categories.length) {
    return (<>
      <section className="w-full rts-category-area section-py-space">
        <div className="custom-container title-area-between">
          <h2 className="title-left">Featured Categories</h2>
          <div className="next-prev-swiper-wrapper" >
            <div className="swiper-button-prev"><i className="fa-regular fa-chevron-left"></i></div>
            <div className="swiper-button-next"><i className="fa-regular fa-chevron-right"></i></div>
          </div>
        </div>
        <div className="custom-container">
          <div className="cover-card-main-over">
            <Swiper
              navigation={{
                      nextEl: '.swiper-button-next',
                      prevEl: '.swiper-button-prev',
                    }}
              spaceBetween={20}
              slidesPerView={6}
              loop={false}
              speed={2000}
              // autoplay={{
              //   delay: 4000,
              // }}
              className="mySwiper-category-1 swiper-data"
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 0 },
                320: { slidesPerView: 3, spaceBetween: 10 },
                480: { slidesPerView: 4, spaceBetween: 20 },
                640: { slidesPerView: 4, spaceBetween: 20 },
                840: { slidesPerView: 5, spaceBetween: 20 },
                1140: { slidesPerView: 6, spaceBetween: 20 },
              }}
              
              modules={[ Navigation]}

            >
              {
                categories.map((item) => (
                  <SwiperSlide key={item.id}>
                    <div className="single-category-one height-180" >
                      <Link

                        href={{
                          pathname: "/collections/no-sidebar",
                          query: { id: item.id, type: "category" },
                        }}
                      >
                        <Media src={item.img[0]} className="img-fluid" alt={item.name} />

                        <p>{item.name}</p>
                      </Link>
                    </div>
                  </SwiperSlide>
                ))
              }


            </Swiper>
          </div>
        </div>
      </section>
    </>);
  }
};

export default CollectionBanner;




