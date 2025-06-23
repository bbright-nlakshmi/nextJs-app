"use client";

import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Row, Col, Spinner } from "reactstrap";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import { API } from "@/app/services/api.service";

interface OrderData {
  order_no: string;
  product_name: string;
  product_image: string;
  price: number;
  size: string;
  quantity: number;
  status: string;
  delivered_date?: string;
  phone_number: string;
}

const OrderHistoryPage: NextPage = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const phoneNumber = "9876543210"; // Replace with actual phone number

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const rawOrders = await API.getOrders(phoneNumber);
        console.log("📦 Orders fetched:", rawOrders); // <-- Debug log

        const transformed: OrderData[] = rawOrders.map((order: any) => ({
          order_no: order.order_no ?? order.id ?? "N/A",
          product_name: order.product_name ?? order.name ?? "Unknown Product",
          product_image: order.product_image ?? order.image_url ?? "",
          price: typeof order.price === "number" ? order.price : Number(order.amount) || 0,
          size: order.size || "-",
          quantity: order.quantity ?? order.qty ?? 1,
          status: order.status || "Pending",
          delivered_date: order.delivered_date ?? order.delivery_date,
          phone_number: order.phone_number ?? order.phone ?? phoneNumber,
        }));

        setOrders(transformed);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setError("Could not load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [phoneNumber]);

  return (
    <div className="bg-light py-4">
      <Breadcrumb title="Order History" parent="Home" />
      <section className="order-history-section">
        <div className="container">
          <Row>
            <Col sm="12">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                </div>
              ) : error ? (
                <div className="text-center py-5 text-danger">{error}</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5">
                  <h4 className="mb-3">No orders found</h4>
                  <a href="/" className="btn btn-primary">
                    Keep Shopping
                  </a>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="thead-dark">
                      <tr>
                        <th>Product</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Details</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <tr key={index}>
                          <td style={{ width: 100 }}>
                            <img
                              src={order.product_image || "/images/product-sidebar/001.jpg"}
                              alt="product"
                              className="img-fluid"
                              style={{ maxWidth: "80px", objectFit: "contain" }}
                            />
                          </td>
                          <td>
                            <strong>Order No:</strong>{" "}
                            <span className="text-dark">{order.order_no}</span>
                            <br />
                            <span>{order.product_name}</span>
                          </td>
                          <td>
                            <strong>${order.price.toFixed(2)}</strong>
                          </td>
                          <td>
                            <div>
                              <small>Size: {order.size}</small>
                              <br />
                              <small>Quantity: {order.quantity}</small>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-info">{order.status}</span>
                            {order.delivered_date && (
                              <div className="text-muted small">
                                Delivered: {order.delivered_date}
                              </div>
                            )}
                          </td>
                        </tr>
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
