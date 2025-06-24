/* eslint-disable @next/next/no-img-element */
import { gql, useQuery } from "@apollo/client";
import { NextPage } from "next";
import "photoswipe/dist/photoswipe.css";
import React, { useState } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";
import { Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";

const GET_PRODUCTS = gql`
  query getProducts($type: CategoryType) {
    products(type: $type) {
      items {
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
        variants {
          id
          sku
          size
          color
          image_id
        }
        images {
          image_id
          id
          alt
          src
        }
      }
    }
  }
`;

interface PortfolioProps {
  cols: any;
}

const categories = ["FLOWER", "FASHION", "BAGS", "SHOES", "WATCH"];

const Portfolio: NextPage<PortfolioProps> = ({ cols }) => {
  const [activeTab, setActiveTab] = useState("FLOWER");
  // var { loading, data } = useQuery(GET_PRODUCTS, {
  //   variables: {
  //     type: activeTab,
  //     indexFrom: 0,
  //   },
  // });
  var  loading, data;

  return (
    <section className="portfolio-section grid-portfolio ratio2_3 portfolio-padding section-big-pt-space bg-light">
      <div className="container-lg">
        <div className="text-center">
          <Nav tabs>
            {categories.map((category, i) => (
              <NavItem key={i} className="filter-button project_button">
                <NavLink
                  className={activeTab === category ? "active" : ""}
                  onClick={() => {
                    setActiveTab(category);
                  }}
                >
                  {category}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
        </div>
        {data && !loading && (
          <Row className="zoom-gallery portfolio-2">
            <TabContent activeTab={activeTab}>
              <TabPane tabId={activeTab}>
                <Gallery>
                  {data &&
                    data.products &&
                    data.products.items.map((item: any, i: any) => (
                      <div className={cols} key={i}>
                        <div className="overlay">
                          <div className="border-portfolio">
                            <Item original={`/images/${item.images[0].src}`} width="1024" height="768">
                              {({ ref, open }) => (
                                <a href="#" onClick={open}>
                                  <div className="overlay-background">
                                    <i className="ti-plus" aria-hidden="true"></i>
                                  </div>
                                  <img ref={ref} src={`/images/${item.images[0].src}`} alt="portfolio-image" />
                                </a>
                              )}
                            </Item>
                          </div>
                        </div>
                      </div>
                    ))}
                </Gallery>
              </TabPane>
            </TabContent>
          </Row>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
