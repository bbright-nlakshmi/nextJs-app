"use client";

import React, { useEffect, useState } from "react";
import { Col, Row, Media } from "reactstrap";
import { Kit, objCache } from "@/app/globalProvider";
import Slider from "react-slick";
import Link from "next/link";

interface RelatedKitsProps {
  kitId: string;
}

const sliderSettings = {
  arrows: false,
  dots: false,
  infinite: false,
  speed: 300,
  slidesToShow: 4,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
      },
    },
  ],
};

const RelatedKits: React.FC<RelatedKitsProps> = ({ kitId }) => {
  const [relatedKits, setRelatedKits] = useState<Kit[]>([]);

  useEffect(() => {
    const kits = objCache.getOtherKitsExcept(kitId);
    setRelatedKits(kits);
  }, [kitId]);

  if (!relatedKits.length) return null;

  return (
    <section className="section-big-pt-space ratio_asos bg-light">
      <div className="custom-container">
        <Row>
          <Col className="product-related">
            <h2>Related Kits</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <Slider {...sliderSettings}>
              {relatedKits.map((kit) => (
                <div key={kit.id}>
                  <Link
                    href={{
                      pathname: "/product-details/thumbnail-left",
                      query: { id: kit.id },
                    }}
                    className="product-box"
                  >
                    <div className="img-wrapper">
                      <Media src={kit.img[0]} className="img-fluid" alt={kit.name} />
                      <div className="product-detail text-center mt-2">
                        <h6>{kit.name}</h6>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </Slider>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default RelatedKits;
