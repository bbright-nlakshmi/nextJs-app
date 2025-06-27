import { NextPage } from "next";
import Slider from "react-slick";
import { Col, Container, Row } from "reactstrap";
import { Kit, objCache, ObjCache, Product, searchController, StorePriceRanges } from "@/app/globalProvider";
import { useState } from "react";
import ProductBox from "./Product-Box/productbox";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CartContext } from "@/helpers/cart/cart.context";
import { CompareContext } from "@/helpers/compare/compare.context";
import React from "react";
import ProductBox2 from "./Product-Box/productbox2";
import { Autoplay, Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

var settings = {
  dots: false,
  infinite: false,
  speed: 300,
  slidesToShow: 10,
  slidesToScroll: 10,
  responsive: [
    {
      breakpoint: 1700,
      settings: {
        slidesToShow: 8,
        slidesToScroll: 8,
      },
    },
    {
      breakpoint: 1367,
      settings: {
        slidesToShow: 6,
        slidesToScroll: 6,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 5,
        infinite: true,
      },
    },
    {
      breakpoint: 800,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 4,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
      },
    },
  ],
};

interface Props {
  priceRanges: StorePriceRanges | undefined;
}
const PriceRanges: NextPage<Props> = ({ priceRanges }) => {

  const price_ranges = [100, 200, 400, 300];
  const [products, setProducts] = useState<Array<Product | Kit>>();
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);

  const switchPriceRange = (range: number) => {

    const result = objCache.getItemsInPriceRange({ price: range, before: -1 });
    setProducts(result);
  };

  if (priceRanges)
    return (
      <>
        <Container fluid={true}>
          <Row>
            <Col className="ps-0">
              <h2>Price Ranges</h2>
              <div className="slide-10 no-arrow discount-coupons">
                <Slider {...settings}>
                  {price_ranges.map((data, i) => {
                    return (
                      <div key={i} onClick={() => switchPriceRange(data)} >
                        <a >
                          <div className="box-category-contain">
                            <h4>{data}</h4>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </Slider>
              </div>
            </Col>
          </Row>
        </Container>
         <section className="ratio_asos product">
        <div className="custom-container addtocart_count">
          <div className="cover-card-main-over">
            <Swiper
              slidesPerView={3}
              navigation
              spaceBetween={30}
              

              loop={false}
              mousewheel={true}
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 0 },
                320: { slidesPerView: 2, spaceBetween: 20 },
                480: { slidesPerView: 3, spaceBetween: 20 },
                640: { slidesPerView: 4, spaceBetween: 20 },
                840: { slidesPerView: 5, spaceBetween: 20 },
                1140: { slidesPerView: 6, spaceBetween: 20 },
              }}
              modules={[Autoplay, Navigation, Pagination, Mousewheel, Keyboard]}
            >

              {products?.length && products.map((item: any, i: any) => (

                <SwiperSlide key={item.id}>
                  <ProductBox2 item={item} stock={item.stock} price={item.getPrice()} title={item.name} addCart={() => addToCart(item)} addCompare={() => addToCompare(item)} addWish={() => addToWish(item)} />
                </SwiperSlide>

              ))}
            </Swiper>
          </div></div>
          </section>
      </>
    );
};

export default PriceRanges;
