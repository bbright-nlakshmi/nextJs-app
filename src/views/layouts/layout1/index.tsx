import { NextPage } from "next";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { CartProvider } from "../../../helpers/cart/cart.provider";
import { FilterProvider } from "../../../helpers/filter/filter.provider";
import Footer from "../../Containers/Footer";
import HeaderContainer from "../../Containers/Header/header1";

import Loader from "@/common/Loader";
import '@/app/globalProvider';
import Announcement from "../widgets/announcement";
import { API } from "@/app/services/api.service";
import { centralDataCollector } from "@/app/globalProvider";

interface Props {
  children: ReactNode;
}

const Layout1: NextPage<Props> = ({ children }) => {
  const path = usePathname();
  const pathMatch = ["Layouts", "/"];
   const [logoUrl, setLogoUrl] = useState<string>("");
  useEffect(() => {

    centralDataCollector.getData();
    centralDataCollector.scheduleGetData()
      // Fetch dynamic logo from API on mount
     
      const fetchLogo = async () => {
        try {
          const res = await API.getAppLogo();
          const logo = res?.appLogo;
          if (logo) {
            setLogoUrl(logo);
          } else {
            console.warn("Logo not found in response", res);
          }
        } catch (err) {
          console.error("Error fetching logo:", err);
        }
      };
    
      fetchLogo();
    document.documentElement.classList.remove(localStorage.getItem("color")|| "''");
    localStorage.setItem("color", "color-1");
    document.documentElement.classList.add(localStorage.getItem("color")|| "''");
  }, []);
  return (
    <Loader>
      <div>
        <CartProvider>
          <HeaderContainer category={false} cartPopupPosition="top" display="d-none" layoutLogo="layout-2" appLogo={logoUrl} />
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
