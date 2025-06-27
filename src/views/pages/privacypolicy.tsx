"use client";

import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import Breadcrumb from "../Containers/Breadcrumb";
import { PrivacyModel } from "../../app/models/privacy/privacy";
import { API } from "../../app/services/api.service";

const PrivacyPage: NextPage = () => {
  const [privacyItems, setPrivacyItems] = useState<PrivacyModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const data = await API.getPrivacyPolicy();
        setPrivacyItems(data);
      } catch (error) {
        console.error("Error loading privacy policy", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacy();
  }, []);

  return (
    <div className="bg-light">
      <Breadcrumb title="Privacy Policy" parent="home" />
      <section className="section-big-py-space">
        <Container>
          <Row>
            <Col sm="12">
              {loading ? (
                <p>Loading...</p>
              ) : privacyItems.length === 0 ? (
                <p>No Privacy Policy available.</p>
              ) : (
                privacyItems.map((item, index) => (
                  <div
                    key={index}
                    className="card-body bg-white p-3 mb-3 shadow-sm rounded"
                    dangerouslySetInnerHTML={{
                      __html: item.privacy ?? "No content available for this section.",
                    }}
                  />
                ))
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default PrivacyPage;

