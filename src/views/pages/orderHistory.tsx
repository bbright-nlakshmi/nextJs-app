"use client";

import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import {
  Row,
  Col,
  Spinner,
  Input,
  FormGroup,
  Label,
  Button,
  Card,
  CardBody,
  Badge
} from "reactstrap";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import { API } from "@/app/services/api.service";
import { OrderModel } from "@/app/models/order/order";
import { OrderItemsModel } from "@/app/models/order_item_model/order_item_model";
import { useRouter } from "next/navigation";

const OrderHistoryPage: NextPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Simplified function to get phone number from localStorage (same as profile component)
  const getPhoneNumber = (): string => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("Login") || "";
    }
    return "";
  };

  // Function to get user name from localStorage
  const getUserName = (): string => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("UserName") || "";
    }
    return "";
  };

  useEffect(() => {
    // Get phone number and user name when component mounts
    const userPhone = getPhoneNumber();
    const storedUserName = getUserName();
    
    if (!userPhone) {
      setError("Please login to view your order history");
      setLoading(false);
      return;
    }
    
    setPhoneNumber(userPhone);
    setUserName(storedUserName);
  }, []);

  useEffect(() => {
    if (!phoneNumber) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching orders for phone:", phoneNumber);
        const fetchedOrders = await API.getOrders(phoneNumber);
        console.log("Fetched orders:", fetchedOrders);
        
        // Sort orders by creation time (newest first)
        fetchedOrders.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setError("Could not load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [phoneNumber]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleFilter = () => {
    if (!fromDate || !toDate) {
      alert("Please select both from and to dates");
      return;
    }

    // Create date objects and set proper time boundaries
    const fromDateTime = new Date(fromDate);
    fromDateTime.setHours(0, 0, 0, 0); // Start of the day

    const toDateTime = new Date(toDate);
    toDateTime.setHours(23, 59, 59, 999); // End of the day

    // Validate date range
    if (fromDateTime > toDateTime) {
      alert("From date cannot be later than to date");
      return;
    }

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.creationTime);
      return orderDate >= fromDateTime && orderDate <= toDateTime;
    });

    setFilteredOrders(filtered);
    setExpandedOrderId(null);
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    setFilteredOrders(orders);
    setExpandedOrderId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'deliver':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'processing':
      case 'process':
        return '#00baf2';
      case 'cancelled':
      case 'cancel':
        return '#dc3545';
      case 'confirmed':
      case 'confirm':
        return '#00baf2';
      case 'packaged':
      case 'package':
        return '#00baf2';
      default:
        return '#6c757d';
    }
  };

  const handleRetry = () => {
    const userPhone = getPhoneNumber();
    if (userPhone) {
      setPhoneNumber(userPhone);
      setError(null);
    } else {
      window.location.href = '/';
    }
  };

  const handleLogin = () => {
    router.push("/pages/account/login")
  };

  const calculateItemTotal = (item: OrderItemsModel) => {
    return (item.choosedPrice || 0) * (item.cartItemCount || 1);
  };

  const renderOrderSummary = (order: OrderModel) => {
    const orderItems = Object.values(order.orderItems);
    const subtotal = orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    return (
      <div className="order-summary">
        <div className="summary-header">
          <h6>Order Summary</h6>
        </div>
        <div className="summary-content">
          <div className="summary-row">
            <span>Subtotal ({orderItems.length} items)</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="summary-row discount">
              <span>Discount</span>
              <span>-₹{order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {order.couponAmount > 0 && (
            <div className="summary-row discount">
              <span>Coupon ({order.couponCode})</span>
              <span>-₹{order.couponAmount.toFixed(2)}</span>
            </div>
          )}
          {order.deliveryCost > 0 && (
            <div className="summary-row">
              <span>Delivery Charges</span>
              <span>₹{order.deliveryCost.toFixed(2)}</span>
            </div>
          )}
          {order.taxTotal > 0 && (
            <div className="summary-row">
              <span>Tax</span>
              <span>₹{order.taxTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Total Amount</span>
            <span>₹{order.finalOrderTotal.toFixed(2)}</span>
          </div>
          {order.totalSavings > 0 && (
            <div className="savings-badge">
              You saved ₹{order.totalSavings.toFixed(2)} on this order!
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeliveryInfo = (order: OrderModel) => {
    if (!order.deliveryAddress) return null;

    return (
      <div className="delivery-info">
        <div className="info-header">
          <h6>Delivery Information</h6>
        </div>
        <div className="info-content">
          <div className="info-item">
            <div className="info-label">Address</div>
            <div className="info-value">
              <p>{order.deliveryAddress.address || 'N/A'}</p>
              <p>{order.deliveryAddress.city}, {order.deliveryAddress.city || ''}</p>
              <p>{order.deliveryAddress.pinCode || ''}</p>
            </div>
          </div>
          {order.assignedDelivery?.name && order.assignedDelivery.name !== "Not Assigned" && (
            <div className="info-item">
              <div className="info-label">Delivery Partner</div>
              <div className="info-value">
                <p>{order.assignedDelivery.name}</p>
                {order.assignedDelivery.phone && (
                  <p className="phone-number">📞 {order.assignedDelivery.phone}</p>
                )}
              </div>
            </div>
          )}
          <div className="info-item">
            <div className="info-label">Payment Method</div>
            <div className="info-value">
              <p>{order.paymentMode || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="order-history-section">
      <Breadcrumb title="Order History" parent="Home" />

      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">My Orders</h1>
            <p className="page-subtitle">Track and manage your order history</p>
            {phoneNumber && userName && (
              <div className="user-info">
                <span className="user-badge">Orders for: {userName} ({phoneNumber})</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Section */}
        {phoneNumber && (
          <div className="filter-card">
            <div className="filter-header">
              <h3>Filter Your Orders</h3>
            </div>
            <div className="filter-content">
              <div className="filter-grid">
                <div className="filter-group">
                  <label className="filter-label">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="filter-actions">
                  <button className="btn-primary" onClick={handleFilter}>
                    Apply Filter
                  </button>
                  <button className="btn-secondary" onClick={handleClearFilter}>
                    Clear Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Section */}
        <div className="orders-container">
          {loading ? (
            <div className="empty-state">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading your orders...</p>
              </div>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="error-container">
                {!phoneNumber ? (
                  <>
                    <div className="login-icon">🔐</div>
                    <h3 className="login-title">Login Required</h3>
                    <p className="login-message">Please login to view your order history</p>
                    <div className="error-actions">
                      <button className="btn-primary" onClick={handleLogin}>
                        Go to Login
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="error-icon">⚠️</div>
                    <h3 className="error-title">{error}</h3>
                    <div className="error-actions">
                      <button className="btn-primary" onClick={handleRetry}>
                        Try Again
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="no-orders-container">
                <div className="no-orders-icon">📦</div>
                <h3>No orders found</h3>
                <p>
                  {fromDate || toDate 
                    ? "No orders match your selected date range" 
                    : "You haven't placed any orders yet"
                  }
                </p>
                {(fromDate || toDate) && (
                  <button className="btn-primary" onClick={handleClearFilter}>
                    Show All Orders
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="orders-list">
              <div className="orders-count">
                Showing {filteredOrders.length} of {orders.length} orders
                {(fromDate && toDate) && (
                  <span className="date-range"> from {formatDate(fromDate)} to {formatDate(toDate)}</span>
                )}
              </div>
              
              {filteredOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div 
                    className="order-header"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="order-summary-row">
                      <div className="order-info">
                        <div className="order-id">Order #{order.id}</div>
                        <div className="order-meta">
                          <span className="order-date">{formatDate(order.creationTime)}</span>
                          <span className="order-store">📍 {order.store}</span>
                        </div>
                      </div>
                      
                      <div className="order-stats">
                        <div className="stat-item">
                          <div className="stat-value">{Object.keys(order.orderItems).length}</div>
                          <div className="stat-label">Items</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">₹{order.finalOrderTotal.toFixed(2)}</div>
                          <div className="stat-label">Total</div>
                        </div>
                      </div>
                      
                      <div className="order-status">
                        <div 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(order.orderAcceptStatus || "Pending") }}
                        >
                          {order.orderAcceptStatus || "Pending"}
                        </div>
                        <div className="payment-method">{order.paymentMode}</div>
                      </div>
                      
                      <div className="expand-toggle">
                        <div className={`expand-icon ${expandedOrderId === order.id ? 'expanded' : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="order-details">
                      <div className="details-header">
                        <h4>Order Details</h4>
                      </div>
                      
                      <div className="items-section">
                        {Object.values(order.orderItems).map((item: OrderItemsModel, idx) => {
                          const itemTotal = calculateItemTotal(item);

                          return (
                            <div key={idx} className="product-item">
                              <div className="product-image">
                                <img
                                  src={item.url || item.orderKitItems?.[0]?.img?.[0] || "/images/product-sidebar/001.jpg"}
                                  alt={item.name}
                                />
                              </div>
                              
                              <div className="product-info">
                                <div className="product-details">
                                  <h6 className="product-name">{item.name}</h6>
                                  <p className="product-category">{item.categoryName || "N/A"}</p>
                                  
                                  {item.saleQuantityStr && (
                                    <div className="product-variation">
                                      <span className="variation-badge">📏 {item.saleQuantityStr}</span>
                                    </div>
                                  )}
                                  
                                  {item.selectedVariation && (
                                    <div className="additional-info">
                                      <small>Variation: {item.selectedVariation}</small>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="product-pricing">
                                  <div className="price-section">
                                    <div className="current-price">₹{item.choosedPrice?.toFixed(2) ?? "0.00"}</div>
                                    {item.baseCHoosedPrice && item.baseCHoosedPrice !== item.choosedPrice && (
                                      <div className="original-price">₹{item.baseCHoosedPrice.toFixed(2)}</div>
                                    )}
                                    <div className="price-label">per item</div>
                                  </div>
                                  
                                  <div className="quantity-section">
                                    <div className="quantity-badge">Qty: {item.cartItemCount}</div>
                                    <div className="item-total">Total: ₹{itemTotal.toFixed(2)}</div>
                                  </div>
                                  
                                  {item.rating > 0 && (
                                    <div className="rating-section">
                                      <div className="rating-display">
                                        ⭐ {item.rating}/5
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Summary */}
                      {renderOrderSummary(order)}

                      {/* Delivery Information */}
                      {renderDeliveryInfo(order)}

                      {/* Order Timeline */}
                      {/* <div className="order-timeline">
                        <div className="timeline-header">
                          <h6>Order Timeline</h6>
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-item">
                            <strong>Order Placed:</strong> {formatDateTime(order.orderTime)}
                          </div>
                          {order.creationTime !== order.orderTime && (
                            <div className="timeline-item">
                              <strong>Order Created:</strong> {formatDateTime(order.creationTime)}
                            </div>
                          )}
                          {order.updationTime && (
                            <div className="timeline-item">
                              <strong>Last Updated:</strong> {formatDateTime(order.updationTime)}
                            </div>
                          )}
                        </div>
                      </div> */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;