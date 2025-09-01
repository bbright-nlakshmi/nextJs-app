"use client";
import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { Input, Label, Row, Col, Form, FormGroup } from "reactstrap";
import Breadcrumb from "../Containers/Breadcrumb";
import { API } from "../../app/services/api.service";
import { StoreBaseDetails, LatLng } from "@/app/globalProvider";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const ContactUsPage: NextPage = () => {
  const [details, setDetails] = useState<StoreBaseDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [storeCoords, setStoreCoords] = useState<LatLng | null>(null);

  const router = useRouter();

  const [data, setData] = useState({
    name: "",
    phone_number: "",
    message: "",
  });
  useEffect(() => {
    const fetchBusinessDetailsAndLocation = async () => {
      try {
        // Fetch all store details
        const storesMap = await API.getStoresBaseDetails();

        // Pick the first store (or change logic if you need a specific one)
        const firstStore = storesMap.values().next().value as
          | StoreBaseDetails
          | undefined;

        if (firstStore) {
          setDetails(firstStore);

          if (
            firstStore.storeLocation &&
            firstStore.storeLocation.lat &&
            firstStore.storeLocation.lng
          ) {
            setStoreCoords({
              lat: firstStore.storeLocation.lat,
              lng: firstStore.storeLocation.lng,
            });
          }
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
  const handleInputChange = (field: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save profile data
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();

    // setTimeout(() => {
      try {
        API.saveContactInfo(data);
        setData({
          name: "",
          phone_number: "",
          message: "",
        });
        toast.success("Contact information saved successfully!");
      } catch (error) {
        console.error("Error saving profile:", error);
      }
    // }, 1000);
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
                    {details.phoneNumber && (
                      <Col md="6" className="mb-3">
                        <strong>Phone:</strong>
                        <p className="mb-0">{details.phoneNumber}</p>
                        
                      </Col>
                    )}
                    {details.address && (
                      <Col md="12" className="mb-3">
                        <strong>Address:</strong>
                        <p className="mb-0">{details.address}</p>
                      </Col>
                    )}
                    {details.name && (
                      <Col md="12" className="mb-3">
                        <strong>Store:</strong>
                        <p className="mb-0">{details.name}</p>
                      </Col>
                    )}
                  </div>
                )}
              </div>
              <div className="theme-card mt--30">
                {storeCoords ? (
                  <iframe
                    src={`https://www.google.com/maps?q=${storeCoords.lat},${storeCoords.lng}&z=15&output=embed`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="contact-map"
                  />
                ) : (
                  <p>Loading map...</p>
                )}
              </div>
            </Col>

            <Col xl="6">
              <Form className="theme-form" onSubmit={handleSaveContact}>
                <div className="form-row row">
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        type="text"
                        className="form-control"
                        id="name"
                        placeholder="Enter Your name"
                        value={data.name}
                        onChange={(e: { target: { value: string } }) =>
                          handleInputChange("name", e.target.value)
                        }
                        required
                      />
                    </FormGroup>
                  </Col>

                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="phone_number">Phone number</Label>
                      <Input
                        type="tel"
                        className="form-control"
                        id="phone_number"
                        placeholder="Enter your number"
                        value={data.phone_number}
                        onChange={(e: { target: { value: string } }) =>
                          handleInputChange("phone_number", e.target.value)
                        }
                        required
                      />
                    </FormGroup>
                  </Col>

                  <Col className="col-md-12">
                    <FormGroup>
                      <Label htmlFor="message">Message</Label>
                      <textarea
                        className="form-control mb-0"
                        placeholder="Write Your Message"
                        id="message"
                        value={data.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        rows={4}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="12">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-normal mb-lg-5"
                        type="submit"
                        onClick={handleSaveContact}
                      >
                        Submit
                      </button>
                    </div>
                  </Col>
                </div>
              </Form>
            </Col>
          </Row>
        </div>
      </section>
    </>
  );
};

export default ContactUsPage;
