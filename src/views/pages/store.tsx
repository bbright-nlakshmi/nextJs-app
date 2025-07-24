import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Media, Row, Col, Container } from "reactstrap";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import { API } from "../../app/services/api.service"; // Update this import path

// Define interfaces for type safety
interface BusinessDetails {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  // Add other properties as needed based on your BusinessDetails model
}

const StorePage: NextPage = () => {
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        const details = await API.getBusinessDetails();
        setBusinessDetails(details);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching business details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, []);

  if (loading) {
    return (
      <div className="bg-light">
        <Breadcrumb title="Store" parent="home" />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-light">
        <Breadcrumb title="Store" parent="home" />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="alert alert-danger" role="alert">
            Error loading store data: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light">
      <Breadcrumb title="Store" parent="home" />
      
      {/* Store Details section */}
      {businessDetails && (
        <section className="store-details section-big-py-space">
          <Container>
            <Row>
              <Col sm="12">
                <h2>Store Location & Contact</h2>
                <div className="store-info p-4 border rounded shadow-sm">
                  <h3 className="mb-3">{businessDetails.name}</h3>
                  
                  {businessDetails.address && (
                    <div className="mb-2">
                      <strong>Address: </strong>
                      <span>{businessDetails.address}</span>
                    </div>
                  )}
                  {businessDetails.phone && (
                    <div className="mb-2">
                      <strong>Phone: </strong>
                      <span>{businessDetails.phone}</span>
                    </div>
                  )}
                  {businessDetails.email && (
                    <div className="mb-2">
                      <strong>Email: </strong>
                      <span>{businessDetails.email}</span>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      
    </div>
  );
};

export default StorePage;