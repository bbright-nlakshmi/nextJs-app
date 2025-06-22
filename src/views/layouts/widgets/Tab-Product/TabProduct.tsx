import React, { useState, useEffect } from "react";
import { gql } from "@apollo/client";
import { NextPage } from "next";
import { useQuery } from "@apollo/client";
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Media } from "reactstrap";
import ProductBox from "../Product-Box/productbox";
import Slider from "react-slick";
import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import { Skeleton } from "../../../../common/skeleton";
import { API, BannerModel, Category, ObjCache, Product } from '@/app/globalProvider';

// Swiper components, modules and styles
import { Autoplay, Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { all } from "axios";

var settings = {
  autoplay: true,
  arrows: true,
  dots: true,
  infinite: false,
  speed: 300,
  slidesToShow: 6,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1700,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 5,
        infinite: true,
      },
    },
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 4,
        infinite: true,
      },
    },
    {
      breakpoint: 991,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
        infinite: true,
      },
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
      },
    },
  ],
};
interface allProductsProps{
  category:string,
  products:Product[];
}

type TabProductProps = {
  effect?: any;
  categories?:Category[];
};
//var categories: any;
const TabProduct: NextPage<TabProductProps> = ({ effect ,categories}) => {
const [allproducts,setAllProducts] = useState<allProductsProps>();
  // ObjCache.allProducstsList.subscribe((products: allProductsProps) => {
  //     setAllProducts(products);
  //     console.log(allproducts)
  //   })
    
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [activeTab, setActiveTab] = useState(0);
  const collection: any[] = [];
if(categories)
  return (
    <>
      <section className="section-pt-space">
        <div className="tab-product-main">
          <div className="tab-prodcut-contain">

            <Nav tabs>
              <Swiper
                mousewheel={true}
                speed={2000}
                slidesPerView={7}
                breakpoints={{
                            0: { slidesPerView: 1, spaceBetween: 0 },
                            320: { slidesPerView: 3, spaceBetween: 20 },
                            480: { slidesPerView: 3, spaceBetween: 20 },
                            640: { slidesPerView: 4, spaceBetween: 20 },
                            840: { slidesPerView: 5, spaceBetween: 20 },
                            1140: { slidesPerView: 6, spaceBetween: 20 },
                          }}
                modules={[Mousewheel]}

              >
                {categories.map((c: any, i: any) =>
                (
                  <SwiperSlide key={c.id}>
                    <NavItem key={i}>
                      <NavLink className={activeTab == i ? 'active' : ''} onClick={() => setActiveTab(i)}>
                        {c.name}
                      </NavLink>
                    </NavItem>
                  </SwiperSlide>
                ))
                }
              </Swiper>
            </Nav>
          </div>
        </div>
      </section>

      <section className="section-py-space ratio_asos product">
        <div className="custom-container">
          <Row>
            <Col className="pe-0">
              <TabContent activeTab={activeTab}>
                <TabPane tabId={activeTab}>
                  <div className="product product-slide-6 product-m no-arrow">
                    <div>
                       
                        <Swiper
                          slidesPerView={3}
                          navigation
                          spaceBetween={30}
                          pagination={{ type: "bullets", clickable: true }}
                          
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

                          {categories[activeTab].category_products && categories[activeTab].category_products.map((item: any, i: any) => (
                            <SwiperSlide key={item.id}>
                              {/* {item.id} */}
                              {/* <Media src={item.img[0]} alt="" className="img-fluid  image_zoom_cls-0" /> */}
                              {/* hoverEffect={effect} id={item.id} newLabel={item.name} title={item.name} {...item} addCart={() => addToCart(item)} addCompare={() => addToCompare(item)} addWish={() => addToWish(item)}*/}
                              <ProductBox layout="layout-one" hoverEffect={effect} data={item} newLabel={item.name} addCart={() => addToCart(item)} addCompare={() => addToCompare(item)} addWish={() => addToWish(item)} />
                            </SwiperSlide>

                          ))}
                        </Swiper>

                      
                    </div>
                  </div>
                </TabPane>
              </TabContent>
            </Col>
          </Row>
        </div>
      </section>
    </>
  );
};

export default TabProduct;
