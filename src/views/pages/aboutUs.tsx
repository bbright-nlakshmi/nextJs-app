/* eslint-disable no-tabs */
import React from "react";
import { NextPage } from "next";
import { Media, Row, Col, Container } from "reactstrap";
import Testimonial from "../layouts/widgets/testimonial";
import Slider from "react-slick";
import DiscountCoupon from "../layouts/widgets/price_ranges";
import Breadcrumb from "../../views/Containers/Breadcrumb";

var settings = {
  dots: false,
  infinite: true,
  speed: 300,
  autoplay: true,
  slidesToShow: 4,
  slidesToScroll: 4,
  responsive: [
    {
      breakpoint: 1367,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 4,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 5,
        infinite: true,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 4,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
      },
    },
    {
      breakpoint: 420,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
      },
    },
  ],
};

const AboutPage: NextPage = () => {
  return (
    <div className="bg-light">
      {/* <!-- breadcrumb start --> */}
      <Breadcrumb title="About-us" parent="home" />
      {/* <!-- breadcrumb End --> */}
      {/* <!-- about section start --> */}
      <section className="about-page section-big-py-space">
        <div className="custom-container">
          <Row>
            <Col lg="6">
              <div className="banner-section">
                <Media src="/images/blog/1.jpg" className="img-fluid w-100" alt="" />
              </div>
            </Col>
            <Col lg="6">
              <h4>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium</h4>
              <p className="mb-2">
                {" "}
                Sed ut perspiciatis unde omnis iste natus <b>error sit</b> voluptatem accusantium doloremque laudantium,
              </p>
              <p className="mb-2"> On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain.</p>
              <p className="mb-2">
                {" "}
                These <b>cases</b> are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our
              </p>
              <p>
                {" "}
                being able to do what we like best, every pleasure is to be <b>welcomed</b> and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid <b>worse</b> pains.
              </p>
            </Col>
          </Row>
        </div>
      </section>
      {/* <!-- about section end --> */}
      <section className="testimonial testimonial-inverse">
        <Testimonial />
      </section>

      {/* <!--Team start--> */}
      <section id="team" className="team section-big-py-space ratio_asos">
        <div className="custom-container">
          <Row>
            <Col sm="12">
              <h2>Our Team</h2>
              <Slider className="team-4" {...settings}>
                <div>
                  <div>
                    <Media src="/images/about/team/1.jpg" className="img-fluid  bg-img" alt="team" />
                  </div>
                  <h4>Hileri Keol</h4>
                  <h6>CEo & Founder At Company</h6>
                </div>
                <div>
                  <div>
                    <Media src="/images/about/team/2.jpg" className="img-fluid  bg-img" alt="team" />
                  </div>
                  <h4>Hileri Keol</h4>
                  <h6>CEo & Founder At Company</h6>
                </div>
                <div>
                  <div>
                    <Media src="/images/about/team/3.jpg" className="img-fluid  bg-img" alt="team" />
                  </div>
                  <h4>Hileri Keol</h4>
                  <h6>CEo & Founder At Company</h6>
                </div>
                <div>
                  <div>
                    <Media src="/images/about/team/4.jpg" className="img-fluid  bg-img" alt="team" />
                  </div>
                  <h4>Hileri Keol</h4>
                  <h6>CEo & Founder At Company</h6>
                </div>
                <div>
                  <div>
                    <Media src="/images/about/team/5.jpg" className="img-fluid  bg-img" alt="team" />
                  </div>
                  <h4>Hileri Keol</h4>
                  <h6>CEo & Founder At Company</h6>
                </div>
              </Slider>
            </Col>
          </Row>
        </div>
      </section>
      {/* <!--Team ends--> */}

      {/* <!--services start--> */}
      <section className="services">
        <Container>
          <Row className="service-block">
            <Col lg="3" md="6" sm="12">
              <div className="media">
                <svg height="679pt" viewBox="0 -117 679.99892 679" width="679pt" xmlns="http://www.w3.org/2000/svg">
                  <path d="m12.347656 378.382812h37.390625c4.371094 37.714844 36.316407 66.164063 74.277344 66.164063 37.96875 0 69.90625-28.449219 74.28125-66.164063h241.789063c4.382812 37.714844 36.316406 66.164063 74.277343 66.164063 37.96875 0 69.902344-28.449219 74.285157-66.164063h78.890624c6.882813 0 12.460938-5.578124 12.460938-12.460937v-352.957031c0-6.882813-5.578125-12.464844-12.460938-12.464844h-432.476562c-6.875 0-12.457031 5.582031-12.457031 12.464844v69.914062h-105.570313c-4.074218.011719-7.890625 2.007813-10.21875 5.363282l-68.171875 97.582031-26.667969 37.390625-9.722656 13.835937c-1.457031 2.082031-2.2421872 4.558594-2.24999975 7.101563v121.398437c-.09765625 3.34375 1.15624975 6.589844 3.47656275 9.003907 2.320312 2.417968 5.519531 3.796874 8.867187 3.828124zm111.417969 37.386719c-27.527344 0-49.851563-22.320312-49.851563-49.847656 0-27.535156 22.324219-49.855469 49.851563-49.855469 27.535156 0 49.855469 22.320313 49.855469 49.855469 0 27.632813-22.21875 50.132813-49.855469 50.472656zm390.347656 0c-27.53125 0-49.855469-22.320312-49.855469-49.847656 0-27.535156 22.324219-49.855469 49.855469-49.855469 27.539063 0 49.855469 22.320313 49.855469 49.855469.003906 27.632813-22.21875 50.132813-49.855469 50.472656zm140.710938-390.34375v223.34375h-338.375c-6.882813 0-12.464844 5.578125-12.464844 12.460938 0 6.882812 5.582031 12.464843 12.464844 12.464843h338.375v79.761719h-66.421875c-4.382813-37.710937-36.320313-66.15625-74.289063-66.15625-37.960937 0-69.898437 28.445313-74.277343 66.15625h-192.308594v-271.324219h89.980468c6.882813 0 12.464844-5.582031 12.464844-12.464843 0-6.882813-5.582031-12.464844-12.464844-12.464844h-89.980468v-31.777344zm-531.304688 82.382813h99.703125v245.648437h-24.925781c-4.375-37.710937-36.3125-66.15625-74.28125-66.15625-37.960937 0-69.90625 28.445313-74.277344 66.15625h-24.929687v-105.316406l3.738281-5.359375h152.054687c6.882813 0 12.460938-5.574219 12.460938-12.457031v-92.226563c0-6.882812-5.578125-12.464844-12.460938-12.464844h-69.796874zm-30.160156 43h74.777344v67.296875h-122.265625zm0 0" />
                </svg>
                <div className="media-body">
                  <h5>free shipping</h5>
                </div>
              </div>
            </Col>
            <Col lg="3" md="6" sm="12">
              <div className="media">
                <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 417.12 417.12" xmlSpace="preserve">
                  <g>
                    <g>
                      <path
                        d="M409.12,200.741c-4.418,0-8,3.582-8,8c-0.06,106.525-86.464,192.831-192.988,192.772
			C101.607,401.453,15.3,315.049,15.36,208.524C15.42,102,101.824,15.693,208.348,15.753c51.36,0.029,100.587,20.54,136.772,56.988
			l-17.84-0.72c-4.418,0-8,3.582-8,8s3.582,8,8,8l36.72,1.52c1.013,0.003,2.018-0.188,2.96-0.56l0.88-0.56
			c1.381-0.859,2.534-2.039,3.36-3.44c0.034-0.426,0.034-0.854,0-1.28c0.183-0.492,0.317-1.001,0.4-1.52l3.2-36.72
			c0.376-4.418-2.902-8.304-7.32-8.68s-8.304,2.902-8.68,7.32l-1.6,18.16c-80.799-82.092-212.848-83.14-294.939-2.341
			s-83.14,212.848-2.341,294.939s212.848,83.14,294.939,2.341c39.786-39.159,62.212-92.635,62.261-148.459
			C417.12,204.323,413.538,200.741,409.12,200.741z"
                      />
                    </g>
                  </g>
                  <g>
                    <g>
                      <path
                        d="M200.4,256.341c-3.716-2.516-8.162-3.726-12.64-3.44h-56c1.564-2.442,3.302-4.768,5.2-6.96
			c6.727-7.402,14.088-14.201,22-20.32c10.667-8.747,18.293-15.147,22.88-19.2c5.252-4.976,9.752-10.689,13.36-16.96
			c4.377-7.234,6.649-15.545,6.56-24c-0.009-11.177-4.27-21.931-11.92-30.08c-3.725-3.941-8.181-7.12-13.12-9.36
			c-8.709-3.645-18.08-5.443-27.52-5.28c-8.048-0.163-16.055,1.194-23.6,4c-6.2,2.328-11.862,5.894-16.64,10.48
			c-4.219,4.117-7.565,9.042-9.84,14.48c-2.098,4.853-3.213,10.074-3.28,15.36c-0.192,3.547,1.081,7.018,3.52,9.6
			c2.345,2.352,5.56,3.626,8.88,3.52c3.499,0.231,6.903-1.19,9.2-3.84c2.503-3.303,4.424-7.01,5.68-10.96
			c0.939-3.008,2.144-5.926,3.6-8.72c4.562-7.738,12.94-12.416,21.92-12.24c4.114,0.077,8.149,1.147,11.76,3.12
			c3.625,1.82,6.693,4.583,8.88,8c2.194,3.673,3.329,7.882,3.28,12.16c-0.067,4.437-1.105,8.806-3.04,12.8
			c-2.129,4.829-5.019,9.286-8.56,13.2c-4.419,4.617-9.298,8.772-14.56,12.4c-5.616,4.247-10.96,8.843-16,13.76
			c-7.787,7.04-16.453,15.467-26,25.28c-2.638,2.966-4.773,6.344-6.32,10c-1.632,3.159-2.612,6.614-2.88,10.16
			c-0.018,3.939,1.605,7.707,4.48,10.4c3.393,3.096,7.896,4.684,12.48,4.4h78.4c3.842,0.312,7.641-0.993,10.48-3.6
			c2.291-2.379,3.53-5.579,3.44-8.88C204.691,262.051,203.173,258.598,200.4,256.341z"
                      />
                    </g>
                  </g>
                  <g>
                    <g>
                      <path
                        d="M333.76,222.901c-4.254-1.637-8.809-2.346-13.36-2.08h-4.56v-82.48c0-12.373-5.333-18.56-16-18.56
			c-3.185-0.052-6.261,1.155-8.56,3.36c-3.331,3.343-6.382,6.956-9.12,10.8l-56.48,75.6l-3.92,5.2c-1.067,1.44-2.107,2.907-3.12,4.4
			c-0.916,1.374-1.668,2.851-2.24,4.4c-0.475,1.308-0.718,2.689-0.72,4.08c-0.237,4.699,1.607,9.263,5.04,12.48
			c4.323,3.358,9.742,4.984,15.2,4.56h53.52v20.08c-0.273,4.252,1.006,8.459,3.6,11.84c5.276,5.346,13.887,5.403,19.233,0.127
			c0.043-0.042,0.085-0.084,0.127-0.127c2.587-3.384,3.866-7.589,3.6-11.84v-20h6.48c4.242,0.298,8.476-0.677,12.16-2.8
			c2.877-2.141,4.425-5.63,4.08-9.2C339.301,228.744,337.319,224.811,333.76,222.901z M289.36,220.581h-45.84l45.84-61.92V220.581z"
                      />
                    </g>
                  </g>
                </svg>
                <div className="media-body">
                  <h5>24X7 SERVICE</h5>
                </div>
              </div>
            </Col>
            <Col lg="3" md="6" sm="12">
              <div className="media">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 295.82 295.82" xmlnsXlink="http://www.w3.org/1999/xlink" enableBackground="new 0 0 295.82 295.82">
                  <g>
                    <g>
                      <path d="m269.719,43.503h-243.617c-13.921,0-26.102,12.181-26.102,26.102v156.611c0,13.921 12.181,26.102 26.102,26.102h243.617c13.921,0 26.102-12.181 26.102-26.102v-156.611c-0.001-13.921-12.182-26.102-26.102-26.102zm-243.617,17.401h243.617c5.22,0 8.701,3.48 8.701,8.701v13.921h-261.019v-13.921c-1.06581e-14-5.22 3.481-8.701 8.701-8.701zm252.317,40.023v13.921h-261.018v-13.921h261.018zm-8.7,133.989h-243.617c-5.22,0-8.701-3.48-8.701-8.701v-93.966h261.018v93.966c0,5.221-3.48,8.701-8.7,8.701z" />
                      <path d="m45.243,172.272h45.243c5.22,0 8.701-3.48 8.701-8.701 0-5.22-3.48-8.701-8.701-8.701h-45.243c-5.22,0-8.701,3.48-8.701,8.701 0.001,5.221 3.481,8.701 8.701,8.701z" />
                      <path d="m151.391,191.413h-106.148c-5.22,0-8.701,3.48-8.701,8.701s3.48,8.701 8.701,8.701h106.147c3.48,0 8.701-3.48 8.701-8.701s-3.48-8.701-8.7-8.701z" />
                    </g>
                  </g>
                </svg>
                <div className="media-body">
                  <h5>EASY RETURN</h5>
                </div>
              </div>
            </Col>
            <Col lg="3" md="6" sm="12">
              <div className="media">
                <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 448 448" xmlSpace="preserve">
                  <g>
                    <g>
                      <g>
                        <path
                          d="M384,172.4C384,83.6,312.4,12,224,12S64,83.6,64,172c0,0,0,0,0,0.4C28.4,174.4,0,204,0,240v8c0,37.6,30.4,68,68,68h3.6
				l28.4,45.2c20,32,54,50.8,91.6,50.8h5.6c3.6,13.6,16,24,30.8,24c17.6,0,32-14.4,32-32c0-17.6-14.4-32-32-32
				c-14.8,0-27.2,10.4-30.8,24h-5.6c-32,0-61.2-16.4-78-43.6L90.4,316H96c8.8,0,16-7.2,16-16V188c0-8.8-7.2-16-16-16H80
				c0-79.6,64.4-144,144-144s144,64.4,144,144h-16c-8.8,0-16,7.2-16,16v112c0,8.8,7.2,16,16,16h28c37.6,0,68-30.4,68-68v-8
				C448,204,419.6,174.4,384,172.4z M228,388c8.8,0,16,7.2,16,16s-7.2,16-16,16s-16-7.2-16-16S219.2,388,228,388z M96,188v112H68
				c-28.8,0-52-23.2-52-52v-8c0-28.8,23.2-52,52-52H96z M432,248c0,28.8-23.2,52-52,52h-28V188h28c28.8,0,52,23.2,52,52V248z"
                        />
                        <path
                          d="M290.4,72.4c-0.8-0.4-2-1.2-3.2-2c-1.2-0.8-2.4-1.6-3.2-2c-3.6-2.4-8.8-1.2-10.8,2.8S272,79.6,276,82
				c0.8,0.4,2,1.2,3.2,2s2.4,1.6,3.6,2c1.2,0.8,2.8,1.2,4,1.2c2.8,0,5.2-1.2,6.8-4C295.6,79.6,294.4,74.8,290.4,72.4z"
                        />
                        <path
                          d="M224,52c-34,0-66,14.8-88,40.4c-2.8,3.2-2.4,8.4,0.8,11.2c1.6,1.2,3.2,2,5.2,2c2.4,0,4.4-0.8,6-2.8
				c19.2-22,46.8-34.8,76-34.8c7.2,0,14.4,0.8,21.6,2.4c4.4,0.8,8.4-2,9.6-6s-2-8.4-6-9.6C240.8,52.8,232.4,52,224,52z"
                        />
                      </g>
                    </g>
                  </g>
                </svg>
                <div className="media-body">
                  <h5>ONLINE PAYMENT</h5>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* <!--services end--> */}

      <section className="box-category section-py-space">
        <DiscountCoupon />
      </section>
    </div>
  );
};

export default AboutPage;
