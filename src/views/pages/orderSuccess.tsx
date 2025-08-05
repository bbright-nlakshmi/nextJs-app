/* eslint-disable @next/next/no-img-element */
import React, { Fragment, useEffect, useState, useContext } from "react";
import { NextPage } from "next";
import { Media, Row, Col } from "reactstrap";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface OrderItem {
  id: string;
  name: string;
  img: string[];
  cartItemCount: number;
  price: number;
  discountPrice?: number;
  taxAmount?: number;
  categoryName?: string;
}

interface OrderData {
  orderId: string;
  items: OrderItem[];
  cartTotal: number;
  finalTotal: number;
  discountAmount: number;
  packageCost: number;
  deliveryCost: number;
  taxTotal: number;
  totalSavings: number;
  billingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    country: string;
    state: string;
    city: string;
    address: string;
    pincode: string;
  };
  paymentMethod: string;
  orderDate: string;
  storeDetails?: {
    name: string;
    id: string;
  };
  gstNumber?: string;
}

const OrderSuccessPage: NextPage = () => {
  const router = useRouter();
  const currencyContext = useContext(CurrencyContext);
  const { selectedCurr } = currencyContext || {};
  const { symbol = '$', value = 1 } = selectedCurr || {};
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Try to get order data from sessionStorage
      const storedOrderData = sessionStorage.getItem("order-success-data");
      
      if (storedOrderData) {
        const parsedData = JSON.parse(storedOrderData);
        setOrderData(parsedData);
      } else {
        // If no stored data, try to get from URL params or local storage
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdFromUrl = urlParams.get('orderId');
        
        if (orderIdFromUrl) {
          // Try to get order data from localStorage using orderId
          const orderFromStorage = localStorage.getItem(`order-${orderIdFromUrl}`);
          if (orderFromStorage) {
            const parsedData = JSON.parse(orderFromStorage);
            setOrderData(parsedData);
          }
        }
      }
    } catch (error) {
      console.error("Error loading order data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get effective price for an item (considering discount)
  const getEffectivePrice = (item: OrderItem): number => {
    return item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
  };

  // Format billing address for display
  const formatAddress = (billingAddress: OrderData['billingAddress']) => {
    if (!billingAddress) return null;
    
    const { firstName, lastName, address, city, state, country, pincode, phone } = billingAddress;
    return {
      name: `${firstName || ""} ${lastName || ""}`.trim(),
      addressLine: address || "",
      cityState: `${city || ""}, ${state || ""}`.replace(/^,\s*|,\s*$/g, ''),
      country: country || "",
      postalCode: pincode || "",
      phone: phone || "",
    };
  };

  // Get payment method display text
  const getPaymentMethodText = (paymentMethod: string): string => {
    const paymentTexts: { [key: string]: string } = {
      "COD": "Cash on Delivery (COD)",
      "PICK_AT_STORE": "Pick at Store",
      "RAZORPAY": "Razorpay",
      "PHONEPE": "PhonePe",
      "paypal": "PayPal Payment",
      "card": "Credit/Debit Card"
    };
    
    return paymentTexts[paymentMethod] || paymentMethod;
  };

  // Navigate to order history
  const handleViewAllOrders = () => {
    router.push("/views/pages/OrderHistory");
  };

  if (isLoading) {
    return (
      <Fragment>
        <Breadcrumb title="order-success" parent="home" />
        <section className="section-big-py-space mt--5 bg-light">
          <div className="custom-container">
            <div className="text-center">
              <div className="spinner-border order-success-spinner" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-3">Loading order details...</p>
            </div>
          </div>
        </section>
      </Fragment>
    );
  }

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return (
      <Fragment>
        <Breadcrumb title="order-success" parent="home" />
        <section className="section-big-py-space mt--5 bg-light">
          <div className="custom-container">
            <div className="col-sm-12">
              <div className="empty-cart-cls text-center">
                <img src="/static/images/icon-empty-cart.png" className="img-fluid mb-4" alt="Empty Cart" />
                <h3 className="mb-3">
                  <strong>No Order Found</strong>
                </h3>
                <p className="mb-4">We couldn't find your order details. This might happen if:</p>
                <ul className="text-left d-inline-block mb-4" style={{ textAlign: 'left' }}>
                  <li>The order data has expired</li>
                  <li>You accessed this page directly</li>
                  <li>There was an error processing your order</li>
                </ul>
                <div className="row cart-buttons">
                  <div className="col-12">
                    <button
                      onClick={() => router.push("/")}
                      className="btn btn-normal order-success-btn-primary"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={() => router.push("/pages/account/checkout")}
                      className="btn btn-normal ms-3 order-success-btn-primary"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Fragment>
    );
  }

  const address = formatAddress(orderData.billingAddress);

  return (
    <Fragment>
      <Breadcrumb title="order-success" parent="home" />
      <section className="section-big-py-space mt--5 bg-light">
        <div className="custom-container">
          {/* Success Message */}
          <div className="row mb-4">
            <div className="col-12 text-center">
              <div className="alert p-4 order-success-alert">
                <i className="fa fa-check-circle fa-3x mb-3 order-success-icon"></i>
                <h2 className="mb-2 order-success-title">Order Placed Successfully!</h2>
                <p className="mb-0">Thank you for your order. Your order ID is <strong>{orderData.orderId}</strong></p>
              </div>
            </div>
          </div>

          <Row>
            <Col lg="6">
              <div className="product-order">
                <h3 className="order-details-title">Your Order Details</h3>
                <Row className="product-order-detail g-3">
                  {/* Headers */}
                  <Col xs="4" className="order_detail_header">
                    <h4 className="order-header-text">Product</h4>
                  </Col>
                  <Col xs="3" className="order_detail_header">
                    <h4 className="order-header-text">Qty</h4>
                  </Col>
                  <Col xs="2" className="order_detail_header">
                    <h4 className="order-header-text">Price</h4>
                  </Col>
                  <Col xs="3" className="order_detail_header">
                    <h4 className="order-header-text">Total</h4>
                  </Col>
                  
                  {/* Product Items */}
                  {orderData.items.map((item: OrderItem, i: number) => {
                    const effectivePrice = getEffectivePrice(item);
                    const itemTotal = effectivePrice * item.cartItemCount;
                    
                    return (
                      <Fragment key={`${item.id}_${i}`}>
                        <Col xs="4" className="order_detail">
                          <div className="product-text-info">
                            <h6 className="mb-0 order-item-name">{item.name}</h6>
                            {item.categoryName && (
                              <small className="text-muted order-item-category">{item.categoryName}</small>
                            )}
                          </div>
                        </Col>
                        <Col xs="3" className="order_detail">
                          <h5 className="order-qty-text">{item.cartItemCount}</h5>
                        </Col>
                        <Col xs="2" className="order_detail">
                          <div>
                            <h6 className="mb-0 order-price-text">
                              {symbol}{(effectivePrice * value).toFixed(2)}
                            </h6>
                            {item.discountPrice && item.discountPrice < item.price && (
                              <small className="text-muted text-decoration-line-through order-original-price">
                                {symbol}{(item.price * value).toFixed(2)}
                              </small>
                            )}
                          </div>
                        </Col>
                        <Col xs="3" className="order_detail">
                          <h5 className="order-total-text">
                            {symbol}{(itemTotal * value).toFixed(2)}
                          </h5>
                        </Col>
                      </Fragment>
                    );
                  })}
                </Row>

                <div className="total-sec">
                  <ul>
                    <li>
                      Cart Total ({orderData.items.length} items)
                      <span>
                        {symbol}{(orderData.cartTotal * value).toFixed(2)}
                      </span>
                    </li>
                    
                    {orderData.discountAmount > 0 && (
                      <li>
                        Item Discount
                        <span className="text-success">
                          -{symbol}{(orderData.discountAmount * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.taxTotal > 0 && (
                      <li>
                        Tax
                        <span>
                          {symbol}{(orderData.taxTotal * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.packageCost > 0 && (
                      <li>
                        Package Cost
                        <span>
                          {symbol}{(orderData.packageCost * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.deliveryCost > 0 && (
                      <li>
                        Delivery Charges
                        <span>
                          {symbol}{(orderData.deliveryCost * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.totalSavings > 0 && (
                      <li className="text-success">
                        Total Savings
                        <span>
                          {symbol}{(orderData.totalSavings * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="final-total">
                  <h3 className="final-total-text">
                    Final Total
                    <span>
                      {symbol}{(orderData.finalTotal * value).toFixed(2)}
                    </span>
                  </h3>
                </div>
              </div>
            </Col>
            
            <Col lg="6">
              <div className="row order-success-sec">
                <div className="col-sm-6">
                  <h4 className="order-section-title">Order Summary</h4>
                  <ul className="order-detail">
                    <li><strong>Order ID:</strong> {orderData.orderId}</li>
                    <li><strong>Order Date:</strong> {dayjs(orderData.orderDate).format("DD MMM YYYY, hh:mm A")}</li>
                    <li>
                      <strong>Order Total:</strong> <span className="order-total-highlight">{symbol}{(orderData.finalTotal * value).toFixed(2)}</span>
                    </li>
                    {orderData.storeDetails && (
                      <li><strong>Store:</strong> {orderData.storeDetails.name}</li>
                    )}
                    {orderData.gstNumber && (
                      <li><strong>GST Number:</strong> {orderData.gstNumber}</li>
                    )}
                  </ul>
                </div>
                
                <div className="col-sm-6">
                  <h4 className="order-section-title">Shipping Address</h4>
                  {address ? (
                    <ul className="order-detail">
                      <li><strong>{address.name}</strong></li>
                      <li>{address.addressLine}</li>
                      <li>{address.cityState}</li>
                      {address.postalCode && <li>PIN: {address.postalCode}</li>}
                      <li>{address.country}</li>
                      {address.phone && <li><strong>Phone:</strong> {address.phone}</li>}
                    </ul>
                  ) : (
                    <p>Address information not available</p>
                  )}
                </div>
                
                <div className="col-sm-12 payment-mode">
                  <h4 className="order-section-title">Payment Method</h4>
                  <p className="mb-0">
                    <i className="fa fa-credit-card me-2 payment-icon"></i>
                    {getPaymentMethodText(orderData.paymentMethod)}
                  </p>
                  
                  {orderData.paymentMethod === 'COD' && (
                    <small className="text-muted">
                      Please keep the exact amount ready for cash on delivery
                    </small>
                  )}
                  
                  {orderData.paymentMethod === 'PICK_AT_STORE' && (
                    <small className="text-muted">
                      Please visit our store to collect your order
                    </small>
                  )}
                </div>

                <div className="col-sm-12 mt-3">
                  <div className="d-flex gap-2 flex-wrap justify-content-center justify-content-sm-start">
                    <button
                      onClick={() => router.push("/")}
                      className="btn btn-outline-primary flex-fill flex-sm-grow-0 order-success-btn-outline"
                      onMouseEnter={(e) => {
                        e.currentTarget.classList.add('order-success-btn-outline-hover');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.classList.remove('order-success-btn-outline-hover');
                      }}
                    >
                      Continue Shopping
                    </button>
                    {/* <button
                      onClick={handleViewAllOrders}
                      className="btn btn-primary flex-fill flex-sm-grow-0 order-success-btn-primary"
                    >
                      View All Orders
                    </button> */}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </Fragment>
  );
};

export default OrderSuccessPage;