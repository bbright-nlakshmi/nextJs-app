import { NextPage } from "next";
import { Col, Container, Row } from "reactstrap";

interface breadcrumb {
  title: string;
  parent: string;
}

const Breadcrumb: NextPage<breadcrumb> = ({ title, parent }) => {
  return (
    <>
      <div className="breadcrumb-main ">
        <Container>
          <Row>
            <Col>
              <div className="breadcrumb-contain">
                <div>
                  <h2>{title}</h2>
                  <ul>
                    <li>
                      <a href="#">{parent}</a>
                    </li>
                    <li>
                      <i className="fa fa-angle-double-right"></i>
                    </li>
                    <li>
                      <a href="#">{title}</a>
                    </li>
                  </ul>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Breadcrumb;
