/* eslint-disable @next/next/no-img-element */
import React, { Fragment } from "react";
import { NextPage } from "next";
import { Media, Row, Col } from "reactstrap";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const OrderSuccessPage: NextPage = () => {
  const router = useRouter();
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;

  // Retrieve order data from sessionStorage
  const orderData = JSON.parse(sessionStorage.getItem("order-success-data") || "{}");

  // Destructure order data
  const {
    orderId = `ORD-${Date.now()}`,
    items = [],
    total = 0,
    subtotal = 0,
    tax = 0,
    couponDiscount = 0,
    appliedCoupon = null,
    billingAddress = {},
    paymentMethod = "cod",
    orderDate = new Date().toISOString(),
  } = orderData;

  // Enhanced price extraction function - same logic as your working PriceRanges component
  const getPrice = (item: any): number => {
    if (!item) return 0;
    
    try {
      // Enhanced price extraction
      const extractPriceFromObject = (obj: any): number => {
        if (!obj || typeof obj !== 'object') return 0;
        
        // Check standard price fields first
        if ('price' in obj && typeof obj.price === 'number' && obj.price > 0) {
          return obj.price;
        }
        
        // Check Kit-specific price fields
        if ('kitPrice' in obj && typeof obj.kitPrice === 'number' && obj.kitPrice > 0) {
          return obj.kitPrice;
        }
        
        // Check for discount price (prioritize over original price)
        if (obj.discountPrice && typeof obj.discountPrice === 'number' && obj.discountPrice > 0) {
          return obj.discountPrice;
        }
        
        // Check for sale price
        if (obj.salePrice && typeof obj.salePrice === 'number' && obj.salePrice > 0) {
          return obj.salePrice;
        }
        
        // Check for finalPrice
        if (obj.finalPrice && typeof obj.finalPrice === 'number' && obj.finalPrice > 0) {
          return obj.finalPrice;
        }
        
        // Check for currentPrice
        if (obj.currentPrice && typeof obj.currentPrice === 'number' && obj.currentPrice > 0) {
          return obj.currentPrice;
        }
        
        // Check for sellingPrice
        if (obj.sellingPrice && typeof obj.sellingPrice === 'number' && obj.sellingPrice > 0) {
          return obj.sellingPrice;
        }
        
        // Try extracting from nested price objects
        const nestedPrice = obj.pricing || obj.priceInfo || obj.cost || obj.priceData;
        if (typeof nestedPrice === 'number' && nestedPrice > 0) {
          return nestedPrice;
        }
        if (typeof nestedPrice === 'object' && nestedPrice !== null) {
          const extractedPrice = nestedPrice.amount || nestedPrice.value || nestedPrice.price || nestedPrice.final || nestedPrice.current;
          if (typeof extractedPrice === 'number' && extractedPrice > 0) {
            return extractedPrice;
          }
        }
        
        return 0;
      };
      
      // Try extracting price from the item itself
      let price = extractPriceFromObject(item);
      if (price > 0) return price;
      
      // Try extracting price from the product data
      if (item.product) {
        price = extractPriceFromObject(item.product);
        if (price > 0) return price;
      }
      
      // Try extracting from nested productData
      if (item.productData) {
        price = extractPriceFromObject(item.productData);
        if (price > 0) return price;
      }
      
    } catch (error) {
      console.warn("Error getting price for item:", error);
    }
    
    return 0;
  };

  // Format billing address
  const formatAddress = () => {
    const { firstName, lastName, address, city, state, country, pincode, phone } = billingAddress;
    return {
      name: `${firstName || ""} ${lastName || ""}`.trim(),
      addressLine: address || "",
      cityState: `${city || ""}, ${state || ""}`.trim(),
      country: country || "",
      postalCode: pincode || "",
      phone: phone || "",
    };
  };

  const address = formatAddress();

  // Recalculate totals with proper pricing
  const recalculatedSubtotal = items.reduce((sum: number, item: any) => {
    const price = getPrice(item);
    return sum + (price * (item.qty || 1));
  }, 0);

  const displaySubtotal = subtotal > 0 ? subtotal : recalculatedSubtotal;
  const displayTotal = total > 0 ? total : (recalculatedSubtotal + tax - couponDiscount);

  return (
    <Fragment>
      <Breadcrumb title="order-success" parent="home" />
      <section className="section-big-py-space mt--5 bg-light">
        <div className="custom-container">
          {items.length > 0 ? (
            <Row>
              <Col lg="6">
                <div className="product-order">
                  <h3>Your Order Details</h3>
                  <Row className="product-order-detail g-3">
                    {/* Headers */}
                    <Col xs="4" className="order_detail_header">
                      <h4>Product Name</h4>
                    </Col>
                    <Col xs="4" className="order_detail_header">
                      <h4>Quantity</h4>
                    </Col>
                    <Col xs="4" className="order_detail_header">
                      <h4>Price</h4>
                    </Col>
                    
                    {/* Product Items */}
                    {items.map((item: any, i: number) => {
                      const price = getPrice(item);
                      const itemName = item.name || item.title || item.productName || item.product?.name || item.product?.title || "Unknown Product";
                      
                      return (
                        <Fragment key={i}>
                          <Col xs="4" className="order_detail">
                            <h5>{itemName}</h5>
                          </Col>
                          <Col xs="4" className="order_detail">
                            <h5>{item.qty || 1}</h5>
                          </Col>
                          <Col xs="4" className="order_detail">
                            <h5>
                              {symbol}
                              {(price * value).toFixed(2)}
                            </h5>
                          </Col>
                        </Fragment>
                      );
                    })}
                  </Row>

                  <div className="total-sec">
                    <ul>
                      <li>
                        Subtotal ({items.length} items)
                        <span>
                          {symbol}
                          {(displaySubtotal * value).toFixed(2)}
                        </span>
                      </li>
                      {couponDiscount > 0 && appliedCoupon && (
                        <li>
                          Coupon Discount ({appliedCoupon.code})
                          <span className="text-success">
                            -{symbol}
                            {(couponDiscount * value).toFixed(2)}
                          </span>
                        </li>
                      )}
                      <li>
                        Tax ({(orderData.taxRate * 100 || 10).toFixed(0)}%)
                        <span>
                          {symbol}
                          {(tax * value).toFixed(2)}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="final-total">
                    <h3>
                      Total
                      <span>
                        {symbol}
                        {(displayTotal * value).toFixed(2)}
                      </span>
                    </h3>
                  </div>
                </div>
              </Col>
              <Col lg="6">
                <div className="row order-success-sec">
                  <div className="col-sm-6">
                    <h4>Summary</h4>
                    <ul className="order-detail">
                      <li>Order ID: {orderId}</li>
                      <li>Order Date: {dayjs(orderDate).format("DD MMM YYYY")}</li>
                      <li>
                        Order Total: {symbol}
                        {(displayTotal * value).toFixed(2)}
                      </li>
                    </ul>
                  </div>
                  <div className="col-sm-6">
                    <h4>Shipping Address</h4>
                    <ul className="order-detail">
                      <li>{address.name || "N/A"}</li>
                      <li>{address.addressLine || "N/A"}</li>
                      <li>
                        {address.cityState}
                        {address.postalCode ? `, ${address.postalCode}` : ""}
                      </li>
                      <li>{address.country || "N/A"}</li>
                      <li>Contact No. {address.phone || "N/A"}</li>
                    </ul>
                  </div>
                  <div className="col-sm-12 payment-mode">
                    <h4>Payment Method</h4>
                    <p>
                      {paymentMethod === "cod"
                        ? "Cash on Delivery (COD)"
                        : paymentMethod === "paypal"
                        ? "PayPal Payment"
                        : "Credit/Debit Card"}
                    </p>
                  </div>
                </div>
              </Col>
            </Row>
          ) : (
            <div className="col-sm-12">
              <div className="empty-cart-cls text-center">
                <img src="/static/images/icon-empty-cart.png" className="img-fluid mb-4" alt="Empty Cart" />
                <h3 className="mb-3">
                  <strong>No Order Found</strong>
                </h3>
                <div className="row cart-buttons">
                  <div className="col-12">
                    <button
                      onClick={() => router.push("/")}
                      className="btn btn-normal"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={() => router.push("/pages/account/checkout")}
                      className="btn btn-normal ms-3"
                    >
                      Check Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Fragment>
  );
};

export default OrderSuccessPage;