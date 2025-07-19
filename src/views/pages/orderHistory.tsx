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

const OrderHistoryPage: NextPage = () => {
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const phoneNumber = "7671985191";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedOrders = await API.getOrders(phoneNumber);
        fetchedOrders.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setError("Could not load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="order-history-section">
      <Breadcrumb title="Order History" parent="Home" />

      <div className="container">
        <div className="text-center mb-4">
          <h2 className="page-title">My Orders</h2>
          <p className="text-muted">Track and manage your order history</p>
        </div>

        {/* Enhanced Filter Section */}
        <Card className="filter-card">
          <div className="filter-section">
            <div className="filter-content">
              <h3 className="filter-title">Filter Your Orders</h3>
              <Row className="filter-row">
                <Col lg="4" md="6">
                  <FormGroup className="filter-group">
                    <Label className="filter-label">From Date</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="form-control"
                    />
                  </FormGroup>
                </Col>
                <Col lg="4" md="6">
                  <FormGroup className="filter-group">
                    <Label className="filter-label">To Date</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="form-control"
                    />
                  </FormGroup>
                </Col>
                <Col lg="4" md="12">
                  <div className="button-group">
                    <Button className="primary-btn" onClick={handleFilter}>
                      Apply Filter
                    </Button>
                    <Button className="secondary-btn" onClick={handleClearFilter}>
                      Clear Filter
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Card>

        {/* Orders Section */}
        <Row>
          <Col sm="12">
            {loading ? (
              <div className="empty-state">
                <Spinner className="loading-spinner" size="lg" />
                <p className="mt-3">Loading your orders...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h5 className="text-danger">{error}</h5>
                <Button className="primary-btn mt-3" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h5>No orders found</h5>
                <p>
                  {fromDate || toDate 
                    ? "No orders match your selected date range" 
                    : "You haven't placed any orders yet"
                  }
                </p>
                {(fromDate || toDate) && (
                  <Button className="primary-btn mt-3" onClick={handleClearFilter}>
                    Show All Orders
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-3 text-muted">
                  Showing {filteredOrders.length} of {orders.length} orders
                  {(fromDate && toDate) && (
                    <span> from {formatDate(fromDate)} to {formatDate(toDate)}</span>
                  )}
                </div>
                
                {/* Orders List */}
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="order-card">
                    <div className="order-header"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <Row className="align-items-center">
                        <Col xs="12" md="3">
                          <div className="d-flex align-items-center">
                            <div>
                              <h6 className="mb-0 fw-bold">Order #{order.id}</h6>
                              <small className="text-muted">{formatDate(order.creationTime)}</small>
                            </div>
                          </div>
                        </Col>
                        <Col xs="6" md="2" className="text-center">
                          <div>
                            <strong className="text-dark">{Object.keys(order.orderItems).length}</strong>
                            <div><small className="text-muted">Items</small></div>
                          </div>
                        </Col>
                        <Col xs="6" md="2" className="text-center">
                          <div>
                            <strong className="text-dark">₹{order.finalOrderTotal.toFixed(2)}</strong>
                            <div><small className="text-muted">Total</small></div>
                          </div>
                        </Col>
                        <Col xs="8" md="3" className="text-center">
                          <Badge color={getStatusColor(order.orderAcceptStatus || "Pending")}>
                            {order.orderAcceptStatus || "Pending"}
                          </Badge>
                        </Col>
                        <Col xs="4" md="2" className="text-end">
                          <span className={`expand-icon ${expandedOrderId === order.id ? 'expanded' : ''}`}>
                            ▼
                          </span>
                        </Col>
                      </Row>
                    </div>

                    {expandedOrderId === order.id && (
                      <div className="order-details">
                        <h6 className="section-title mb-3">Order Details</h6>
                        <div className="row">
                          {Object.values(order.orderItems).map((item: OrderItemsModel, idx) => {
                            const status = item?.status ?? {};
                            const statusKey = Object.keys(status).find((key) => status[key]) ?? "Pending";

                            return (
                              <div key={idx} className="col-12 mb-3">
                                <div className="product-item d-flex align-items-center">
                                  <div className="me-3">
                                    <img
                                      src={item.url || item.orderKitItems?.[0]?.img?.[0] || "/images/product-sidebar/001.jpg"}
                                      alt={item.name}
                                      className="product-image"
                                    />
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="row">
                                      <div className="col-md-4">
                                        <h6 className="mb-1">{item.name}</h6>
                                        <p className="text-muted mb-1">{item.categoryName || "N/A"}</p>
                                      </div>
                                      <div className="col-md-2 text-center">
                                        <strong>₹{item.choosedPrice?.toFixed(2) ?? "0.00"}</strong>
                                      </div>
                                      <div className="col-md-2 text-center">
                                        <span className="badge bg-light text-dark">Qty: {item.cartItemCount}</span>
                                      </div>
                                      <div className="col-md-4 text-end">
                                        <Badge color={getStatusColor(statusKey)}>
                                          {statusKey}
                                        </Badge>
                                        {status.deliver && (
                                          <div className="text-muted small mt-1">
                                            Delivered: {new Date(status.deliver).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default OrderHistoryPage;