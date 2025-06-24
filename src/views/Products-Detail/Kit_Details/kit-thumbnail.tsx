import React, { useState } from "react";
import { Col, Row, Media } from "reactstrap";
import Slider from "react-slick";
import AccordianDescription from "./kit-discription-items";
import KitDiscription from "./kit-discription-items";
import KitAddToCart from "./kit-add_to_cart";

interface ThumbnailLeftSlickProps {
  item: any;
}

const KitThumbnail: React.FC<ThumbnailLeftSlickProps> = ({ item }) => {
  const [nav1, setNav1] = useState<Slider | null>();
  const [nav2, setNav2] = useState<Slider | null>();
  var setting1 = {
    responsive: [
      {
        breakpoint: 767,
        settings: {
          vertical: false,
          slidesToShow: 3,
        },
      },
    ],
  };


  const changeColorVar = (img_id: any) => {
    nav1?.slickGoTo(img_id);
  };

  return (
    <>
      <Col lg="1" sm="2" xs="12">
  <Row>
    <Col>
      <Slider
        className="slider-right-nav"
        {...setting1}
        asNavFor={nav2!}
        ref={(slider1) => setNav1(slider1)}
        slidesToShow={1}
        swipeToSlide={true}
        focusOnSelect={true}
        vertical={true}
      >
        {item?.img?.map((img: string, i: number) => (
          <div key={i}>
            <Media
              src={img}
              alt={`thumb-${i}`}
              className="img-fluid image_zoom_cls-0"
            />
          </div>
        ))}
      </Slider>
    </Col>
  </Row>
</Col>

<Col lg="3" sm="10" xs="12" className="order-up">
  <Slider
    className="product-slick"
     {...setting1}
        asNavFor={nav2!}
        ref={(slider1) => setNav1(slider1)}
        slidesToShow={1}
        swipeToSlide={true}
        focusOnSelect={true}
        vertical={true}
  >
    {item?.img?.map((img: string, i: number) => (
      <div key={i}>
        <Media
          src={img}
          alt={`main-${i}`}
          className="img-fluid image_zoom_cls-0"
        />
      </div>
    ))}
  </Slider>
</Col>

      <Col lg="4">
        <KitDiscription item={item} />
      </Col>
      <Col lg="4">
        <KitAddToCart item={item} changeColorVar={changeColorVar} />
      </Col>
    </>
  );
};

export default KitThumbnail;
