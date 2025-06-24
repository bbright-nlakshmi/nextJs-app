import React, { useState } from "react";
import Slider from "react-slick";
import { Col, Media, Row } from "reactstrap";
import ProductDetail from "./product-detail";


interface ProductSlickProps {
  item: any;
  bundle: boolean;
  swatch: boolean;
}

const ProductSlick: React.FC<ProductSlickProps> = ({ item, bundle, swatch }) => {
  
  const [nav1, setNav1] = useState<Slider | null>();
  const [nav2, setNav2] = useState<Slider | null>();

  let setting = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: true,
  };
  let setting1 = {
    slidesToScroll: 1,
    slidesToShow: 3,
    dots: true,
    centerMode: false,
    focusOnSelect: true,
  };
  const changeColorVar = (img_id: number) => {
    nav1?.slickGoTo(img_id);
  };
  console.log(item,123);
  return (
    <>
      <Col lg="5">
        {/* <Slider {...setting} className="product-slick" asNavFor={nav2!} ref={(slider1) => setNav1(slider1)}>HI */}
          {item &&
            item.img.map((img: any, i: any) => {
              return (
                <div key={i}>
                  <Media src={`${img}`} alt="" className="img-fluid  image_zoom_cls-0" />
                </div>
              );
            })}
        {/* </Slider> */}
        {/* <Row>
          <Col>
            <Slider {...setting1} className="slider-nav" asNavFor={nav1!} ref={(slider2) => setNav2(slider2)} slidesToShow={item.img.length >= 3 ? 3 :item.img.length} >
              {item &&
                item.img.map((img: any, i: any) => {
                  return (
                    <div key={i}>
                      <Media src={`/images/${img.src}`} alt="" className="img-fluid  image_zoom_cls-0" />
                    </div>
                  );
                })}
            </Slider>
          </Col>
        </Row> */}
      </Col>
      <Col lg="7" className="rtl-text">
        <ProductDetail item={item} changeColorVar={changeColorVar} bundle={bundle} swatch={swatch} />
      </Col>
    </>
  );
};

export default ProductSlick;
