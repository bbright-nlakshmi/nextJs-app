"use client";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import LeftSidebarPage from "@/views/Products-Detail/leftSidebarPage";
import RelatedProducts from "@/views/Products-Detail/related products";
import Layout1 from "@/views/layouts/layout1";
import { NextPage } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { objCache, CategoryProducts, Product } from "@/app/globalProvider";
import { Row, Col } from "reactstrap";

const LeftSidebar: NextPage = () => {
  const pathname = usePathname();
  const symbolRegex = /[!@#\$%\^&\*\(\)_\+\{\}\[\]:;"'<>,.?/\\|`~\-=]/g;
  const [productData, setProductData] = useState<Product | null>(null);

  const [secondPart] = pathname.split("/").slice(2);

  useEffect(() => {
    const fetchedData = objCache.getProductById(secondPart);
    setProductData(fetchedData);
  }, [secondPart]);

  return (
    <Layout1>
      {/* <Breadcrumb title="left sidebar" parent="product" /> */}
      <section className="section-big-pt-space shopdetails-style-1-wrapper">
        <Row>
          <Col lg="12" xl="12">
            <LeftSidebarPage pathId={secondPart} />
          </Col>
        </Row>
      </section>
      {productData?.categoryID && (
        <RelatedProducts
          productId={secondPart}
          categoryId={productData.categoryID}
        />
      )}
    </Layout1>
  );
};

export default LeftSidebar;
