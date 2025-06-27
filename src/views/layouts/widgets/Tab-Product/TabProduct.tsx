import React, { useState, useEffect } from "react";

import { NextPage } from "next";

import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Media } from "reactstrap";
import ProductBox from "../Product-Box/productbox";

import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import { Skeleton } from "../../../../common/skeleton";
import {  Category, Product, searchController } from '@/app/globalProvider';

// Swiper components, modules and styles
import { Autoplay, Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";



type TabProductProps = {
  effect?: any;
  categories?:Category[];
};

const TabProduct: NextPage<TabProductProps> = ({ effect ,categories}) => {

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [activeTab, setActiveTab] = useState(0);
  

  const getPrice = (productId:string) => {
    const price = searchController.getDetails(productId,'getProductPrice');
    
       return price;
  }
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

                          {categories[activeTab]?.category_products && categories[activeTab].category_products.map((item: any, i: any) => (
                            <SwiperSlide key={item.id}>
                             
                              <ProductBox layout="layout-one" price={getPrice(item.productId)} hoverEffect={effect} data={item} newLabel={item.name} addCart={() => addToCart(item)} addCompare={() => addToCompare(item)} addWish={() => addToWish(item)} />
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
