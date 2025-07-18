import React, { useState, useContext } from "react";
import { NextPage } from "next";
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col } from "reactstrap";
import ProductBox from "../Product-Box/productbox";
import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import { Category, searchController } from '@/app/globalProvider';
import { Autoplay, Navigation, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

interface TabProductProps {
  effect?: any;
  categories?: Category[];
}

const TabProduct: NextPage<TabProductProps> = ({ effect, categories }) => {
  const { addToCart } = useContext(CartContext);
  const { addToWish } = useContext(WishlistContext);
  const { addToCompare } = useContext(CompareContext);
  const [activeTab, setActiveTab] = useState(0);

  const getPrice = (item: any) => {
    if (item?.getPrice) return item.getPrice();
    if (item?.productId && searchController) {
      return searchController.getDetails(item.productId, 'getProductPrice') || item?.price || 0;
    }
    return item?.price || 0;
  };

  // Enhanced handleAction with better product identification
  const handleAction = (item: any, action: Function) => {
    const productData = {
      ...item,
      id: item.id || item.productId, // Ensure unique ID
      price: getPrice(item),
      quantity: 1, // Always start with quantity 1
      timestamp: Date.now(), // Add timestamp to make each addition unique if needed
    };
    
    console.log('Adding product to cart:', productData); // Debug log
    action(productData);
  };

  // Alternative method for cart specifically
  const handleAddToCart = (item: any) => {
    const productData = {
      ...item,
      id: item.id || item.productId,
      price: getPrice(item),
      quantity: 1,
    };
    
    console.log('Adding to cart:', productData);
    
    // If your cart context has a specific method for handling quantities
    if (addToCart) {
      addToCart(productData);
    }
  };

  if (!categories || categories.length === 0) return null;

  return (
    <>
      <section className="section-pt-space">
        <div className="tab-product-main">
          <div className="tab-prodcut-contain">
            <Nav tabs>
              <Swiper
                mousewheel
                speed={2000}
                slidesPerView={7}
                breakpoints={{
                  0: { slidesPerView: 1 },
                  320: { slidesPerView: 3, spaceBetween: 20 },
                  480: { slidesPerView: 3, spaceBetween: 20 },
                  640: { slidesPerView: 4, spaceBetween: 20 },
                  840: { slidesPerView: 5, spaceBetween: 20 },
                  1140: { slidesPerView: 6, spaceBetween: 20 },
                }}
                modules={[Mousewheel]}
              >
                {categories.map((category, index) => (
                  <SwiperSlide key={`${category.id}-${index}`}>
                    <NavItem>
                      <NavLink 
                        className={activeTab === index ? 'active' : ''} 
                        onClick={() => setActiveTab(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        {category.name}
                      </NavLink>
                    </NavItem>
                  </SwiperSlide>
                ))}
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
                    <Swiper
                      slidesPerView={6}
                      navigation
                      spaceBetween={30}
                      loop={false}
                      autoplay={true}
                      breakpoints={{
                        0: { slidesPerView: 1 },
                        320: { slidesPerView: 2, spaceBetween: 20 },
                        480: { slidesPerView: 3, spaceBetween: 20 },
                        640: { slidesPerView: 4, spaceBetween: 20 },
                        840: { slidesPerView: 6, spaceBetween: 20 },
                        1140: { slidesPerView: 6, spaceBetween: 20 },
                      }}
                      modules={[Autoplay, Navigation, Keyboard]}
                    >
                      {categories[activeTab]?.category_products?.map((item, index) => (
                        <SwiperSlide key={`${item.id || item.productId}-${index}`}>
                          <ProductBox 
                            layout="layout-one" 
                            price={getPrice(item)} 
                            hoverEffect={effect} 
                            data={item} 
                            item={item}
                            newLabel={item.name} 
                            addCart={() => handleAddToCart(item)} 
                            addCompare={() => handleAction(item, addToCompare)} 
                            addWish={() => handleAction(item, addToWish)} 
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
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