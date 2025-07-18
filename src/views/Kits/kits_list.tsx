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
import { useRouter } from "next/navigation";


interface KitsProps {
  kits?: Kit[];
}

const Kits: NextPage<KitsProps> = ({ kits = [] }) => {
const router = useRouter();
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
          <div className="cover-card-main-over kit-list">
            <Swiper
  
              mousewheel={true}
              keyboard={true}
              navigation={{
                      nextEl: '.swiper-button-next',
                      prevEl: '.swiper-button-prev',
                    }}
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
                320: { slidesPerView: 2, spaceBetween: 10 },
                480: { slidesPerView: kits.length > 2 ? 3 :kits.length, spaceBetween: 20 },
                640: { slidesPerView: 4, spaceBetween: 20 },
                840: { slidesPerView: 5, spaceBetween: 20 },
                1140: { slidesPerView: 6, spaceBetween: 20 },
              }}
             
              modules={[Navigation, Mousewheel, Keyboard]}
              
            >
              {kits.map((kit) => (
  <SwiperSlide key={kit.id} onClick={() => router.push(`/product-details/thumbnail-left?id=${kit.id}`,
        )}>
    <Link href="#"
      
      className="single-category-one height-180"
    >
      <div className="thumbnail-preview w-full ">
        <Media src={kit.img[0]} className="img-fluid" alt={kit.name} />
      </div>
       <p>{kit.name}</p>
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




