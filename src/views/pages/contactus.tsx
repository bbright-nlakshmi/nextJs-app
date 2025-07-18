"use client";

import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import Breadcrumb from "../Containers/Breadcrumb";
import { API } from "../../app/services/api.service";
import { BusinessDetails } from "@/app/globalProvider";
import { useRouter } from "next/navigation";

const ContactUsPage: NextPage = () => {
  const [details, setDetails] = useState<BusinessDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const data = await API.getBusinessDetails();
        setDetails(data);
      } catch (error) {
        console.error("Error loading business details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, []);

  const openInstagram = (url: string) => {
    // Opens in same tab (client navigation)
    router.push(url);
  };

  return (
    <div className="bg-light">
      {/* Breadcrumb */}
      <Breadcrumb title="Contact Us" parent="home" />

      <section className="section-big-py-space">
        <Container>
          <Row>
            <Col sm="12">
              {loading ? (
                <p>Loading...</p>
              ) : !details ? (
                <p>Business details not available.</p>
              ) : (
                <div className="card-body bg-white p-4 mb-3 shadow-sm rounded">
                  <h4 className="mb-3">Get in Touch</h4>

                  {details.phone && (
                    <p>
                      <strong>Phone:</strong> {details.phone}
                    </p>
                  )}

                  {details.email && (
                    <p>
                      <strong>Email:</strong> {details.email}
                    </p>
                  )}

                  {details.address && (
                    <p>
                      <strong>Address:</strong> {details.address}
                    </p>
                  )}

                  {details.instagram && (
                    <p>
                      <strong>Instagram:</strong>{" "}
                      <span
                        className="text-primary"
                        style={{ cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => openInstagram(details.instagram!)}
                      >
                        {details.instagram}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default ContactUsPage;
