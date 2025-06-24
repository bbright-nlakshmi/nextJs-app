import { WishlistContext } from "@/helpers/wishlist/wish.context";
import React, { useState } from "react";
import { Row, Col, Card, Collapse } from "reactstrap";

interface OrderKitItems {
  name: string;
  inKitSalePrice: number;
  inKitQuantity: number;
  img: string[];
  inKitCount: number;
  inKitCostPrice: number;
}

interface ProductRightProps {
  item: any;
}

const KitDiscription: React.FC<ProductRightProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDetail, setIsDetail] = useState(false);
  const [isReview, setIsReview] = useState(false);

  const { addToWish } = React.useContext(WishlistContext);

  return (
    <div className="product-right product-description-box">
      <h2>{item.name || item.title}</h2> {/* Added item.name fallback to item.title */}
      <div className="product-name mb-2">
        <h4>{item.label || 'Kit Product'}</h4> {/* Added kit name display */}
      </div>
      <div className="rating three-star mb-2">
        <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i>
      </div>
      <div className="product-icon mb-3">
        <ul className="product-social">
          <li>
            <a href="#">
              <i className="fa fa-facebook"></i>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-google-plus"></i>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-twitter"></i>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-instagram"></i>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-rss"></i>
            </a>
          </li>
        </ul>
        <div className="d-inline-block">
          <button className="wishlist-btn" onClick={() => addToWish(item)}>
            <i className="fa fa-heart"></i>
            <span className="title-font">Add To WishList</span>
          </button>
        </div>
      </div>
      <Row className="product-accordion">
        <Col sm="12">
          <div className="accordion theme-accordion" id="accordionExample">
            <Card>
              <div className="card-header" id="headingOne">
                <h5 className="mb-0">
                  <button className="btn btn-link" type="button" onClick={() => setIsOpen(!isOpen)}>
                    product description
                  </button>
                </h5>
              </div>
              <Collapse isOpen={isOpen} aria-labelledby="headingOne" data-parent="#accordionExample">
                <div className="card-body">
                  <div className="single-product-tables detail-section">
                    <table>
                      <tbody>
                        <tr>
                          <td>Stock Status:</td>
                          <td>{item.stock > 0 ? 'In Stock' : 'Out of Stock'}</td>
                        </tr>
                        <tr>
                          <td>Available Quantity:</td>
                          <td>{item.stock}</td>
                        </tr>
                        <tr>
                          <td>Min Order:</td>
                          <td>{item.minCount || 1}</td>
                        </tr>
                        <tr>
                          <td>Max Order:</td>
                          <td>{item.maxCount || 'No limit'}</td>
                        </tr>
                        {item.isReturnable && (
                          <tr>
                            <td>Return Policy:</td>
                            <td>Returnable within 30 days</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Collapse>
            </Card>
            <Card>
              <div className="card-header" id="headingTwo">
                <h5 className="mb-0">
                  <button className="btn btn-link collapsed" type="button" onClick={() => setIsDetail(!isDetail)}>
                    details
                  </button>
                </h5>
              </div>
              <Collapse isOpen={isDetail} id="collapseTwo" aria-labelledby="headingTwo">
                <div className="card-body">
                  {item.kitItems?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm text-center">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Sale Price</th>
                            <th>Cost Price</th>
                            <th>Qty</th>
                            <th>Total Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.kitItems.map((kitItem, index) => (
                            <tr key={index}>
                              <td>
                                {kitItem.img && kitItem.img.length > 0 ? (
                                  <img src={kitItem.img[0]} alt={kitItem.name} style={{ width: 50, height: 50, objectFit: "cover" }} />
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td>{kitItem.name}</td>
                              <td>{kitItem.inKitSalePrice}</td>
                              <td>{kitItem.inKitCostPrice}</td>
                              <td>{kitItem.inKitQuantity}</td>
                              <td>{kitItem.inKitCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center">No kit items available.</p>
                  )}
                </div>
              </Collapse>
            </Card>
            <Card>
              <div className="card-header" id="headingThree">
                <h5 className="mb-0">
                  <button className="btn btn-link collapsed" type="button" onClick={() => setIsReview(!isReview)}>
                    review
                  </button>
                </h5>
              </div>
              <Collapse id="collapseThree" isOpen={isReview}>
                <div className="card-body">
                  <p>no reviews yet</p>
                </div>
              </Collapse>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default KitDiscription;