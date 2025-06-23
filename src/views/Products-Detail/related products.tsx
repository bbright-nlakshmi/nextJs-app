import React from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { NextPage } from "next";
import Slider from "react-slick";
import { Row, Col } from "reactstrap";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import { Skeleton } from "../../common/skeleton";
import { CartContext } from "../../helpers/cart/cart.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import { CompareContext } from "../../helpers/compare/compare.context";

interface RelatedProductsProps {
  productId: string; // coming as a string from URL
}

var settings = {
  arrows: false,
  dots: false,
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


const RelatedProducts: NextPage<RelatedProductsProps> = ({productId}) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  var loading, data ;
  
  return (
    <section className="section-big-py-space  ratio_asos bg-light">
      <div className="custom-container">
        <Row>
          <Col className="product-related">
            <h2>related products</h2>
          </Col>
        </Row>

        { !data || loading ? (
          <Skeleton />
        ) : (
          <Row>
            <Col className="product">
              <Slider {...settings}>
                {data &&
                  data.map((item: any, i: any) => (
                    <div key={i}>
                      <ProductBox newLabel={item.new} {...item} item={item} addCart={() => addToCart(item)} addCompare={() => addToCompare(item)} addWish={() => addToWish(item)} />
                    </div>
                  ))}
              </Slider>
            </Col>
          </Row>
        )}
      </div>
    </section>
  );
};

export default RelatedProducts;
