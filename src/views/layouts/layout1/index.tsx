import { NextPage } from "next";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { CartProvider } from "../../../helpers/cart/cart.provider";
import { FilterProvider } from "../../../helpers/filter/filter.provider";
import Footer from "../../Containers/Footer";
import HeaderContainer from "../../Containers/Header/header1";

import Loader from "@/common/Loader";
import '@/app/globalProvider';
import Announcement from "../widgets/announcement";

interface Props {
  children: ReactNode;
}

const Layout1: NextPage<Props> = ({ children }) => {
  const path = usePathname();
  const pathMatch = ["Layouts", "/"];
  useEffect(() => {
    document.documentElement.classList.remove(localStorage.getItem("color")|| "''");
    localStorage.setItem("color", "color-1");
    document.documentElement.classList.add(localStorage.getItem("color")|| "''");
  }, []);
  return (
    <Loader>
      <div>
        <CartProvider>
          <HeaderContainer category={false} cartPopupPosition="top" display="d-none" layoutLogo="layout-2" />
          {pathMatch.includes(path) && (
            
                <Announcement />
              
          )}
          <FilterProvider>{children}</FilterProvider>
          <Footer layoutLogo="layout-2" />
        </CartProvider>
      </div>
    </Loader>
  );
};

export default Layout1;
