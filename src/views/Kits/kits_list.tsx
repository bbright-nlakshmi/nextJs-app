import { NextPage } from "next";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Media, Row } from "reactstrap";
import { Grid, Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/grid";
import { Category, Kit, ObjCache } from "@/app/globalProvider";
import { takeLast } from "rxjs";


interface KitsProps {
  kits?: Kit[];
}

const Kits: NextPage<KitsProps> = ({ kits = [] }) => {

  if (!kits.length) {
    return (
      <section className="collection-banner section-pb-space">
        <div className="custom-container">
          <Row>
            <Col>
              <p>No kits available</p>
            </Col>
          </Row>
        </div>
      </section>
    );
  }

  return (<>
       <section className="w-full rts-category-area section-py-space">
        <div className="custom-container">
            
                <h2 className="title-left mb--0">Popular Kits</h2>
                <div className="next-prev-swiper-wrapper">
                  <div className="swiper-button-prev">
                    <i className="fa-regular fa-chevron-left"></i>
                  </div>
                  <div className="swiper-button-next">
                    <i className="fa-regular fa-chevron-right"></i>
                  </div>
                </div>
             
          </div>
        <div className="custom-container">
          <div className="cover-card-main-over">
            <Swiper
  
              mousewheel={true}
              keyboard={true}
              pagination={{ type: "bullets", clickable: true }}
              spaceBetween={20}
              slidesPerView={6}
              loop={true}
              speed={2000}
              autoplay={{
                delay: 4000,
              }}
              className="mySwiper-category-1 swiper-data"
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 0 },
                320: { slidesPerView: 3, spaceBetween: 10 },
                480: { slidesPerView: 3, spaceBetween: 20 },
                640: { slidesPerView: 4, spaceBetween: 20 },
                840: { slidesPerView: 5, spaceBetween: 20 },
                1140: { slidesPerView: 6, spaceBetween: 20 },
              }}
              navigation={true}
              modules={[Navigation, Mousewheel, Keyboard]}
              
            >
              {kits.map((kit) => (
  <SwiperSlide key={kit.id}>
    <Link
      href={{
        pathname: "/product-details/thumbnail-left",
        query: { id: kit.id },
      }}
      className="single-category-one height-180"
    >
      <div className="thumbnail-preview w-full ">
        <Media src={kit.img[0]} className="img-fluid" alt={kit.name} />
        <p>{kit.name}</p>
      </div>
    </Link>
  </SwiperSlide>
))}
  
            </Swiper>
          </div>
        </div>
      </section>
   </> );
      }
  

export default Kits;




