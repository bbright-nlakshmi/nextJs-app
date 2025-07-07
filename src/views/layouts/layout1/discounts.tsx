// "use client"; // 

// import React from "react";
// import Link from "next/link";
// import { NextPage } from "next";
// import { Col, Row } from "reactstrap";
// import { Media } from "reactstrap";
// import { Discount } from "@/app/models/models";

// // Swiper imports
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Navigation, Pagination, Autoplay } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

// interface Props {
//   products?: Discount[];
// }

// const DiscountProducts: NextPage<Props> = ({ products = [] }) => {
//   if (!products.length) {
//     return (
//       <section className="collection-banner section-pb-space">
//         <div className="custom-container">
//           <Row>
//             <Col>
//             </Col>
//           </Row>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section className="collection-banner section-pb-space">
//       <div className="custom-container">
//         <Swiper
//           modules={[Navigation, Pagination, Autoplay]}
//           navigation={true}
//           pagination={{ clickable: true }}
//           autoplay={{ delay: 5000, disableOnInteraction: false,pauseOnMouseEnter: true}} 
//           speed={800}
//           spaceBetween={30}
//           loop={true}
//           breakpoints={{
//             640: {
//               slidesPerView: 1,
//             },
//             768: {
//               slidesPerView: 1,
//             },
//             1024: {
//               slidesPerView: 1,
//             },
//           }}
//         >
//           {products.map((banner) => (
//             <SwiperSlide key={banner.id}>
//               <div className="collection-banner-main banner-5 p-center">
//                 <div className="collection-img">
//                   <Media
//                     src={banner.img?.[0] ?? "/placeholder.jpg"}
//                     className="bg-img"
//                     alt={banner.name}
//                   />
//                 </div>
//                 <div className="collection-banner-contain">
//                   <div className="sub-contain">
//                     <h3>
//                       save up to{" "}
//                       {banner.is_discount_percent
//                         ? `${banner.discount}%`
//                         : `₹${banner.discount}`}{" "}
//                       off
//                     </h3>
//                     <h4>{banner.name}</h4>
//                     <h5>{banner.details}</h5>
//                     <div className="shop">
//                       <Link
//                         className="btn btn-normal"
//                         href={{
//                           pathname: "/collections/no-sidebar",
//                           query: { id: banner.id,type:'discount' },
//                         }}
//                       >
//                         Shop Now
//                       </Link>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       </div>
//     </section>
//   );
// };

// export default DiscountProducts;


"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NextPage } from "next";
import { Col, Row, Button, Spinner } from "reactstrap";
import { Discount, DiscountItem } from "@/app/models/models";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { CartContext } from "../../../helpers/cart/cart.context";
import { useContext } from "react";


interface Props {
  products?: Discount[];
}


const DiscountProducts: NextPage<Props> = ({ products = [] }) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageLimit, setPageLimit] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useContext(CartContext);
  if (!products.length) return null;

  const activeBanner = products[activeIndex];
  const relatedItems = activeBanner?.discountItems ?? [];

  const handlePagination = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPageLimit((prev) => prev + 4);
      setIsLoading(false);
    }, 500);
  };
  


  return (
    <section className="rts-grocery-feature-area rts-section-gapBottom">
      <div className="container">
        <Row>
          <Col lg="12">
            <div className="title-area-between discount-products-title">
              <h2 className="title-left">Products With Discounts</h2>
              {/* <div className="countdown">
                <div className="countDown">12/05/2025 10:20:00</div>
              </div> */}
            </div>
          </Col>
        </Row>
        <Row className="discount-banners-container">
          {/* left side vertical swiper for banners */}
          <Col xl="4" lg="12">
            <Swiper
              direction="vertical"
              slidesPerView={2}
              spaceBetween={30}
              navigation
              pagination={{ clickable: true }}
              className="discount-products-swiper"
              onSlideChange={(swiper) => {
                setActiveIndex(swiper.activeIndex);
                setPageLimit(4);
              }}
            >
              {products.map((banner) => (
                <SwiperSlide key={banner.id}>
                  <Link
                    href={{
                      pathname: "/collections/no-sidebar",
                      query: { id: banner.id, type: "discount" },
                    }}
                    className="discount-product-link"
                  >
                  <div className="discount-product-card">
                    <img
                      src={banner.img?.[0] ?? "/placeholder.jpg"}
                      alt={banner.name}
                      className="discount-product-image"
                    />
                    <div className="discount-product-overlay">
                      <h4 className="discount-product-name">{banner.name}</h4>
                      <div className="discount-product-amount">
                        Only{" "}
                        <strong className="discount-product-percentage">
                          {banner.is_discount_percent
                            ? `${banner.discount}%`
                            : `₹${banner.discount}`}
                        </strong>{" "}
                        off
                      </div>
                    </div>
                  </div>
                </Link>            
                </SwiperSlide>
              ))}
            </Swiper>
          </Col>

          {/* right side product layout hand coded */}
          <Col xl="8" lg="12">
            <Row>
              {!relatedItems?.length ? (
                <Col xs="12">No related products</Col>
              ) : (
                relatedItems.slice(0, 4).map((item, i) => (
                  <Col md="6" key={i}>
                    <div className="custom-product-card d-flex align-items-center p-3 mb-4 shadow-sm rounded bg-white border position-relative">
                      {/* discount badge */}
                      <div className="discount-badge position-absolute top-0 start-0 bg-warning text-dark p-1 px-2 rounded-end">
                        {item.discount}% Off
                      </div>
                      {/* product image */}
                      <div className="product-thumbnail me-3 flex-shrink-0"
                        style={{ cursor: "pointer" }}
                        onClick={() => router.push(`/product-details/${item.id}`)}
                      >
                        <img
                          src={item.img?.[0] ?? "/placeholder.jpg"}
                          alt={item.name}
                        />
                      </div>
                      {/* product content */}
                      <div className="flex-grow-1">
                        <h5 className="mb-1 fw-bold">{item.name}</h5>
                        <p className="mb-1 text-muted product-description"></p>
                        {/* price */}
                        <div className="d-flex align-items-center mb-2">
                          <span className="text-danger fs-5 fw-bold me-2">
                            ${item.getPrice()||"29.00"}
                          </span>

                        </div>
                        {/* quantity and add */}
                        <div className="d-flex align-items-center gap-2">
                          <ul className="rating-star m-2 p-0">
                            <i className="fa fa-star text-warning"></i>
                            <i className="fa fa-star text-warning"></i>
                            <i className="fa fa-star text-warning"></i>
                            <i className="fa fa-star text-warning"></i>
                            <i className="fa fa-star-o text-warning"></i>
                          </ul>
                          <div className="quantity-input">
                          <input
                            type="number"
                            min="1"
                            defaultValue="1"
                          />
                          </div>
                          <Button
                            color="success"
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="add-to-cart-button"
                          >
                            <i className="fa fa-shopping-cart me-1"></i>Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))
              )}
            </Row>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default DiscountProducts;
