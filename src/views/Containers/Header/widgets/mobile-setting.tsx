import React, { useContext, useState } from "react";
import { CurrencyContext } from "../../../../helpers/currency/CurrencyContext";
import { useTranslation } from "react-i18next";
import dataa from "../../../../data/langConfig.json";

const MobileSetting: React.FC = () => {
  const { i18n } = useTranslation();
  const data = { currency: [] };
  const currencyContext = useContext(CurrencyContext);
  const { selectedCurrency } = currencyContext;
  const [open, setOpen] = useState(false);

  // 🔹 Dark/Light toggle state
  const [layoutMode, setLayoutMode] = useState("Light");

  const changeLanguage = (lang: { val: string | undefined }) => {
    i18n.changeLanguage(lang.val);
    setOpen(false);
  };

  const changeDark = () => {
    if (document.body?.classList.contains("light")) {
      document.body.classList.add("dark");
      setLayoutMode("Dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      setLayoutMode("Light");
      document.body.classList.remove("dark");
    }
  };

  return (
    <>
      {/* Settings Icon in Header */}
      <li
        className="mobile-setting"
        onClick={() => {
          setOpen(true);
        }}
      >
        <a href="#">
          <i className="icon-settings"></i>
        </a>
      </li>

      {/* Settings Panel */}
      <div id="mySetting" className={`add_to_cart right ${open ? "open-side" : ""}`}>
        <a
          href="#"
          className="overlay"
          onClick={() => {
            setOpen(false);
          }}
        ></a>
        <div className="cart-inner">
          <div className="cart_top">
            <h3>My Setting</h3>
            <div className="close-cart">
              <a
                href="#"
                onClick={() => {
                  setOpen(false);
                }}
              >
                <i className="fa fa-times" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          <div className="setting-block">
            {/* 🔹 Dark/Light Toggle */}
            <div className="dark-light-toggle">
              <h5>Theme</h5>
              <button
                className={`btn ${layoutMode === "Light" ? "btn-dark" : "btn-light"}`}
                onClick={changeDark}
              >
                {layoutMode === "Light" ? "Switch to Dark" : "Switch to Light"}
              </button>
            </div>

            {/* (Optional) Language & Currency */}
            {/* <div>
              <h5>Language</h5>
              <ul>
                {dataa.map((lang: any, i) => (
                  <li key={i}>
                    <a
                      href="#"
                      onClick={() => {
                        changeLanguage(lang);
                      }}
                    >
                      {lang.lang}
                    </a>
                  </li>
                ))}
              </ul>
              <h5>Currency</h5>
              <ul>
                {data.currency.map((cur: { symbol: string; currency: string }, i: number) => (
                  <li key={i}>
                    <div
                      onClick={() => {
                        selectedCurrency(cur);
                        setOpen(false);
                      }}
                    >
                      {cur.symbol} {cur.currency}
                    </div>
                  </li>
                ))}
              </ul>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSetting;
