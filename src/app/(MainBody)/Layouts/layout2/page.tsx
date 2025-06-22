"use client";
import NewsLatter from "@/views/Containers/news-letter";
import Layout2Section from "@/views/layouts/layout2";
import BannerSection from "@/views/layouts/layout2/Banner";
import BlogSection from "@/views/layouts/layout2/Blog";
import CollectionBanner from "@/views/layouts/layout2/CollectionBanner";
import MediaSection from "@/views/layouts/layout2/Media";
import MediaBanner from "@/views/layouts/layout2/Media-Banner";
import SilderSection from "@/views/layouts/layout2/Silder";
import TabProduct from "@/views/layouts/widgets/Tab-Product/TabProduct";
import TopBrand from "@/views/layouts/widgets/TopBrand";
import ContactBanner from "@/views/layouts/widgets/contact-us";
import DealBanner from "@/views/layouts/widgets/dealBanner";
import DiscountBanner from "@/views/layouts/widgets/discount-banner";
import DiscountCoupon from "@/views/layouts/widgets/price_ranges";
import InstagramSection from "@/views/layouts/widgets/instagram/Instagram2";
import Category from "@/views/layouts/widgets/roundedCategory";
import Services from "@/views/layouts/widgets/services";
import ProductBox1 from "@/views/layouts/widgets/slider-product/slider-product1";
import Testimonial from "@/views/layouts/widgets/testimonial";
import { useEffect } from "react";

const Layout2 = () => {
  useEffect(() => {
    document.documentElement.classList.remove(localStorage.getItem("color")|| "''");
    localStorage.setItem("color", "color-2");
    document.documentElement.classList.add(localStorage.getItem("color")|| "''");
  }, []);

  return (
    <>
      <NewsLatter />
      <Layout2Section>
        <SilderSection />
        <BannerSection />
        <section className="brand-panel section-pt-space">
          <div className="brand-panel-box">
            <TopBrand />
          </div>
        </section>
        <section className="services">
          <Services />
        </section>
        <MediaSection />
        <DiscountBanner />
        <CollectionBanner />
        <TabProduct effect="icon-inline" />
        <section className="deal-banner">
          <DealBanner />
        </section>
        <section className="rounded-category">
          <Category />
        </section>
        <MediaBanner />
        <BlogSection />
        <section className="box-category section-py-space">
          <DiscountCoupon />
        </section>
        <div className="title1 section-my-space">
          <h4>Special Products</h4>
        </div>
        <ProductBox1 hoverEffect="icon-inline" />
        <section className="testimonial testimonial-inverse">
          <Testimonial />
        </section>
        <section className="instagram">
          <InstagramSection />
        </section>
        <ContactBanner />
      </Layout2Section>
    </>
  );
};

export default Layout2;
