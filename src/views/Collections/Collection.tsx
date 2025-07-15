/* eslint-disable @next/next/no-img-element */
"use client";
import { CompareContext } from "@/helpers/compare/compare.context";
import { NextPage } from "next";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Col, Row, Spinner, Button } from "reactstrap";
import { Skeleton } from "../../common/skeleton";
import { CartContext } from "../../helpers/cart/cart.context";
import { FilterContext } from "../../helpers/filter/filter.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import { useRouter, useSearchParams } from "next/navigation";
import { objCache, searchController } from "@/app/globalProvider";
import { Category, Discount, CategoryProducts } from "@/app/models/models";
import CollectionBanner from "./CollectionBanner";

type CollectionProps = {
  cols: any;
  layoutList: string;
  categoryProducts: CategoryProducts[];
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
  const [productData, setProductData] = useState<CategoryProducts[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id");
  const categoryType = searchParams.get("type");

  const getPrice = (item: any) => {
    return (categoryType === "discount")
      ? searchController.getDetails(item.id, "getPrice")
      : searchController.getDetails(item.productId, "getPrice");
  };

  const handlePagination = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPageLimit((prev) => prev + 10);
      setIsLoading(false);
    }, 500);
  };

  // Update productData whenever prop changes
  useEffect(() => {
    if (categoryType === "category") {
      setProductData([...categoryProducts]);
    } else if (categoryType === "discount") {
      const found = objCache.discountList.find((item: Discount) => item.id === categoryId);
      if (found) {
        setDiscount(found);
        setProductData(
          (found.discountItems || []).map((item: any) => ({
            ...item,
            active: item.active ?? false,
            productId: item.productId ?? item.id,
            categoryId: item.categoryId ?? "",
          }))
        );
      }
    }
  }, [categoryProducts, categoryType, categoryId]);
  
  return (
    <Col className="collection-content">
      <div className="page-main-content">
        <Row>
          <Col sm="12">
            <CollectionBanner img={discount?.img?.[0]} name={discount?.name} details={discount?.details} />
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
                        <div className="product">
                          <ProductBox
                            layout="layout-one"
                            data={item}
                            newLabel={item.new}
                            item={item}
                            price={getPrice(item)}
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
              <div className="product-pagination loadmore-pagination">
                <div className="theme-paggination-block">
                  <Row>
                    <Col xl="12" md="12" sm="12">
                      {productData?.length > pageLimit && (
                        <Button onClick={handlePagination}>
                          {isLoading ? (
                            <Spinner size="sm" color="light" />
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
