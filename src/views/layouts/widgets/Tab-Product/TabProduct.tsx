import React, { useState, useEffect } from "react";

import { NextPage } from "next";

import {
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Row,
  Col,
  Media,
} from "reactstrap";
import ProductBox from "../Product-Box/productbox";

import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import { Skeleton } from "../../../../common/skeleton";
import {
  appConfig,
  Category,
  Product,
  searchController,
} from "@/app/globalProvider";

// Swiper components, modules and styles
import {
  Autoplay,
  Navigation,
  Pagination,
  Mousewheel,
  Keyboard,
  Grid,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type TabProductProps = {
  effect?: any;
  categories?: Category[];
};

const TabProduct: NextPage<TabProductProps> = ({ effect, categories }) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [activeTab, setActiveTab] = useState(0);

  const getPrice = (productId: string) => {
    const price = searchController.getDetails(productId, "getPrice");

    return price;
  };

  // Function to handle adding item to cart with price included
  const handleAddToCart = (item: any, qty = 1) => {
    const price = searchController.getDetails(item.productId, "getPrice");
    const cartItem = {
      ...item,
      price: price,
      id: item.productId,
    };
    addToCart(cartItem, qty);
  };

  if (categories)
    return (
      <>
        <section className="section-pt-space">
          <div className="custom-container title-area-between">
            <h2 className="title-left">All Categories</h2>
          </div>
          <div className="tab-product-main row">
            <div className="tab-prodcut-contain col-lg-12">
              <Nav tabs>
                <Swiper
                  mousewheel={true}
                  speed={2000}
                  slidesPerView={7}
                  breakpoints={appConfig.mediaQueries}
                  modules={[Mousewheel, Autoplay]}
                >
                  {categories.map((c: any, i: any) => {
                    if (c.category_products.length)
                      return (
                        <SwiperSlide key={c.id}>
                          <NavItem key={i}>
                            <NavLink
                              className={activeTab == i ? "active" : ""}
                              onClick={() => setActiveTab(i)}
                            >
                              {c.name}
                            </NavLink>
                          </NavItem>
                        </SwiperSlide>
                      );
                  })}
                </Swiper>
              </Nav>
            </div>
          </div>
        </section>

        <section className="ratio_asos product">
          <div className="container">
            <Row>
              <Col className="pe-0">
                <TabContent activeTab={activeTab}>
                  <TabPane tabId={activeTab}>
                    <div className="product product-slide-6 product-m no-arrow">
                      <div>
                        <Swiper
                          slidesPerView={6}
                          navigation
                          spaceBetween={30}
                          // grid={{
                          //   rows: 2,
                          // }}
                          loop={false}
                          autoplay={{ delay: 1000, pauseOnMouseEnter: true }}
                          breakpoints={appConfig.mediaQueries}
                          modules={[Autoplay, Navigation, Keyboard]}
                        >
                          {categories[activeTab]?.category_products &&
                            categories[activeTab].category_products.map(
                              (item: any, i: any) => (
                                <SwiperSlide key={item.id}>
                                  <ProductBox
                                    layout="layout-one"
                                    price={getPrice(item.productId)}
                                    hoverEffect={effect}
                                    data={item}
                                    newLabel={item.name}
                                    addCart={handleAddToCart}
                                    addCompare={() => addToCompare(item)}
                                    addWish={() => addToWish(item)}
                                  />
                                </SwiperSlide>
                              )
                            )}
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
