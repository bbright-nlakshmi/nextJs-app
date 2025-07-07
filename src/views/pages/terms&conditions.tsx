"use client";

import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import Breadcrumb from "../Containers/Breadcrumb";
import { TermsAndConditions } from "../../app/models/terms_and_conditions/terms_and_conditions";
import { API } from "../../app/services/api.service";

const TermsPage: NextPage = () => {
  const [terms, setTerms] = useState<TermsAndConditions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const data = await API.getTermsAndConditions();

        if (Array.isArray(data)) {
          setTerms(data);
        } else {
          setTerms([]);
        }
      } catch (error) {
        console.error("Error loading terms and conditions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  return (
    <div className="bg-light">
      {/* Breadcrumb */}
      <Breadcrumb title="Terms & Conditions" parent="home" />

      <section className="section-big-py-space">
        <Container>
          <Row>
            <Col sm="12">
              {loading ? (
                <p>Loading...</p>
              ) : terms.length === 0 ? (
                <p>No Terms and Conditions available.</p>
              ) : (
                terms.map((term, index) => (
                  <div
                    key={index}
                    className="card-body bg-white p-3 mb-3 shadow-sm rounded"
                    dangerouslySetInnerHTML={{
                      __html:
                        term.termsAndConditions ??
                        "No content available for this section.",
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

export default TermsPage;
