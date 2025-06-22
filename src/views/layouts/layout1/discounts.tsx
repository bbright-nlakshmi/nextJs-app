"use client"; // ✅ required for App Router

import React from "react";
import Link from "next/link";
import { NextPage } from "next";
import { Col, Row } from "reactstrap";
import { Media } from "reactstrap";
import { Discount } from "@/app/models/models";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface Props {
  products?: Discount[];
}

const DiscountProducts: NextPage<Props> = ({ products = [] }) => {
  if (!products.length) {
    return (
      <section className="collection-banner section-pb-space">
        <div className="custom-container">
          <Row>
            <Col>
                <p>No discounts available</p>
            </Col>
          </Row>
        </div>
      </section>
    );
  }

  return (
    <section className="collection-banner section-pb-space">
      <div className="custom-container">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation={true}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false,pauseOnMouseEnter: true}} 
          speed={800}
          spaceBetween={30}
          loop={true}
          breakpoints={{
            640: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 1,
            },
            1024: {
              slidesPerView: 1,
            },
          }}
        >
          {products.map((banner) => (
            <SwiperSlide key={banner.id}>
              <div className="collection-banner-main banner-5 p-center">
                <div className="collection-img">
                  <Media
                    src={banner.img?.[0] ?? "/placeholder.jpg"}
                    className="bg-img"
                    alt={banner.name}
                  />
                </div>
                <div className="collection-banner-contain">
                  <div className="sub-contain">
                    <h3>
                      save up to{" "}
                      {banner.is_discount_percent
                        ? `${banner.discount}%`
                        : `₹${banner.discount}`}{" "}
                      off
                    </h3>
                    <h4>{banner.name}</h4>
                    <h5>{banner.details}</h5>
                    <div className="shop">
                      <Link
                        className="btn btn-normal"
                        href={{
                          pathname: "/collections/no-sidebar",
                          query: { id: banner.id },
                        }}
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default DiscountProducts;
