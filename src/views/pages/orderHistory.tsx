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
  Button
} from "reactstrap";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import { API } from "@/app/services/api.service";
import { OrderModel } from "@/app/models/order_model/order";
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

  return (
    <div className="bg-light py-4">
      <Breadcrumb title="Order History" parent="Home" />

      <section className="order-history-section">
        <div className="container">
          {/* Filter Section */}
          <div className="bg-white p-3 rounded shadow-sm mb-4">
            <Row>
              <Col md="4">
                <FormGroup>
                  <Label className="fw-semibold">From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label className="fw-semibold">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="4" className="d-flex align-items-end justify-content-start gap-2">
                <Button color="primary" onClick={handleFilter}>
                  Apply Filter
                </Button>
                <Button color="outline-secondary" onClick={handleClearFilter}>
                  Clear
                </Button>
              </Col>
            </Row>
          </div>

          {/* Orders Table Section */}
          <Row>
            <Col sm="12">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                </div>
              ) : error ? (
                <div className="text-center text-danger py-5">
                  <h5>{error}</h5>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No orders found for selected date</h5>
                  <Button color="primary" onClick={handleClearFilter}>Show All Orders</Button>
                </div>
              ) : (
                <div className="table-responsive rounded shadow-sm bg-white">
                  <table className="table table-hover table-bordered mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Total Items</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr
                            onClick={() => toggleExpand(order.id)}
                            style={{
                              cursor: "pointer",
                              background: expandedOrderId === order.id ? "#f1f3f5" : undefined,
                              transition: "background 0.2s ease-in-out",
                            }}
                          >
                            <td><strong>{order.id}</strong></td>
                            <td>{formatDate(order.creationTime)}</td>
                            <td>{order.getItemsCount()}</td>
                            <td><strong>₹{order.finalOrderTotal.toFixed(2)}</strong></td>
                            <td className="text-capitalize">{order.orderAcceptStatus || "Pending"}</td>
                          </tr>

                          {expandedOrderId === order.id && (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <div className="p-3 bg-white border-top">
                                  <h6 className="mb-3 fw-semibold">Order Details</h6>
                                  <table className="table table-sm table-striped">
                                    <thead>
                                      <tr>
                                        <th>Image</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Qty</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.values(order.orderItems).map((item: OrderItemsModel, idx) => {
                                        const status = item?.status ?? {};
                                        const statusKey = Object.keys(status).find(key => status[key]) ?? "Pending";

                                        return (
                                          <tr key={idx}>
                                            <td style={{ width: "80px" }}>
                                              <img
                                                src={item.url || item.orderKitItems?.[0]?.img?.[0] || "/images/product-sidebar/001.jpg"}
                                                alt={item.name}
                                                className="img-fluid rounded"
                                                style={{ maxWidth: "70px", objectFit: "contain" }}
                                              />
                                            </td>
                                            <td>{item.name}</td>
                                            <td>{item.categoryName || "N/A"}</td>
                                            <td>₹{item.choosedPrice?.toFixed(2) ?? "0.00"}</td>
                                            <td>{item.cartItemCount}</td>
                                            <td className="text-capitalize">
                                              {statusKey}
                                              {status.deliver && (
                                                <div className="text-muted small">
                                                  Delivered on {new Date(status.deliver).toLocaleDateString()}
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
};

export default OrderHistoryPage;
