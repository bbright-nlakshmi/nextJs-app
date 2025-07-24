import React, { useContext } from "react";
import { Row, Col } from "reactstrap";
import { NextPage } from "next";
import Sidebar from "../../views/Products-Detail/sidebar";
import ProductService from "../../views/Products-Detail/product-service";
import NewProduct from "../Collections/NewProduct";
import TabProduct from "../../views/Products-Detail/tab-product";
import ProductSlick from "../../views/Products-Detail/product-slick";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { FilterContext } from "@/helpers/filter/filter.context";

const GET_SINGLE_PRODUCTS = gql`
  query getProducts($id: Float!) {
    product(id: $id) {
      id
      title
      description
      type
      brand
      category
      price
      new
      sale
      discount
      stock
      variants {
        id
        sku
        size
        color
        image_id
      }
      images {
        alt
        src
      }
    }
  }
`;

const RightSidebarPage: NextPage = () => {
  const { loading, data } = useQuery(GET_SINGLE_PRODUCTS, {
    variables: {
      id: 1,
    },
  });

  const { filterOpen, setFilterOpen } = useContext(FilterContext);

return (
  <div className="collection-wrapper">
    {data && data.product && !loading ? (
      <div className="custom-container">
        <Row className="gy-4">        
          <Col xs="12" lg="9" className="order-2 order-lg-1">
            <Row>
              <Col xs="12">
                <div className="filter-main-btn mb-3 d-lg-none">
                  <span
                    className="filter-btn"
                    onClick={() => setFilterOpen(!filterOpen)}
                  >
                    <i className="fa fa-filter" aria-hidden="true"></i> filter
                  </span>
                </div>
              </Col>
            </Row>

            <Row>
              <ProductSlick item={data.product} bundle={false} swatch={false} />
            </Row>
            <TabProduct />
          </Col>

          {/* Sidebar */}
          <Col 
            sm="12"
            lg="3"
            className={`collection-filter order-1 order-lg-2 ${
              filterOpen ? "d-block" : "d-none d-lg-block"
            }`}
            style={{
              transition: "all 0.3s ease-in-out",
            }}
          >
            <Sidebar />
            <ProductService />
            <NewProduct />
          </Col>
        </Row>
      </div>
    ) : (
      ""
    )}
  </div>
);
};

export default RightSidebarPage;
