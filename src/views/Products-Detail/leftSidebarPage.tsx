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

var data: any;
const LeftSidebarPage: NextPage<LeftSidebar> = ({ pathId }) => {
  const filterContext = useContext(FilterContext);
  const { filterOpen, setFilterOpen } = filterContext;
  const [discount, setDiscount] = useState<DiscountItem>();
  const [productData, setProductData] = useState<any>();

  var foundDiscount;
  useEffect(() => {
    data = objCache.findProductById(pathId);

    setProductData(data);
  }, []);

  return (
    <div className="collection-wrapper">
      {productData && (
        <div className="custom-container">
          <Row>
            
            <Col sm="12" lg="12" xs="12" xl="9">
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
                <Col>
                  <ProductSlick item={productData} bundle={false} swatch={false} />
                </Col>
              </Row>
              <TabProduct description={productData.description ? productData.description[0].description : ''} />
            </Col>
        <Col
              xl="3"
              className="collection-filter"
              style={{
                left: filterOpen ? "-15px" : "",
              }}>
              <Row>
                {/* <Sidebar /> */}
                <Col lg="6">
                  <ProductService />
                </Col>
                <Col lg="6">
                  <NewProduct />
                </Col>
              </Row>
            </Col>
          </Row>
          <Row>
            <Col
              lg="12"
              className="collection-filter d-xl-none d-lg-none"
              style={{
                left: filterOpen ? "-15px" : "",
              }}>
              <Row>
                {/* <Sidebar /> */}
                <Col lg="6">
                  <ProductService />
                </Col>
                <Col lg="6">
                  <NewProduct />
                </Col>
              </Row>
            </Col>


          </Row>
        </div>
      )}
    </div>
  );
};

export default LeftSidebarPage;
