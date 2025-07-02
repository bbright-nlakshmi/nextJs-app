/* eslint-disable @next/next/no-img-element */
"use client";
import { CompareContext } from "@/helpers/compare/compare.context";
import { gql, useQuery } from "@apollo/client";
import { NextPage } from "next";
import React, { useContext, useEffect, useState } from "react";
import { Col, Row, Spinner, Button } from "reactstrap";
import { Skeleton } from "../../common/skeleton";
import { CartContext } from "../../helpers/cart/cart.context";
import { FilterContext } from "../../helpers/filter/filter.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import CollectionBanner from "./CollectionBanner";
import { useRouter, useSearchParams } from "next/navigation";
import { objCache, searchController } from "@/app/globalProvider";
import { Category, Discount, CategoryProducts } from "@/app/models/models";

type CollectionProps = {
  cols: any;
  layoutList: string;
  categoryProducts: CategoryProducts[]
};

const Collection: NextPage<CollectionProps> = ({ cols, layoutList, categoryProducts }) => {
  const {
    selectedCategory,
    selectedBrands,
    selectedColor,
    selectedPrice,
    setSelectedColor,
    setSelectedBrands,

  } = useContext(FilterContext);
  const { addToCart } = useContext(CartContext);
  const { addToWish } = useContext(WishlistContext);
  const { addToCompare } = useContext(CompareContext);
  const [grid, setGrid] = useState(cols);
  const [sortBy, setSortBy] = useState("ASC_ORDER");
  const [pageLimit, setPageLimit] = useState(50);
  const [layout, setLayout] = useState(layoutList);
  const [discount, setDiscount] = useState<Discount>();
  const [category, setCategory] = useState<Category>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id");
  const categoryType = searchParams.get("type");
  const [product, setProduct] = useState<any>();
  const [productData, setProductData] = useState<any>();
  var foundItem: any = {};
  useEffect(() => {

    if (categoryType == 'discount') {
      foundItem = objCache.discountList.find((item: Discount) => item.id === categoryId)
      if (foundItem) {
        setProduct(foundItem);
      }
      objCache.on('updateDiscountProducts', (data: Discount[]) => {

        if (data && data.length > 0) {
          foundItem = data.find((item: Discount) => item.id === categoryId);
          if (foundItem) {
            setProduct(foundItem);
          }

        }
      });
      setProductData(foundItem?.discountItems);
    }
    else if (categoryType == 'category') {

      foundItem = objCache.allCategories.find((item: Category) => item.id === categoryId);
     
      if (foundItem) {
        setProduct(foundItem);
      }
      objCache.on('updateAllCategories', (data: Category[]) => {

        if (data && data.length > 0) {
          foundItem = data.find((item: Category) => item.id === categoryId);
          if (foundItem) {
            setProduct(foundItem);

          }

        }
      });
      setProductData(foundItem?.category_products);

    }
console.log(categoryProducts);
    if(categoryProducts?.length){
      setProductData([...categoryProducts]);
    }
console.log(categoryProducts)
    console.log(productData)
    return () => {
      objCache.off('updateDiscountProducts', () => { });
    };
  }, []);

  // const handleUserLogin = (userId) => {
  //       console.log(`User ${userId} has logged in!`);
  //       // Perform actions based on user login, e.g., fetch user-specific data
  //     };
  const removeBrand = (val: any) => {
    const temp = [...selectedBrands];
    temp.splice(selectedBrands.indexOf(val), 1);
    setSelectedBrands(temp);
  };

  const removeColor = () => {
    setSelectedColor("");
  };

  const handlePagination = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPageLimit((prev) => prev + 10);
      setIsLoading(false);
    }, 500);
  };


const getPrice = (item:any) => {
  var price:number = 0;
   price = (categoryType == 'discount')?searchController.getDetails(item.id, 'getPrice'):searchController.getDetails(item.product_id, 'getPrice');
  return price;
}
  return (
    <Col className="collection-content">
      <div className="page-main-content">
        <Row>
          <Col sm="12">
            <div className="collection-product-wrapper">
            
              {/* Product Grid */}
              <div className={`product-wrapper-grid ${layout}`}>
                <Row>
                  {!productData?.length ? (
                    <Col xs="12">
                      <Skeleton />
                    </Col>
                  ) : (
                    productData.slice(0, pageLimit).map((item: any, i: number) => (
                      <div className={grid} key={i}>
                        <div className="product"  >
                          <ProductBox
                            layout="layout-one"
                            data={item}
                            newLabel={item.new}
                            item={item}
                            price={getPrice(item)}
                            addCart={() => addToCart(item)}
                            addCompare={() => addToCompare(item)}
                            addWish={() => addToWish(item)}                         />
                        </div>
                      </div>
                    ))
                  )}
                </Row>
              </div>

              {/* Pagination */}
              <div className="product-pagination loadmore-pagination">
                <div className="theme-paggination-block">
                  <Row>
                    <Col xl="12" md="12" sm="12">
                      {productData?.length > pageLimit && (
                        <Button onClick={handlePagination}>
                          {isLoading ? (
                            <Spinner size="sm" color="light">
                              {" "}
                            </Spinner>
                          ) : (
                            "Load More"
                          )}
                        </Button>
                      )}
                    </Col>
                  </Row>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Col>
  );
};

export default Collection;
