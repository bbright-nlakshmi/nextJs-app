// FooterSection.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Row, Col, Container, Media, Input } from "reactstrap";
import { API } from "@/app/services/api.service";
import { useRouter } from "next/navigation";
import { BusinessDetails } from "@/app/globalProvider";

type FooterProps = {
  layoutLogo: string;
};
const FooterSection: React.FC<FooterProps> = ({ layoutLogo }) => {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logoRes = await API.getAppLogo();
        if (logoRes?.appLogo) setLogoUrl(logoRes.appLogo);
        const businessRes = await API.getBusinessDetails();
        setBusiness(businessRes);
      } catch (err) {
        console.error("Error fetching logo:", err);
      }
    };
    fetchData();
  }, []);

  const toggleAccordion = (section: string) => {
    if (window.innerWidth < 768) {
      setActiveAccordion((prev) => (prev === section ? null : section));
    }
  };

  const isMobile = () =>
    typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <footer className="footer-2">
      <Container>
        <Row>
          <Col xs="12">
            <div className="footer-main-contian">
              <Row>
                <Col lg="4" md="12">
                  <div className="footer-left">
                    <div className="footer-logo">
                      {logoUrl ? (
                        <Media src={logoUrl} className="img-fluid" alt="logo" />
                      ) : (
                        <span>Loading logo...</span>
                      )}
                    </div>
                    <div className="footer-detail">
                      <ul className="paymant-bottom d-flex justify-content-center align-items-center gap-2 list-unstyled m-0">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <li key={num}>
                            <a href="#">
                              <Media
                                src={`/images/layout-1/pay/${num}.png`}
                                className="img-fluid"
                                alt={`pay-${num}`}
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Col>

                <Col lg="8" md="12">
                  <div className="footer-right">
                    <Row>
                      <Col md="12">
                        <div className="account-right">
                          <Row>
                            {[
                              {
                                id: "my-account",
                                title: "my account",
                                links: [
                                  ["About Us", "/pages/about-us"],
                                  ["contact us", "/pages/ContactUs"],
                                  ["terms & conditions", "/pages/terms"],
                                  ["privacy Policy", "/pages/privacy"],
                                ],
                              },
                              {
                                id: "quick-link",
                                title: "quick link",
                                links: [
                                  ["Store Location", "/pages/store"],
                                  ["my account", "/pages/account/profile"],
                                  ["orders tracking", "#"],
                                  ["FAQ", "#"],
                                ],
                              },
                              {
                                id: "contact-us",
                                title: "contact us",
                                content: (
                                  <ul className="contact-list">
                                    <li>
                                      <i className="fa fa-map-marker"></i>
                                      <span>
                                        {business?.address ||
                                          "Loading address..."}
                                        <br />
                                        <span>India</span>
                                      </span>
                                    </li>
                                    <li>
                                      <i className="fa fa-phone"></i>
                                      <span>
                                        call us:{" "}
                                        {business?.phone || "Loading..."}
                                      </span>
                                    </li>
                                    <li>
                                      <i className="fa fa-envelope-o"></i>
                                      <span>
                                        email us:{" "}
                                        {business?.email || "Loading..."}
                                      </span>
                                    </li>
                                  </ul>
                                ),
                              },
                            ].map((section, i) => (
                              <Col
                                md={i === 2 ? "5" : i === 1 ? "3" : "4"}
                                key={section.id}
                              >
                                <div className="footer-box ">
                                  <div
                                    className="footer-title mt-0 mb-0"
                                    onClick={() => toggleAccordion(section.id)}
                                    style={{
                                      cursor: isMobile()
                                        ? "pointer"
                                        : "default",
                                    }}
                                  >
                                    <h5>
                                      {section.title}{" "}
                                      {isMobile() && (
                                        <span className="arrow-icon me-2">
                                          {activeAccordion === section.id
                                            ? "▲"
                                            : "▼"}
                                        </span>
                                      )}
                                    </h5>
                                  </div>
                                  <div
                                    className={`footer-contant ${
                                      isMobile()
                                        ? activeAccordion === section.id
                                          ? "open"
                                          : "closed"
                                        : "open"
                                    }`}
                                  >
                                    {section.links ? (
                                      <ul>
                                        {section.links.map(([text, path]) => (
                                          <li key={text}>
                                            <a
                                              onClick={() => router.push(path)}
                                              style={{ cursor: "pointer" }}
                                            >
                                              {text}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      section.content
                                    )}
                                  </div>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
      <div className="sub-footer">
        <Container>
          <Row>
            <Col xs="12">
              <div className="sub-footer-contain">
                <p>
                  <span>2025 </span>Copyright @rupeecom
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
};

export default FooterSection;
