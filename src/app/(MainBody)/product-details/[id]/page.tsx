"use client";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import LeftSidebarPage from "@/views/Products-Detail/leftSidebarPage";
import RelatedProducts from "@/views/Products-Detail/relatedproducts";
import Layout1 from "@/views/layouts/layout1";
import { NextPage } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { objCache, CategoryProducts, Product, centralDataCollector } from "@/app/globalProvider";
import { Row, Col } from "reactstrap";

const LeftSidebar: NextPage = () => {
  const pathname = usePathname();
  const symbolRegex = /[!@#\$%\^&\*\(\)_\+\{\}\[\]:;"'<>,.?/\\|`~\-=]/g;
  const [productData, setProductData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [secondPart] = pathname.split("/").slice(2);

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First, ensure data is loaded
        if (centralDataCollector.isInitialLoading) {
          await centralDataCollector.getData();
        }

        // Try to get product data
        let fetchedData = objCache.getProductById(secondPart);
        
        // If not found, try findProductById
        if (!fetchedData) {
          fetchedData = objCache.findProductById(secondPart);
        }

        // If still not found, wait a bit and try again
        if (!fetchedData) {
          await new Promise(resolve => setTimeout(resolve, 500));
          fetchedData = objCache.getProductById(secondPart) || objCache.findProductById(secondPart);
        }

        if (fetchedData) {
          setProductData(fetchedData);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error loading product data:", err);
        setError("Failed to load product data");
      } finally {
        setIsLoading(false);
      }
    };

    const handleDataLoaded = () => {
      if (!productData) {
        loadProductData();
      }
    };

    // Listen for data loaded event
    objCache.on("dataLoaded", handleDataLoaded);

    loadProductData();

    return () => {
      objCache.off("dataLoaded", handleDataLoaded);
    };
  }, [secondPart, productData]);

  // Loading state
  if (isLoading) {
    return (
      <Layout1>
        <section className="section-big-pt-space shopdetails-style-1-wrapper">
          <Row>
            <Col lg="12" xl="12">
              <div className="d-flex justify-content-center align-items-center product-details-container">
                {/* style={{ minHeight: '400px' }} */}
                <div className="text-center">
                  <div className="spinner-border mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Loading product details...</p>
                </div>
              </div>
            </Col>
          </Row>
        </section>
      </Layout1>
    );
  }

  // Error state
  if (error || !productData) {
    return (
      <Layout1>
        <section className="section-big-pt-space shopdetails-style-1-wrapper">
          <Row>
            <Col lg="12" xl="12">
              <div className="alert alert-danger text-center">
                <h4>Product Not Found</h4>
                <p>{error || "The requested product could not be found."}</p>
                <div className="d-flex gap-2 justify-content-center">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.reload()}
                  >
                    <i className="fa fa-refresh me-2"></i>Refresh
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => window.history.back()}
                  >
                    <i className="fa fa-arrow-left me-2"></i>Go Back
                  </button>
                </div>
              </div>
            </Col>
          </Row>
        </section>
      </Layout1>
    );
  }

  return (
    <Layout1>
      {/* <Breadcrumb title="left sidebar" parent="product" /> */}
      <section className="section-big-pt-space shopdetails-style-1-wrapper">
        <Row>
          <Col lg="12" xl="12">
            <LeftSidebarPage pathId={secondPart} productData={productData} />
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
