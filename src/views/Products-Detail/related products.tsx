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

interface RelatedProductsProps {
  productId: string;
  categoryId: string;
}

const RelatedProducts: NextPage<RelatedProductsProps> = ({ productId, categoryId }) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [pageLimit, setPageLimit] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

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

  const handlePagination = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPageLimit((prev) => prev + 5);
      setIsLoading(false);
    }, 500);
  };

  return (
    <section className="section-big-py-space ratio_asos bg-light">
      <div className="custom-container">
        <Row>
          <Col sm="12">
            <h2>Related Products</h2>
            <div className="collection-product-wrapper">
              <div className={`product-wrapper-grid`}>
                <Row>
                  {!relatedProducts?.length ? (
                    <Col xs="12">
                      <Skeleton />
                    </Col>
                  ) : (
                    relatedProducts.slice(0, pageLimit).map((item, i) => (
                      <div className="col-2" key={i}>
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
                          />
                        </div>
                      </div>
                    ))
                  )}
                </Row>
              </div>
              {/* Pagination */}
              {relatedProducts?.length > pageLimit && (
                <div className="product-pagination loadmore-pagination">
                  <div className="theme-paggination-block text-center mt-4">
                    <Button onClick={handlePagination}>
                      {isLoading ? (
                        <Spinner size="sm" color="light">
                          {" "}
                        </Spinner>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default RelatedProducts;
