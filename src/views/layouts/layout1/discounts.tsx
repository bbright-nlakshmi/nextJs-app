"use client";
import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { NextPage } from "next";
import { Col, Row, Button } from "reactstrap";
import { Discount } from "@/app/globalProvider";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination"
import { CartContext } from "../../../helpers/cart/cart.context";
import ProductBox from "@/views/layouts/widgets/Product-Box/productbox";

interface Props {
  products?: Discount[];
}


const DiscountProducts: NextPage<Props> = ({ products = [] }) => {
  const router = useRouter();

  const { addToCart } = useContext(CartContext);

  if (!products.length) return null;

  
  return (
    <section className="rts-grocery-feature-area section-pt-space">
      
        <Row>
          <Col lg="12">
            <div className="custom-container title-area-between">
              <h2 className="title-left">Products With Discounts</h2>
            </div>
          </Col>
        </Row >
        <div  className="discount-banners-container">
        <Swiper
          direction="vertical"
          slidesPerView={products.length === 1 ? 1 : 2}
          spaceBetween={20}
          navigation
          pagination={{ clickable: true }}
          className={`discount-products-swiper ${products.length === 1 ? "single-banner" : ""}`}
          breakpoints={{
            0: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: products.length === 1 ? 1 : 2,
            },
          }}
        >
          {products.map((banner) => (
            <SwiperSlide key={banner.id}>
              <Row>
                {/* left banner */}
                <Col xl="4" lg="12" className=" mb-xl-0">
                  <div
                    className="discount-product-card"
                    style={{ cursor: "pointer" }}
                    onClick={() =>router.push(`/collections/no-sidebar?id=${banner.id}&type=discount`)}
                  >
                    <img
                      src={banner.img?.[0] ?? "/placeholder.jpg"}
                      alt={banner.name}
                      className="discount-product-image"
                    />
                      {/* <div className="discount-product-overlay">
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
                      </div> */}
                  </div>
                </Col>
                {/* right products */}
                <Col xl="8" lg="12" className="discount-products-col">
                  <Row>
                    {(banner.discountItems ?? []).slice(0, 2).map((item, i) => (
                      <Col md="6" xs="6" key={i}>                        
                        <div className="d-block d-lg-none">
                          <ProductBox
                            layout="mobile"
                            data={item}
                            item={item}
                            price={item.getPrice()}
                            addCart={() => addToCart(item)}
                            addWish={() => console.log("addWish", item)}
                            addCompare={() => console.log("addCompare", item)}
                            hoverEffect=""
                          />                        
                        </div>
                        <div className="d-none d-lg-block">                        
                          <div className="custom-product-card d-flex align-items-center p-3 mb-4 shadow-sm rounded bg-white border position-relative">
                            {/* discount badge */}
                              <div className="discount-badge">{item.discount}% Off</div>
                            {/* product image */}
                            <div
                              className="product-thumbnail me-3 flex-shrink-0"
                              style={{ cursor: "pointer" }}
                              onClick={() => router.push(`/product-details/${item.id}`)}
                            >
                              <img src={item.img?.[0] ?? "/placeholder.jpg"} alt={item.name} />
                              </div>
                            {/* product content */}
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-bold">{item.name}</h5>
                              <div className="d-flex align-items-center mb-2">
                                <span className="text-danger fs-5 fw-bold me-2">
                                  ${item.getPrice()}
                                </span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <ul className="rating-star m-2 p-0">
                                  <i className="fa fa-star text-warning"></i>
                                  <i className="fa fa-star text-warning"></i>
                                  <i className="fa fa-star text-warning"></i>
                                  <i className="fa fa-star text-warning"></i>
                                  <i className="fa fa-star-o text-warning"></i>
                                </ul>
                                <div className="quantity-input">
                                  <input type="number" min="1" defaultValue="1" />
                                </div>
                                <Button
                                  color="success"
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="add-to-cart-button"
                                >
                                  <i className="fa fa-shopping-cart me-1"></i>
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>                        
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
    </section>
  );
};

export default DiscountProducts;
