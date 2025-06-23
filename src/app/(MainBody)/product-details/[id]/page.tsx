"use client";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import LeftSidebarPage from "@/views/Products-Detail/leftSidebarPage";
import RelatedProducts from "@/views/Products-Detail/related products";
import Layout1 from "@/views/layouts/layout1";
import { NextPage } from "next";
import { usePathname } from "next/navigation";

const LeftSidebar: NextPage = () => {
  const pathname = usePathname();
  const symbolRegex = /[!@#\$%\^&\*\(\)_\+\{\}\[\]:;"'<>,.?/\\|`~\-=]/g;

  const [secondPart] = pathname
    .split("/")
    .slice(2)
    .map((item) => item.replace(symbolRegex, ""));
  console.log("📦 Final cleaned productId:", secondPart);
  return (
    <Layout1>
      <Breadcrumb title="left sidebar" parent="product" />
      <section className="section-big-pt-space bg-light">
        <LeftSidebarPage pathId={secondPart} />
      </section>
      <RelatedProducts productId={secondPart} />
    </Layout1>
  );
};

export default LeftSidebar;
