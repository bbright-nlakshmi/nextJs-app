"use client";

import React, { useContext, useEffect, useState } from "react";
import { NextPage } from "next";
import { Media } from "reactstrap";
import { useTranslation } from "react-i18next";
import { MenuContext } from "@/helpers/menu/MenuContext";
import { Category, Category as ICategory, objCache } from "@/app/globalProvider";
import { centralDataCollector } from "@/app/services/central_data_control";
import { useRouter } from "next/navigation";

interface ByCategoryProps {
    category: boolean;
}

const CategoryList: NextPage<ByCategoryProps> = ({ category }) => {
    const [showState, setShowState] = useState(category || false);
    const { t } = useTranslation("common");
    const { leftMenu, setLeftMenu } = useContext(MenuContext);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const router = useRouter();
    useEffect(() => {

        setCategories(objCache.allCategories);

        objCache.on('updateAllCategories', (data: Category[]) => {

            setCategories(data);

        });
    }, []);

    const toggleLeftMenu = () => { setLeftMenu(!leftMenu); document.body.style.overflow = "hidden"; };

    return (
       <><div className="sm-nav-block  d-xl-none" onClick={toggleLeftMenu}>
                              <span className="sm-nav-btn">
                                <i className="fa fa-bars"></i>
                              </span>
                              
                            </div>
          <ul className={` nav-slide category-scroll ${leftMenu ? "openmenu" : ""}`} >
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
              <li key={cat.id} 
                  onClick={() => router.push(`/collections/no-sidebar?category=${encodeURIComponent(cat.name)}`)}
                style={{ cursor: "pointer" }}
              >                            
                  <span className="arrow-before">&gt;</span>
                  <span className="category-name">{cat.name}</span>                  
              </li>
            ))}
          </ul></> 

    );
};

export default CategoryList;
