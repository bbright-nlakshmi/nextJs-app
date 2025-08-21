import React, { useState } from "react";
import Slider from "react-slick";
import { Col, Media, Row } from "reactstrap";
import ProductDetail from "./product-detail";
import { Discount, Product, searchController } from "@/app/globalProvider";

interface ProductSlickProps {
  item: any;
  bundle: boolean;
  swatch: boolean;
}

const ProductSlick: React.FC<ProductSlickProps> = ({
  item,
  bundle,
  swatch,
}) => {
  // Simple carousel settings - same as ProductBox
  let setting = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 1000,
    pauseOnHover: true,
    adaptiveHeight: false,
    variableWidth: false,
  };

  const changeColorVar = (img_id: number) => {
    // Simple function for color variant change if needed
  };

  return (
    <>
      <section className="rts-product-details-section rts-product-details-section2" style={{ overflow: "visible" }}>
        <div className="details-product-area w-full" style={{ overflow: "visible" }}>
          <Row className="w-full" style={{ margin: 0 }}>
            <Col lg="6" md="6" sm="12">
              <div className="product-thumb-area" style={{ width: "100%", position: "relative" }}>
                <div className="thumb-wrapper one filterd-items figure" style={{ width: "100%", minHeight: "400px" }}>
                  <div className="product-thumb" style={{ width: "100%", height: "100%" }}>
                    {/* Single Carousel Area - Same as ProductBox */}
                    {item?.img?.length > 1 ? (
                      <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
                        <Slider {...setting}>
                          {item.img.map((img: string, idx: number) => (
                            <div key={idx} style={{ outline: "none" }}>
                              <div className="product-image-slide" style={{ position: "relative", width: "100%" }}>
                                <Media
                                  src={img}
                                  alt=""
                                  className="img-fluid image_zoom_cls-0"
                                  style={{
                                    width: "100%",
                                    height: "auto",
                                    display: "block",
                                    maxHeight: "500px",
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </Slider>
                      </div>
                    ) : (
                      <div className="product-image-slide" style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "0 auto" }}>
                        <Media
                          src={item?.img?.[0]}
                          alt=""
                          className="img-fluid image_zoom_cls-0"
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            maxHeight: "500px",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            <Col lg="6" className="rtl-text">
              <ProductDetail
                item={item}
                changeColorVar={changeColorVar}
                bundle={bundle}
                swatch={swatch}
              />
            </Col>
          </Row>
        </div>
      </section>
    </>
  );
};

export default ProductSlick;