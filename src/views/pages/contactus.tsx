"use client";
import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { Row, Col } from "reactstrap";
import Breadcrumb from "../Containers/Breadcrumb";
import { API } from "../../app/services/api.service";
import { BusinessDetails, LatLng } from "@/app/globalProvider";
import { useRouter } from "next/navigation";

const ContactUsPage: NextPage = () => {
  const [details, setDetails] = useState<BusinessDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [storeCoords, setStoreCoords] = useState<LatLng | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchBusinessDetailsAndLocation = async () => {
      try {
        const data = await API.getBusinessDetails();
        setDetails(data);

        // Replace this with actual delivery location (dummy values shown here)
        const deliveryLocation = {
          latitude: 12.9716,
          longitude: 77.5946,
        };

        const storeLocation = {
          latitude: 0,
          longitude: 0,
        };
      console.log("storeLocation:", storeLocation);
      console.log("deliveryLocation:", deliveryLocation);

      const result = await API.getDistanceFromOlaMaps(storeLocation, deliveryLocation);

        // Parse the store location from Ola Maps API response
        if (result?.origin) {
          const [latStr, lngStr] = result.origin.split(",");
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);

        // ✅ Console logs
          console.log("Store Latitude:", lat);
          console.log("Store Longitude:", lng);

          setStoreCoords({ lat, lng });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetailsAndLocation();
  }, []);

  const openInstagram = (url: string) => {
    router.push(url);
  };

  return (
    <>
      <Breadcrumb title="Contact Us" parent="home" />

      <section className="contact-page section-big-py-space bg-light">
        <div className="custom-container">
          <h3 className="text-center mb-3">Get in touch</h3>
          <Row className="section-big-pb-space g-4">
            <Col xl="6">
              <div className="theme-card p-4 bg-white shadow-sm rounded">
                {loading ? (
                  <p>Loading...</p>
                ) : !details ? (
                  <p>Business details not available.</p>
                ) : (
                  <div className="form-row row">
                    {details.phone && (
                      <Col md="6" className="mb-3">
                        <strong>Phone:</strong>
                        <p className="mb-0">{details.phone}</p>
                      </Col>
                    )}
                    {details.email && (
                      <Col md="6" className="mb-3">
                        <strong>Email:</strong>
                        <p className="mb-0">{details.email}</p>
                      </Col>
                    )}
                    {details.address && (
                      <Col md="12" className="mb-3">
                        <strong>Address:</strong>
                        <p className="mb-0">{details.address}</p>
                      </Col>
                    )}
                    {details.instagram && (
                      <Col md="12">
                        <strong>Instagram:</strong>{" "}
                        <p
                          className="text-primary mb-0"
                          style={{ cursor: "pointer", textDecoration: "underline" }}
                          onClick={() => openInstagram(details.instagram!)}
                        >
                          {details.instagram}
                        </p>
                      </Col>
                    )}
                  </div>
                )}
              </div>
            </Col>

            <Col xl="6" className="map">
              <div className="theme-card">
                {/* {storeCoords ? ( */}
                  <iframe
                    // src={`https://www.google.com/maps?q=${storeCoords.lat},${storeCoords.lng}&z=15&output=embed`}
                    src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1605.811957341231!2d25.45976406005396!3d36.3940974010114!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1550912388321"
                    allowFullScreen
                    // loading="lazy"
                    // referrerPolicy="no-referrer-when-downgrade"
                    // style={{ width: "100%", height: "400px", border: 0 }}
                  ></iframe>
                {/* ) : ( */}
                  {/* <p>Loading map...</p> */}
                {/* )} */}
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </>
  );
};

export default ContactUsPage;
