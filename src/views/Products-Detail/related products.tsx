import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import Slider from "react-slick";
import { Row, Col } from "reactstrap";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import { Skeleton } from "../../common/skeleton";
import { CartContext } from "../../helpers/cart/cart.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import { CompareContext } from "../../helpers/compare/compare.context";
import { objCache, Product , Category, CategoryProducts, searchController } from "@/app/globalProvider";
interface RelatedProductsProps {
  productId: string;
  categoryId: string;
}

const settings = {
  arrows: false,
  dots: false,
  infinite: false,
  speed: 300,
  slidesToShow: 6,
  slidesToScroll: 1,
  responsive: [
    { breakpoint: 1700, settings: { slidesToShow: 5, slidesToScroll: 5, infinite: true } },
    { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 4, infinite: true } },
    { breakpoint: 991, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
    { breakpoint: 576, settings: { slidesToShow: 2, slidesToScroll: 2 } },
  ],
};

const RelatedProducts: NextPage<RelatedProductsProps> = ({ productId , categoryId }) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  console.log(" Current Product before useEffect:", productId);

  useEffect(() => {
  const handleUpdateAllProducts = (data: Product[]) => {
    console.log("allprods", data);
    const filtered = data.filter(
      (product) => product.categoryID === categoryId && product.id !== productId
    );
    setRelatedProducts(filtered.length ? filtered : []);
    
    console.log("Filtered related products:", filtered);
  };

  objCache.on('updateAllProducts', handleUpdateAllProducts);

  return () => {
    objCache.off('updateAllProducts', handleUpdateAllProducts);
  };
}, [categoryId, productId]);

  
//   useEffect(() => {
//     const products =searchController.getProductsByCategoryId(categoryId) as Product[];
//     console.log("Products from category:", products);
//     var result = products?.filter((product : Product) => product.id != productId);
//     console.log("Filtered related products:", result); 

//   console.log("relatedproducts",result);
//     if(result?.length)
//     setRelatedProducts(result)
//   else{
//      setRelatedProducts([]);
//   }
// }, [categoryId,productId]);


  return (
    <section className="section-big-py-space ratio_asos bg-light">
      <div className="custom-container">
        <Row>
          <Col className="product-related">
            <h2>Related Products</h2>
          </Col>
        </Row>

        {relatedProducts === null ? (
          <Skeleton />
        ) : relatedProducts?.length === 0 ? (
          <p>No related products found.</p>
        ) : (
          <Row>
            <Col className="product">
              <Slider {...settings}>
                {relatedProducts.map((item, i) => (
                  <div key={i}>
                    { <ProductBox
                      price={item.getPrice()}
                      item={item}
                      newLabel={item.new}
                      data={item}
                      addCart={() => addToCart(item)}
                      addCompare={() => addToCompare(item)}
                      addWish={() => addToWish(item)}
                    /> }
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