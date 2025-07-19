"use client";
import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Row, Col, Spinner, Button } from "reactstrap";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import { Skeleton } from "../../common/skeleton";
import { CartContext } from "../../helpers/cart/cart.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import { CompareContext } from "../../helpers/compare/compare.context";
import { objCache, Product } from "@/app/globalProvider";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
interface RelatedProductsProps {
  productId: string;
  categoryId: string;
  hoverEffect?: string;
}

const RelatedProducts: NextPage<RelatedProductsProps> = ({ productId, categoryId }) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  // const [pageLimit, setPageLimit] = useState(6);
  // const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleUpdateAllProducts = (data: Map<string, Product[]>) => {
      const allProducts: Product[] = Array.from(new Map(Array.from(data.values()).flat().map((product) => [product.id, product])).values());
      const filtered = allProducts.filter(
        (product) => product.categoryID === categoryId && product.id !== productId
      );
      setRelatedProducts(filtered);
    };

    objCache.on("updateAllProducts", handleUpdateAllProducts);

    return () => {
      objCache.off("updateAllProducts", handleUpdateAllProducts);
    };
  }, [categoryId, productId]);


  return (
    <section className="section-big-py-space ratio_asos ">
      <div className="custom-container">
        <Row>
          <Col sm="12">
            <h2>Related Products</h2>
            <div className="related-products-slider">
              {!relatedProducts?.length ? (
                <Skeleton />
              ) : (
                <Swiper
                  spaceBetween={20}
                  modules={[Navigation, Pagination, Autoplay]}
                  autoplay={{ delay: 1000, disableOnInteraction: true }}
                  grabCursor={true}
                  simulateTouch={true}
                  allowTouchMove={true}
                  navigation
                  breakpoints={{
                    0: {
                      slidesPerView: 2,
                    },
                    768: {
                      slidesPerView: 3,
                    },
                    1200: {
                      slidesPerView: 6,
                    },
                  }}
                >
                  {relatedProducts.slice().map((item, i) => (
                    <SwiperSlide key={i}>
                      <div className="product">
                        <ProductBox
                          layout="layout-one"
                          data={item}
                          newLabel={item.new}
                          item={item}
                          price={item.getPrice()}
                          addCart={() => addToCart(item)}
                          addCompare={() => addToCompare(item)}
                          addWish={() => addToWish(item)}
                          hoverEffect={'icon-inline'}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default RelatedProducts;
