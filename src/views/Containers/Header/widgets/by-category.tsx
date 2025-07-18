"use client";

import React, { useContext, useEffect, useState } from "react";
import { NextPage } from "next";
import { Media } from "reactstrap";
import { useTranslation } from "react-i18next";
import { MenuContext } from "@/helpers/menu/MenuContext";
import { Category, Category as ICategory, objCache } from "@/app/globalProvider";
import { centralDataCollector } from "@/app/services/central_data_control";

interface ByCategoryProps {
  category: boolean;
}

const ByCategory: NextPage<ByCategoryProps> = ({ category }) => {
  const [showState, setShowState] = useState(category || false);
  const { t } = useTranslation("common");
  const { leftMenu, setLeftMenu } = useContext(MenuContext);
  const [categories, setCategories] = useState<ICategory[]>([]);

  useEffect(() => {

     setCategories(objCache.allCategories);
    
    objCache.on('updateAllCategories',(data: Category[]) => {
          
              setCategories(data);
          
            });
  }, []);

  return (
    <div className="nav-block" onClick={() => setShowState(!showState)}>
      <div className={`nav-left ${leftMenu ? "openmenu" : ""}`}>
        <nav
          className="navbar"
          data-toggle="collapse"
          data-target="#navbarToggleExternalContent"
        >
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setShowState(!showState)}
          >
            <span className="navbar-icon">
              <i className="fa fa-arrow-down"></i>
            </span>
          </button>
          <h5 className="mb-0 text-white title-font">{t("shopByCategory")}</h5>
        </nav>

        <div
          className={`collapse nav-desk ${showState ? "show" : ""}`}
          id="navbarToggleExternalContent"
        >
          <a
            href="#"
            onClick={() => {
              setLeftMenu(!leftMenu);
              document.body.style.overflow = "visible";
            }}
            className={`overlay-cat ${leftMenu ? "showoverlay" : ""}`}
          ></a>

          <ul className={`nav-cat title-font nav-slide category-scroll ${leftMenu ? "openmenu" : ""}`}>
            <li className="nav-heading">
              <h4>All Categories</h4>
            </li>
            <li
              className="back-btn"
              onClick={() => {
                setLeftMenu(!leftMenu);
                document.body.style.overflow = "visible";
              }}
            >
              <a>
                <i className="fa fa-angle-left"></i>Back
              </a>
            </li>

            {categories.map((cat) => (
              <li key={cat.id}>
                <a href={`/collections/no-sidebar?category=${encodeURIComponent(cat.name)}`}>
                  {/* <Media src={cat.img[0]} className="img-fluid" alt={cat.name} />? */}
                  <span className="arrow-before">&gt;</span>
                  <span className="category-name">{cat.name}</span>
                  {/* <span className="arrow-before">{">"}{cat.name}</span> */}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ByCategory;
