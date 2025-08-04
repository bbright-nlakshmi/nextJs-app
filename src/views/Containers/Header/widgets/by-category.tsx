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

const ByCategory: NextPage<ByCategoryProps> = ({ category }) => {
  const [showState, setShowState] = useState(category || false);
  const { t } = useTranslation("common");
  const { leftMenu, setLeftMenu } = useContext(MenuContext);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch all products when component mounts
    const fetchAllProducts = async () => {
      try {
        const productsMap = await objCache.getAllProducts();
        
        // Update categories with products data
        const updatedCategories = objCache.allCategories.map(category => {
          const categoryProducts = productsMap.get(category) || [];
          return {
            ...category,
            category_products: categoryProducts
          };
        });
        
        setCategories(updatedCategories);
      } catch (error) {
        
      }
    };

    // Set initial categories
    setCategories(objCache.allCategories);
    
    // Listen for category updates
    objCache.on('updateAllCategories', (data: Category[]) => {
      setCategories(data);
    });

    // Fetch products on component mount
    fetchAllProducts();
  }, []);

  const handleCategoryClick = (cat: ICategory) => {
    // Close both dropdowns immediately
    setShowState(false);
    setLeftMenu(false);
    document.body.style.overflow = "visible";
    
    // Navigate to the category page
    router.push(`/collections/no-sidebar?id=${cat.id}&type=category`);
  };

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
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              setShowState(!showState);
            }}
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
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dropdown
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowState(false); // Also close the main dropdown
              setLeftMenu(false);
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
              onClick={(e) => {
                e.stopPropagation();
                setShowState(false); // Also close the main dropdown
                setLeftMenu(false);
                document.body.style.overflow = "visible";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              <a style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                <i 
                  className="fa fa-angle-left" 
                  style={{ 
                    marginRight: "8px",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center"
                  }}
                ></i>
                <span>Back</span>
              </a>
            </li>

            {categories
              .filter(cat => cat.category_products && cat.category_products.length > 0)
              .map((cat) => (
                <li 
                  key={cat.id} 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    handleCategoryClick(cat);
                  }}
                  style={{ 
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#00baf2";
                    e.currentTarget.style.fontWeight = "bold";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "inherit";
                    e.currentTarget.style.fontWeight = "normal";
                  }}
                >                            
                  <span className="arrow-before">&gt;</span>
                  <span className="category-name">{cat.name}</span>                  
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ByCategory;