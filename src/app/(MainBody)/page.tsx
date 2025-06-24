"use client";

import NewsLatter from "@/views/Containers/news-letter";
import Layouts from "@/views/layouts/layout1";
import CollectionBanner from "@/views/layouts/layout1/collection-banner";
import CollectionBannerThree from "@/views/layouts/layout1/collection-banner-three";
import CollectionBannerTwo from "@/views/layouts/layout1/collection-banner-two";
import HotDeal from "@/views/layouts/layout1/hot-deal";
import SliderBanner from "@/views/layouts/layout1/slider";
import TabProduct from "@/views/layouts/widgets/Tab-Product/TabProduct";
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
import { centralDataCollector, CentralDataCollector } from '@/app/services/central_data_control';
import { useEffect, useState } from "react";
import { BannerModel, Category, Discount, Kit, ObjCache, StorePriceRanges, objCache } from "../globalProvider";
import { Subscription } from 'rxjs';
import Kits from "@/views/Kits/kits_list";


const centralDataCollectorObj: CentralDataCollector = centralDataCollector;

const Home = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Array<Category>>();
  const [allCategories, setAllCategories] = useState<Array<Category>>();
  const [banners, setBanners] = useState<Array<BannerModel>>();
  const [priceRanges, setPriceRanges] = useState<StorePriceRanges>();
useEffect(() => {
  // Subscribe to the Subject

  objCache.on('updateKits',(kit_data) => {
    console.log(kit_data)
    setKits(kit_data);
  });
  
  objCache.on('updateDiscountProducts',(data) => {
    
    setProducts(data);
  });

  objCache.on('updateBanners', (newBanners) => {
    console.log(newBanners)
    setBanners(newBanners);
  });

  objCache.on('updateCategories',(data: Category[]) => {

    setCategories(data);

  });

  objCache.on('updateAllBanners',banners => {
    setBanners(banners);
  })
  objCache.on('updateAllCategories', (data: Category[]) => {

    setAllCategories(data);

  });
  objCache.on('UpdatePriceRanges',(priceRanges: StorePriceRanges) => {
    setPriceRanges(priceRanges)
  })

return () => {
    };
  }, []);

  useEffect(() => {

    centralDataCollectorObj.getData();
    centralDataCollectorObj.scheduleGetData()
  }, []);



  return (
    <>
      {/* <NewsLatter /> */}
      <Layouts>
        <div className="bg-light">
          <SliderBanner banners={banners} />
          <CollectionBanner categories={categories} />
          <TabProduct effect="icon-inline" categories={allCategories} />
          <DiscountBanner />

          {/* <CollectionBannerTwo /> */}
          <DiscountProducts products={products} />

          <Kits kits = {kits}/>

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
        </div>
      </Layouts>
    </>
  );
};

export default Home;
