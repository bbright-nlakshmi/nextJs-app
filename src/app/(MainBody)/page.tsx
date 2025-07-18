"use client";

import NewsLatter from "@/views/Containers/news-letter";
import Layouts from "@/views/layouts/layout1";
import CollectionBanner from "@/views/layouts/layout1/collection-banner";
import CollectionBannerThree from "@/views/layouts/layout1/collection-banner-three";
import CollectionBannerTwo from "@/views/layouts/layout1/collection-banner-two";
import HotDeal from "@/views/layouts/layout1/hot-deal";
import SliderBanner from "@/views/layouts/layout1/slider";
import TabProduct from "@/views/layouts/widgets/Tab-Product/TabProduct";
//import CategoryProducts from "@/views/layouts/widgets/category-box/category_products";
import ContactBanner from "@/views/layouts/widgets/contact-us";
import DealBanner from "@/views/layouts/widgets/dealBanner";
import DiscountBanner from "@/views/layouts/widgets/discount-banner";
import PriceRanges from "@/views/layouts/widgets/price_ranges";
import InstagramSection from "@/views/layouts/widgets/instagram/instagram1";
import RatioSquare from "@/views/layouts/widgets/ratio-square";
import Category_View from "@/views/layouts/widgets/roundedCategory";
import Testimonial from "@/views/layouts/widgets/testimonial";
import SpecialProduct from "@/views/layouts/widgets/title-section";
import DiscountProducts from "@/views/layouts/layout1/discounts";

import { useEffect, useState } from "react";
import { BannerModel, Category,  Discount, Kit,  Product, StorePriceRanges, ObjCache, objCache } from "../globalProvider";

import Kits from "@/views/Kits/kits_list";
import RecentlyAddedProducts from "@/views/Products-Detail/Recently-added/recently-added-products";




//const centralDataCollectorObj: CentralDataCollector = centralDataCollector;

const Home = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [allCategories, setAllCategories] = useState<Array<Category>>();
  const [categoryProducts, setcategoryProducts] = useState<Array<Product>>([]);
  const [banners, setBanners] = useState<Array<BannerModel>>();
  const [priceRanges, setPriceRanges] = useState<StorePriceRanges>(StorePriceRanges.emptyPriceRanges());
  useEffect(() => {
    
    // Subscribe to the Subject
    objCache.on('update', () => {
      
      setKits(objCache.kitList);
      setProducts(objCache.discountList);
      setBanners(objCache.allBannersList);
      setCategories(objCache.categories);
      setAllCategories(objCache.allCategories);
      setcategoryProducts(objCache.allProducstsList);
      setPriceRanges(objCache.priceRanges);

    })
    
    objCache.on('UpdatePriceRanges',(priceRanges: StorePriceRanges) => {
      setPriceRanges(priceRanges)
    })
  }, []);

  return (
    <>
      {/* <NewsLatter /> */}
      <Layouts>
       
          <SliderBanner banners={banners} />
          <CollectionBanner categories={categories} categoryProducts={categoryProducts}/>
          <TabProduct effect="icon-inline" categories={allCategories} />
          {/* <CategoryProducts effect="icon-inline" categories={allCategories} /> */}
          {/* <DiscountBanner /> */}

          {/* <CollectionBannerTwo /> */}
          <DiscountProducts products={products} />

          <RecentlyAddedProducts/>

          <Kits kits={kits} />

          {/* <DiscountBanner /> */}

          {/* <CollectionBannerTwo />
            <section className="deal-banner">
              <DealBanner />
            </section>
            <section className="rounded-category">
              <Category_View />
            </section> */}
          <section className="box-category section-py-space" >
            <PriceRanges priceRanges={priceRanges} />
          </section>
          {/* <RatioSquare />
            <CollectionBannerThree />
            <HotDeal />
            <section className="testimonial testimonial-inverse">
              <Testimonial />
            </section>
            <SpecialProduct hoverEffect="icon-inline" />
            <section className="instagram">
              <InstagramSection />
            </section>
            <ContactBanner /> */}
      
      </Layouts>
    </>
  );
};

export default Home;
