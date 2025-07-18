import { gql, useQuery } from "@apollo/client";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Dropdown, DropdownToggle, Row } from "reactstrap";
import dataa from "@/data/langConfig.json";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { useRouter } from "next/navigation";


const TopBar: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { i18n } = useTranslation();
  const [openLang, setOpenLang] = useState(false);
  const [openUsd, setOpenUsd] = useState(false);
  const data = { currency: [] } ;
  const currencyContext = useContext(CurrencyContext);
  const { selectedCurrency, selectedCurr } = currencyContext;
  const [lang, setSelectedLang] = useState<{ lang: string, val: string }| undefined>({ lang: "English", val: "en" });
  const [url, setUrl] = useState("");
  const currentLanguage = i18n.resolvedLanguage;
  const changeLanguage = (lang: any) => {
    i18n.changeLanguage(lang.val);
    setSelectedLang(lang);
    lang.val === "es" ? document.body.classList.add(lang.val) : document.body.classList.remove("es");
  };
  useEffect(() => {
    const defaultLanguage = dataa.find((data) => data.val == currentLanguage);
    setSelectedLang(defaultLanguage);
    router.refresh();
  }, [currentLanguage, router]);
  const toggleCurrency = () => {
    setOpenUsd(!openUsd);
  };

  const toggleLang = () => {
    setOpenLang(!openLang);
  };
  useEffect(() => {
    const path = window.location.pathname.split("/");
    const urlTemp = path[path.length - 1];
    setUrl(urlTemp);
  }, []);

  return (
    <div className={`top-header ${url === "layout6" ? "top-header-inverse" : ""}`}>
      <div className="custom-container">
        <Row>
          <Col xl="5" md="7" sm="6">
            <div className="top-header-left">
              <div className="shpping-order">
                <h6>{t("free shipping on order over $99")} </h6>
              </div>
              <div className="app-link">
                <h6>{t("Download app")}</h6>
                <ul>
                  <li>
                    <a>
                      <i className="fa fa-apple"></i>
                    </a>
                  </li>
                  <li>
                    <a>
                      <i className="fa fa-android"></i>
                    </a>
                  </li>
                  <li>
                    <a>
                      <i className="fa fa-windows"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Col>
          <Col xl="7" md="5" sm="6">
            <div className="top-header-right">
              <div className="top-menu-block">
                <ul>
                  <li>
                    <a href="#">gift cards</a>
                  </li>
                  <li>
                    <a href="#">Notifications</a>
                  </li>
                  <li>
                    <a href="#">help & contact</a>
                  </li>
                  <li>
                    <a href="#">todays deal</a>
                  </li>
                  <li>
                    <a href="#">track order</a>
                  </li>
                  <li>
                    <a href="#">shipping </a>
                  </li>
                  <li>
                    <a href="#">easy returns</a>
                  </li>
                </ul>
              </div>
              <div className="language-block">
                <div className="language-dropdown">
                  <Dropdown isOpen={openLang} toggle={toggleLang}>
                    <DropdownToggle tag="span" data-toggle="dropdown" aria-expanded={openLang} className="language-dropdown-click">
                      {lang?.lang}
                      <i className="fa fa-angle-down" aria-hidden="true"></i>
                    </DropdownToggle>
                    <ul className={`language-dropdown-open ${openLang ? "" : "open"}`}>
                      {dataa.map((lang: any, i) => (
                        <li key={i}>
                          <a
                            href="#"
                            onClick={() => {
                              changeLanguage(lang);
                              toggleLang();
                            }}
                          >
                            {lang.lang}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Dropdown>
                </div>
                <div className="curroncy-dropdown">
                  <Dropdown isOpen={openUsd} toggle={toggleCurrency}>
                    <DropdownToggle tag="span" data-toggle="dropdown" aria-expanded={openUsd} className="curroncy-dropdown-click">
                      {selectedCurr.currency}
                      <i className="fa fa-angle-down" aria-hidden="true"></i>
                    </DropdownToggle>
                    <ul className={`curroncy-dropdown-open ${openUsd ? "" : "open"}`}>
                      {data.currency.map((cur: any, i: number) => (
                        <li key={i}>
                          <div
                            onClick={() => {
                              selectedCurrency(cur);
                              toggleCurrency();
                            }}
                          >
                            <div>{cur.symbol}</div>
                            <div> {cur.currency}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Dropdown>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};
export default TopBar;
