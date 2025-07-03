import { NextPage } from "next";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { Col, Media, Row } from "reactstrap";
import { API, BannerModel, ObjCache } from '@/app/globalProvider'



interface ButtonProps {
  id: number;
  text: string;
  link: string;
  type: string;
}

const SliderButtons: React.FC<{ buttons: ButtonProps[] }> = ({ buttons }) => {
  return buttons.map(({ id, link, text }) => (
    <a target="_blank" key={id} href={link}>
      <span>{text}</span>
    </a>
  ));
};




// Swiper components, modules and styles
import { Autoplay, Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Our custom button component
//import SliderButtons from "./SliderButtons";

interface Slide {
  id: number;
  title: string;
  tagline: string;
  image: string;
  buttons: ButtonProps[];
}

interface ButtonProps {
  id: number;
  text: string;
  link: string;
  type: string;
}

interface SliderProps {
  banners: BannerModel[] | undefined;
}

const SliderBanner: NextPage<SliderProps> = ({ banners }) => {
  if (banners)
    return (
      <div className="background-light-gray-color ptb--30 bg_light-1 pt_sm--20">
        {/* rts banner area start */}
        <div className="rts-banner-area-one mb--30">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="category-area-main-wrapper-one">

                  <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={1}
                    slidesPerView={1}
                    loop={true}
                    speed={2000}
                    autoplay={{
                      delay: 4000,
                    }}
                    navigation={{
                      nextEl: '.swiper-button-next',
                      prevEl: '.swiper-button-prev',
                    }}
                    breakpoints={{
                      0: { slidesPerView: 1, spaceBetween: 0 },
                      320: { slidesPerView: 1, spaceBetween: 0 },
                      480: { slidesPerView: 1, spaceBetween: 0 },
                      640: { slidesPerView: 1, spaceBetween: 0 },
                      840: { slidesPerView: 1, spaceBetween: 0 },
                      1140: { slidesPerView: 1, spaceBetween: 0 },
                    }}
                  >
                    {banners.map((item) => (
                      <SwiperSlide>

                        <Media src={item.img[0]} className="bg-img  img-fluid" alt={item.name} />

                      </SwiperSlide>
                    ))}
                  </Swiper>
                  <button className="swiper-button-next">
                    <i className="fa-regular fa-arrow-right"></i>
                  </button>
                  <button className="swiper-button-prev">
                    <i className="fa-regular fa-arrow-left"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};


export default SliderBanner;

