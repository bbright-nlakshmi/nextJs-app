import { NextPage } from "next";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { Col, Media, Row } from "reactstrap";
import {API, BannerModel, ObjCache } from '@/app/globalProvider'



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
  if(banners)
  return (
    <section className="w-full section-py-space">
      <div className="custom-container rts-banner-area-one" >

        <Swiper
          spaceBetween={1}
          slidesPerView={1}
          loop={true}
          speed={2000}
          autoplay={{
            delay: 4000,
          }}
          mousewheel={true}
          navigation={true}

          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 0 },
            320: { slidesPerView: 1, spaceBetween: 0 },
            480: { slidesPerView: 1, spaceBetween: 0 },
            640: { slidesPerView: 1, spaceBetween: 0 },
            840: { slidesPerView: 1, spaceBetween: 0 },
            1140: { slidesPerView: 1, spaceBetween: 0 },
          }}
          modules={[Autoplay, Navigation, Mousewheel, Keyboard]}
        >
          {banners.map((item) => (
            <SwiperSlide>
             
                  <Media src={item.img[0]} className="bg-img  img-fluid" alt={item.name} />
              
            </SwiperSlide>
          ))}
        </Swiper>

      </div>
    </section>
  );
};


export default SliderBanner;

