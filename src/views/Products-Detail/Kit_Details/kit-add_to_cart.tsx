import React, { useContext, useState } from "react";
import { Input } from "reactstrap";
import CountDownComponent from "../../layouts/widgets/CountDownComponent";
import { CartContext } from "@/helpers/cart/cart.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { Kit } from "@/app/models/models";

interface ProductRightProps {
  item: any;
}

const KitAddToCart: React.FC<ProductRightProps> = ({ item }) => {
  const [qty, setQty] = useState(item.minCount || 1);
  const [stock, setStock] = useState(item.isInStock() ? "InStock" : "OutOfStock");

  const { addToCart } = useContext(CartContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;

  const minusQty = () => {
    if (qty > item.minCount) {
      setStock("InStock");
      setQty(qty - 1);
    }
  };

  const plusQty = () => {
    if (item.isInOrderStock(qty + 1)) {
      setQty(qty + 1);
    } else {
      setStock("Out of Stock !");
    }
  };

  const changeQty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseInt(e.target.value);
    if (!isNaN(newQty) && newQty >= item.minCount) {
      if (item.isInOrderStock(newQty)) {
        setQty(newQty);
        setStock("InStock");
      } else {
        setStock("Out of Stock !");
      }
    }
  };

  // Calculate prices
  const basePrice = item.getPrice({ cartQuantity: qty }) * value;
  const discountAmount = item.getDiscountAmount({ quantity: qty }) * value;
  const finalPrice = item.getPriceWithDiscount({ quantity: qty }) * value;

  return (
    <div className="product-right product-form-box">
      <h2>{item.name}</h2>
      
      {item.isDiscount() ? (
        <>
          <h4>
            <del>
              {symbol}{basePrice.toFixed(2)}
            </del>
            <span>{item.getDiscount()}% off</span>
          </h4>
          <h3>
            {symbol}{finalPrice.toFixed(2)}
          </h3>
        </>
      ) : (
        <h3>
          {symbol}{basePrice.toFixed(2)}
        </h3>
      )}

      <div className="product-description border-product">
        {item.isDiscount() && (
          <>
            <h6 className="product-title">Time Reminder</h6>
            {/* <CountDownComponent endDate={item.getDiscountEndDate()} /> */}
          </>
        )}
        
        {stock !== "InStock" && <span className="instock-cls">{stock}</span>}
        
        <h6 className="product-title">quantity</h6>
        <div className="qty-box">
          <div className="input-group">
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-left-minus"
                data-type="minus"
                data-field=""
                onClick={minusQty}
                disabled={qty <= item.minCount}
              >
                <i className="ti-angle-left"></i>
              </button>
            </span>
            <Input
              type="text"
              name="quantity"
              className="form-control input-number"
              value={qty}
              onChange={changeQty}
            />
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-right-plus"
                data-type="plus"
                data-field=""
                onClick={plusQty}
                disabled={!item.isInOrderStock(qty + 1)}
              >
                <i className="ti-angle-right"></i>
              </button>
            </span>
          </div>
        </div>
      </div>

      <div className="product-buttons">
        <a
          href="#"
          data-toggle="modal"
          data-target="#addtocart"
          className="btn btn-normal"
          onClick={(e) => {
            e.preventDefault();
            if (item.isInOrderStock(qty)) {
              addToCart(item, qty);
            }
          }}
        >
          add to cart
        </a>{" "}
        <a
          href="/pages/account/checkout"
          className="btn btn-normal"
          onClick={(e) => {
            if (!item.isInOrderStock(qty)) {
              e.preventDefault();
            } else {
              addToCart(item, qty);
            }
          }}
        >
          buy now
        </a>
      </div>

      {item.tax && (
        <div className="tax-notice mt-2 small text-muted">
          * Price includes {item.tax.name} ({item.getTaxType()})
        </div>
      )}
    </div>
  );
};

export default KitAddToCart;