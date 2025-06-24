"use client";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import RelatedKits from "@/views/Products-Detail/Kit_Details/Related_Kits/related-kits";
import KitDetails from "@/views/Products-Detail/Kit_Details/kit-details";
import Layout1 from "@/views/layouts/layout1";
import { NextPage } from "next";
import { useSearchParams } from "next/navigation";

const ThumbnailLeft: NextPage = () => {
  const searchParams = useSearchParams();
  const kitId = searchParams.get("id");

  return (
    <div className="b-g-light">
      <Layout1>
        <Breadcrumb title="Thumbnail Left" parent="product" />
        <section className="section-big-pt-space bg-light">
          <KitDetails />
          {kitId && <RelatedKits kitId={kitId} />}
        </section>       
      </Layout1>
    </div>
  );
};

export default ThumbnailLeft;