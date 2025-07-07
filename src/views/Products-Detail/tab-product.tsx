import React, { useState } from "react";
import { Col, Form, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";

type Props  = {
  description:string;
}
const TabProduct: React.FC<Props> = ({description}) => {
  const [activeTab, setActiveTab] = useState("1");

  return (
    <section className="tab-product tab-exes creative-card creative-inner mb-0">
      <Row>
        <Col sm="12" lg="12">
          <Nav tabs className="nav-material" id="top-tab" role="tablist">
            <NavItem>
              <NavLink className={activeTab === "1" ? "active" : ""} onClick={() => setActiveTab("1")}>
                Description
                <div className="material-border"></div>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink className={activeTab === "2" ? "active" : ""} onClick={() => setActiveTab("2")}>
                Video
                <div className="material-border"></div>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink className={activeTab === "3" ? "active" : ""} onClick={() => setActiveTab("3")}>
                Write Review
                <div className="material-border"></div>
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent className="nav-material" activeTab={activeTab}>
            <TabPane tabId="1">
              <p className="ps-0" dangerouslySetInnerHTML={{ __html: description }}></p>
              
            </TabPane>
            <TabPane tabId="2">
              <div id="videoWrapper" className="mt-3 text-center">
                <iframe id="videoFrame" width="560" height="315" src="https://www.youtube.com/embed/BUWzX78Ye_8" allow="autoplay; encrypted-media" allowFullScreen />
              </div>
            </TabPane>
            <TabPane tabId="3">
              <Form>
                <div className="form-row row">
                  <Col md="12">
                    <div className="media">
                      <Label className="mb-0">Rating</Label>
                      <div className="media-body ms-3">
                        <div className="rating three-star">
                          <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md="6">
                    <Label htmlFor="name">Name</Label>
                    <Input type="text" className="form-control" id="name" placeholder="Enter Your name" required />
                  </Col>
                  <Col md="6">
                    <Label htmlFor="email">Email</Label>
                    <Input type="text" className="form-control" placeholder="Email" required />
                  </Col>
                  <Col md="12">
                    <Label htmlFor="review">Review Title</Label>
                    <Input type="text" className="form-control" placeholder="Enter your Review Subjects" required />
                  </Col>
                  <Col md="12">
                    <Label htmlFor="review">Review Title</Label>
                    <textarea className="form-control" rows={4} placeholder="Write Your Testimonial Here" id="exampleFormControlTextarea1"></textarea>
                  </Col>
                  <Col md="12">
                    <button className="btn btn-normal" type="submit">
                      Submit YOur Review
                    </button>
                  </Col>
                </div>
              </Form>
            </TabPane>
          </TabContent>
        </Col>
      </Row>
    </section>
  );
};

export default TabProduct;
