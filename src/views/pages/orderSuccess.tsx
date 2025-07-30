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

  // Destructure order data with proper fallbacks
  const {
    orderId = `ORD-${Date.now()}`,
    items: rawItems = [],
    total = 0,
    subtotal = 0,
    tax = 0,
    couponDiscount = 0,
    appliedCoupon = null,
    billingAddress = {},
    billingDetails = {}, // From checkout page structure
    paymentMethod = "cod",
    orderDate = new Date().toISOString(),
    totals = {} // From checkout page structure
  } = orderData;

  // Ensure items is always an array - handle different data structures
  const items = React.useMemo(() => {
    // If rawItems is already an array, use it
    if (Array.isArray(rawItems)) {
      return rawItems;
    }
    // If rawItems is an object (like from the checkout page), convert to array
    if (rawItems && typeof rawItems === 'object') {
      return Object.values(rawItems);
    }
    // Fallback to empty array
    return [];
  }, [rawItems]);

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

  // Get item quantity - handle different data structures
  const getItemQuantity = (item: any): number => {
    return item.qty || item.cartItemCount || item.quantity || 1;
  };

  // Get item name - handle different data structures
  const getItemName = (item: any): string => {
    return item.name || item.title || item.productName || item.product?.name || item.product?.title || "Unknown Product";
  };

  // Format billing address - handle both billingAddress and billingDetails structures
  const formatAddress = () => {
    const addressData = Object.keys(billingDetails).length > 0 ? billingDetails : billingAddress;
    const { firstName, lastName, address, city, state, country, pincode, pinCode, phone, phoneNumber } = addressData;
    
    return {
      name: `${firstName || ""} ${lastName || ""}`.trim(),
      addressLine: address || "",
      cityState: `${city || ""}, ${state || ""}`.trim(),
      country: country || "",
      postalCode: pincode || pinCode || "",
      phone: phone || phoneNumber || "",
    };
  };

  const address = formatAddress();

  // Use totals from checkout page if available, otherwise calculate from items
  const calculations = React.useMemo(() => {
    // If we have totals from checkout page, use them
    if (totals && Object.keys(totals).length > 0) {
      return {
        subtotal: totals.cartAmount || 0,
        tax: totals.taxAmount || 0,
        couponDiscount: totals.discountAmount || 0,
        total: totals.finalTotal || 0,
        deliveryCharges: totals.deliveryCharges || 0,
        packageCost: totals.packageCost || 0,
        totalSavings: totals.totalSavings || 0
      };
    }

    // Fallback to calculating from items if totals not available
    const recalculatedSubtotal = items.reduce((sum: number, item: any) => {
      const price = getPrice(item);
      const quantity = getItemQuantity(item);
      return sum + (price * quantity);
    }, 0);

    return {
      subtotal: subtotal > 0 ? subtotal : recalculatedSubtotal,
      tax: tax || 0,
      couponDiscount: couponDiscount || 0,
      total: total > 0 ? total : (recalculatedSubtotal + tax - couponDiscount),
      deliveryCharges: 0,
      packageCost: 0,
      totalSavings: 0
    };
  }, [items, totals, subtotal, tax, couponDiscount, total]);

  // Get tax rate for display
  const taxRate = orderData.taxRate || (calculations.tax > 0 && calculations.subtotal > 0 ? (calculations.tax / calculations.subtotal) : 0.1);

  return (
    <div className="order-success-page">
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
                        const quantity = getItemQuantity(item);
                        const itemName = getItemName(item);
                        
                        return (
                          <Fragment key={i}>
                            <Col xs="4" className="order_detail">
                              <h5>{itemName}</h5>
                            </Col>
                            <Col xs="4" className="order_detail">
                              <h5>{quantity}</h5>
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
                            {(calculations.subtotal * value).toFixed(2)}
                          </span>
                        </li>
                        {calculations.couponDiscount > 0 && (
                          <li>
                            Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}
                            <span className="text-success">
                              -{symbol}
                              {(calculations.couponDiscount * value).toFixed(2)}
                            </span>
                          </li>
                        )}
                        {calculations.packageCost > 0 && (
                          <li>
                            Package Cost
                            <span>
                              {symbol}
                              {(calculations.packageCost * value).toFixed(2)}
                            </span>
                          </li>
                        )}
                        {calculations.deliveryCharges > 0 && (
                          <li>
                            Delivery Charges
                            <span>
                              {symbol}
                              {(calculations.deliveryCharges * value).toFixed(2)}
                            </span>
                          </li>
                        )}
                        <li>
                          Tax ({(taxRate * 100).toFixed(0)}%)
                          <span>
                            {symbol}
                            {(calculations.tax * value).toFixed(2)}
                          </span>
                        </li>
                        {calculations.totalSavings > 0 && (
                          <li className="text-success">
                            Total Savings
                            <span>
                              -{symbol}
                              {(calculations.totalSavings * value).toFixed(2)}
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="final-total">
                      <h3>
                        Total
                        <span>
                          {symbol}
                          {(calculations.total * value).toFixed(2)}
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
                          {(calculations.total * value).toFixed(2)}
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
                        {paymentMethod === "COD" || paymentMethod === "cod"
                          ? "Cash on Delivery (COD)"
                          : paymentMethod === "PICK_AT_STORE"
                          ? "Pick at Store"
                          : paymentMethod === "PHONEPE"
                          ? "PhonePe Payment"
                          : paymentMethod === "RAZORPAY"
                          ? "Razorpay Payment"
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
    </div>
  );
};

export default OrderSuccessPage;