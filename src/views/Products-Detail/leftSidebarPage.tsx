import React, { useContext, useEffect, useState } from "react";
import { NextPage } from "next";
import { Row, Col } from "reactstrap";
import Sidebar from "../../views/Products-Detail/sidebar";
import ProductService from "../../views/Products-Detail/product-service";
import NewProduct from "../Collections/NewProduct";
import TabProduct from "../../views/Products-Detail/tab-product";
import ProductSlick from "../../views/Products-Detail/product-slick";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { FilterContext } from "@/helpers/filter/filter.context";
import { Category, Discount, DiscountItem, objCache } from "@/app/globalProvider";

interface LeftSidebar {
  pathId: any;
}


const LeftSidebarPage: NextPage<LeftSidebar> = ({ pathId }) => {
  const filterContext = useContext(FilterContext);
  const { filterOpen, setFilterOpen } = filterContext;
  const [discount, setDiscount] = useState<DiscountItem>();
  const [productData, setProductData] = useState<any>();
  var loading, data;
  var foundDiscount;
  useEffect(() => {
   data = objCache.getProductsById(pathId);
    setProductData(data);
  }, []);
console.log(productData,pathId);
  return (
    <div className="collection-wrapper">
      {productData && (
        <div className="custom-container">
          <Row>
            {/* <Col
              sm="3"
              className="collection-filter"
              style={{
                left: filterOpen ? "-15px" : "",
              }}>
              <Sidebar />
              <ProductService />
              <NewProduct />
            </Col> */}
            <Col sm="12" lg="9" xs="12">
              <Row>
                <Col xl="12">
                  <div className="filter-main-btn mb-sm-4">
                    <span className="filter-btn" onClick={() => setFilterOpen(!filterOpen)}>
                      <i className="fa fa-filter" aria-hidden="true"></i> filter
                    </span>
                  </div>
                </Col>
              </Row>
              <Row>
                <ProductSlick item={productData} bundle={false} swatch={false} />
              </Row>
              <TabProduct />
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default LeftSidebarPage;
