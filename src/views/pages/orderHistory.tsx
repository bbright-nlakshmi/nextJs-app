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

  const phoneNumber = "9346716572";

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
    if (!fromDate || !toDate) return;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.creationTime);
      return orderDate >= from && orderDate <= to;
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
    <>
      <style jsx>{`
        .order-history-section {
          background: #f8f9fa;
          min-height: 100vh;
          padding: 2rem 0;
        }
        
        .filter-card {
          border: none;
          box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          background: white;
          margin-bottom: 3rem;
          overflow: hidden;
        }
        
        .filter-section {
          padding: 4rem 3rem;
          background: white;
          color: #333;
          position: relative;
        }
        
        .filter-content {
          position: relative;
          z-index: 1;
        }
        
        .filter-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 3rem;
          color: #333;
          text-align: center;
        }
        
        .filter-row {
          gap: 2rem;
          align-items: flex-end;
        }
        
        .filter-group {
          margin-bottom: 0;
        }
        
        .filter-label {
          font-weight: 600;
          color: #333;
          margin-bottom: 1rem;
          font-size: 1.3rem;
          display: block;
        }
        
        .form-control {
          border-radius: 12px;
          border: 2px solid #e9ecef;
          padding: 1.2rem 1.5rem;
          font-size: 1.1rem;
          background: white;
          color: #333;
          transition: all 0.3s ease;
          height: 60px;
        }
        
        .form-control:focus {
          border-color: #00BAF2;
          box-shadow: 0 0 0 0.2rem rgba(0, 186, 242, 0.25);
          background: white;
        }
        
        .primary-btn {
          background: #00BAF2;
          border: none;
          border-radius: 12px;
          padding: 1.2rem 3rem;
          font-weight: 600;
          transition: all 0.3s ease;
          color: white;
          font-size: 1.1rem;
          height: 60px;
          min-width: 160px;
        }
        
        .primary-btn:hover {
          background: #0099CC;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 186, 242, 0.4);
        }
        
        .secondary-btn {
          background: white;
          border: 2px solid #e9ecef;
          color: #333;
          border-radius: 12px;
          padding: 1.2rem 3rem;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 1.1rem;
          height: 60px;
          min-width: 160px;
        }
        
        .secondary-btn:hover {
          background: #f8f9fa;
          color: #333;
          transform: translateY(-2px);
          border-color: #00BAF2;
        }
        
        .button-group {
          display: flex;
          gap: 1rem;
          align-items: stretch;
          justify-content: flex-start;
          margin-top: 2.7rem;
        }
        
        .order-card {
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
          overflow: hidden;
          border-left: 4px solid #e9ecef;
        }
        
        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 35px rgba(0, 0, 0, 0.12);
          border-left-color: #00BAF2;
        }
        
        .order-header {
          background: #fff;
          border-bottom: 1px solid #e9ecef;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .order-header:hover {
          background: #f8f9fa;
        }
        
        .order-details {
          padding: 2rem;
          background: #f8f9fa;
        }
        
        .product-item {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }
        
        .product-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border-color: #00BAF2;
        }
        
        .product-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e9ecef;
        }
        
        .expand-icon {
          transition: transform 0.3s ease;
          color: #6c757d;
        }
        
        .expand-icon.expanded {
          transform: rotate(180deg);
          color: #00BAF2;
        }
        
        .page-title {
          color: #2c3e50;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .section-title {
          color: #00BAF2;
          font-weight: 600;
        }
        
        .loading-spinner {
          color: #00BAF2;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }
        
        .empty-state-icon {
          font-size: 4rem;
          color: #6c757d;
          margin-bottom: 1rem;
        }
        
        @media (max-width: 992px) {
          .filter-section {
            padding: 2rem 1.5rem;
          }
          
          .filter-row {
            gap: 1rem;
          }
          
          .button-group {
            flex-direction: column;
            align-items: stretch;
            margin-top: 1rem;
          }
          
          .primary-btn, .secondary-btn {
            width: 100%;
            margin-bottom: 0.5rem;
          }
        }
        
        @media (max-width: 768px) {
          .order-history-section {
            padding: 1rem 0;
          }
          
          .filter-section {
            padding: 2rem 1rem;
          }
          
          .filter-title {
            font-size: 1.5rem;
          }
          
          .order-header {
            padding: 1rem;
          }
          
          .order-details {
            padding: 1rem;
          }
          
          .product-item {
            padding: 1rem;
          }
          
          .product-image {
            width: 60px;
            height: 60px;
          }
          
          .primary-btn, .secondary-btn {
            padding: 0.875rem 1.5rem;
            font-size: 0.875rem;
          }
          
          .form-control {
            font-size: 16px;
          }
        }
        
        @media (max-width: 576px) {
          .product-item {
            flex-direction: column;
            text-align: center;
          }
          
          .product-image {
            margin: 0 auto 1rem;
          }
          
          .filter-section {
            padding: 1.5rem 1rem;
          }
          
          .filter-row {
            flex-direction: column;
          }
          
          .filter-group {
            margin-bottom: 1.5rem;
          }
        }
      `}</style>

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
                  <p>No orders match your selected date range</p>
                  <Button className="primary-btn mt-3" onClick={handleClearFilter}>
                    Show All Orders
                  </Button>
                </div>
              ) : (
                <div>
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
    </>
  );
};

export default OrderHistoryPage;