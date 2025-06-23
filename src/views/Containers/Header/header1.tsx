import React, { Fragment, useContext, useEffect, useState } from "react";
import { Container, Row, Col, Media } from "reactstrap";
import TopBar from "./widgets/TopBar";
import Search from "./widgets/search";
import ShoppingCart from "./widgets/shopping-cart";
import Category from "./widgets/by-category";
import User from "./widgets/user-profile";
import WishList from "./widgets/whishlist";
import ContactUs from "./widgets/contact-us";
import Gift from "./widgets/gift";
import { NextPage } from "next";
import HorizaontalMenu from "../Menu/horizontal";
import MobileSearch from "./widgets/mobile-search";
import MobileSetting from "./widgets/mobile-setting";
import { MenuContext } from "@/helpers/menu/MenuContext";
import { API } from "@/app/services/api.service";

interface HeaderProps {
  cartPopupPosition: string;
  display: string;
  category: boolean;
  layoutLogo: string;
  appLogo: string;

}

const Header: NextPage<HeaderProps> = ({ cartPopupPosition, display, category, layoutLogo }) => {
  const { setLeftMenu, leftMenu } = useContext(MenuContext);
  const [logoUrl, setLogoUrl] = useState<string>("");

  // Handle sticky header on scroll
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const header = document.getElementById("stickyHeader");

    if (scrollTop >= 300) {
      window.innerWidth < 581
        ? header?.classList.remove("sticky")
        : header?.classList.add("sticky");
    } else {
      header?.classList.remove("sticky");
    }
  };

  // Fetch dynamic logo from API on mount
  useEffect(() => {
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
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);


  return (
    <Fragment>
      <header id="stickyHeader">
        <div className="mobile-fix-option"></div>
        {/* <TopBar /> */}
        <div className="layout-header2">
          <Container>
            <Row>
              <Col md="12">
                <div className="main-menu-block">
                  <div className="header-left">
                    <div onClick={() => { setLeftMenu(!leftMenu); document.body.style.overflow = "hidden"; }}
                      className="sm-nav-block" >
                      <span className="sm-nav-btn">
                        <i className="fa fa-bars"></i>
                      </span>
                    </div>

                    <div className="logo-block">
                      <a href="/#">
                        <Media src={`/images/${layoutLogo}/logo/logo.png`} className="img-fluid" alt="logo" />
                      </a>
                    </div>
                  </div>
                  <div className="input-block">
                    <div className="input-box">
                      <Search />
                    </div>
                  </div>
                  <ShoppingCart position={cartPopupPosition} cartDisplay={display} layout="layout2" />
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        {/* Category and Navigation */}
        <div className="category-header-2">
          <div className="custom-container">
            <Row>
              <Col>
                <div className="navbar-menu">
                  <div className="category-left">
                    <Category category={category} />
                    <HorizaontalMenu />
                    <div className="icon-block">
                      <ul>
                        <User />
                        <WishList />
                        <MobileSearch />
                        <MobileSetting />
                      </ul>
                    </div>
                  </div>
                  <div className="category-right">
                    <ContactUs spanClass="" />
                    <Gift />
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </header>
    </Fragment>
  );
};

export default Header;
