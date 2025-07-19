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
import CategoryList from "./widgets/category-list";


interface HeaderProps {
  cartPopupPosition: string;
  display: string;
  category: boolean;
  layoutLogo: string;
  appLogo: string;

}

const Header: NextPage<HeaderProps> = ({ cartPopupPosition, display, category, layoutLogo, appLogo }) => {
  const { setLeftMenu, leftMenu } = useContext(MenuContext);
  const { menuResponsive, setMenuResponsive } = useContext(MenuContext);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const header = document.getElementById("stickyHeader");
      const search_bar = document.getElementById('searchbar-input');
      const menu_bar = document.getElementById('nav-menu');

      if (scrollTop >= 300) {
        header?.classList.add("sticky");
        //search_bar?.classList.add("d-xl-lg-none");
        // menu_bar?.classList.remove('d-xl-lg-none');

      } else {
        header?.classList.remove("sticky");
        //search_bar?.classList.remove("d-xl-lg-none");
        //menu_bar?.classList.add('d-xl-lg-none');
      }
    };





    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onOpenMobileSearch = () => { document.getElementById("searchbar-input")?.classList.add("open"); }
  const closeMobileSearch = () => { document.getElementById("searchbar-input")?.classList.remove("open"); };
  const toggleLeftMenu = () => { setLeftMenu(!leftMenu); document.body.style.overflow = "hidden"; };
  const toggleRightMenu = () => { setMenuResponsive(!menuResponsive); document.body.style.overflow = "hidden"; };

  return (
    <Fragment>
      <header id="stickyHeader">
        <div className="mobile-fix-option"></div>
        <div className="layout-header2">

          <Container>
            <Row>
              <Col md="12">
                <div className="main-menu-block">
                  <div className="header-left">
                    
                    <CategoryList category={category} />
                    <div className="logo-block">
                      <div className="brand-logo logo-sm-center">
                        <a href="/#">
                          <Media src={`${appLogo}`} className="app-logo" alt="logo" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="input-block searchbar-input" id="searchbar-input">
                     <div className="input-box ">
                      {/* <span className="close-mobilesearch" onClick={closeMobileSearch}>
                        <i className="fa fa-times"></i>
                      </span>  */}
                      <Search />
                    </div>
                  </div>
                  <div className="header-right d-lg-show " id="nav-menu">
                    <div className="icon-block d-xl-none" >
                      <ul>
                        <User />
                        <WishList />
                        <MobileSearch onOpen={onOpenMobileSearch} />
                        <MobileSetting />
                      </ul>
                    </div>
                     <ShoppingCart layout="layout2" />
                    <div className="sm-nav-block" onClick={toggleRightMenu}>
                      <span className="sm-nav-btn">
                        <i className="fa fa-bars"></i>
                      </span>
                    </div>
                    {/* <HorizaontalMenu /> */}
                   
                  </div>

                </div>
              </Col>
            </Row>
          </Container>

        </div>

        {/* Category and Navigation */}
        <div className="category-header-2">
          <div className="container">
            <Row>
              <Col >
                <div className="navbar-menu">
                  <div className="logo-block">
                    <div className="brand-logo logo-sm-center">
                      <a href="/#">
                        <Media src={`${appLogo}`} className="app-logo" alt="logo" />
                      </a>
                    </div>
                  </div>
                  {/* <div className="category-left"> */}
                  <Category category={category} />
                  <HorizaontalMenu />
                  <div className="icon-block">
                    <ul>
                      <MobileSearch onOpen={onOpenMobileSearch} />
                      <User />
                       <MobileSetting />
                      <WishList />
                      
                     
                    </ul>
                    <ShoppingCart layout="layout2" />
                  </div>
                  
                  {/* </div> */}
                  {/* <div className="category-right ">
                    <ContactUs spanClass="" />
                    <Gift />
                  </div> */}
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
