import React, { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { CartContext } from "../../../../helpers/cart/cart.context";
import { useTranslation } from "react-i18next";

const ShoppingCart = ({ layout }: { layout?: string }) => {
  const { cartItems } = React.useContext(CartContext);
  const { t } = useTranslation("common");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const itemCount = mounted ? cartItems?.length || 0 : 0;

  return (
    <Fragment>
      {layout === "layout3" ? (
        <li className="mobile-cart cart-hover-div">
          <Link href="/pages/account/cart" className="cart-link">
            <span className="cart-item">{itemCount}</span>
            <i className="icon-shopping-cart"></i>
          </Link>
        </li>
      ) : (
        <div className="cart-block cart-hover-div">
          <Link href="/pages/account/cart" className="cart-link">
            <div className="cart">
              <span className="cart-product">{itemCount}</span>
              <ul>
                <li className="mobile-cart">
                  <i className="icon-shopping-cart"></i>
                </li>
              </ul>
            </div>
            {/* <div className="cart-item">
              <h5>{t("shopping")}</h5>
              <h5>{t("cart")}</h5>
            </div> */}
          </Link>
        </div>
      )}
    </Fragment>
  );
};

export default ShoppingCart;
