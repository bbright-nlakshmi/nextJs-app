"use client";
import React from "react";
import { Row, Col, Card, CardBody, Badge, Button } from "reactstrap";
import { OrderModel } from "@/app/models/order/order";

interface DashboardStatsProps {
  userName: string;
  userEmail: string;
  userPhone: string;
  orders: OrderModel[];
  enrichedWishlistCount: number;
  formatDate: (d: string) => string;
  getStatusColor: (s: string) => string;
  symbol: string;
  setActiveTab: (tab: "orders" | "account") => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  userName,
  userEmail,
    userPhone,
  orders,
  enrichedWishlistCount,
  formatDate,
  getStatusColor,
  symbol,
  setActiveTab,
}) => {
  return (
    <div>
      <div className="dashboard-page-title dashboard-mb-4">
        <h2>Dashboard</h2>
        <p className="dashboard-text-muted">Welcome back, {userName || "User"}!</p>
      </div>

      {/* Stats Cards */}
      <Row className="dashboard-mb-4">
        {[
          {
            icon: "fa-shopping-bag",
            count: orders.length,
            label: "Total Orders",
          },
          {
            icon: "fa-check-circle",
            count: orders.filter(
              (order) =>
                order.orderAcceptStatus?.toLowerCase() === "delivered"
            ).length,
            label: "Delivered Orders",
          },
          {
            icon: "fa-heart",
            count: enrichedWishlistCount,
            label: "Wishlist Items",
          },
        ].map((stat, idx) => (
          <Col md="4" className="dashboard-mb-4" key={idx}>
            <Card className="dashboard-text-center dashboard-shadow-sm dashboard-stat-card">
              <CardBody>
                <i
                  className={`fa ${stat.icon} fa-3x dashboard-mb-3 dashboard-primary-color`}
                />
                <h3 className="dashboard-fw-bold dashboard-section-title">
                  {stat.count}
                </h3>
                <p className="dashboard-text-muted dashboard-mb-0">
                  {stat.label}
                </p>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Orders + Account Summary */}
      <Row>
        <Col md="6" className="dashboard-mb-4">
          <Card className="dashboard-shadow-sm dashboard-h-100">
            <CardBody>
              <h5 className="dashboard-mb-3">Recent Orders</h5>
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-py-3 dashboard-border-bottom"
                >
                  <div>
                    <p className="dashboard-mb-1 dashboard-fw-bold">Order #{order.id}</p>
                    <small className="dashboard-text-muted">
                      {formatDate(order.creationTime)}
                    </small>
                  </div>
                  <div className="dashboard-text-end">
                    <p className="dashboard-mb-1 dashboard-fw-bold dashboard-primary-color">
                      {symbol}
                      {order.finalOrderTotal.toFixed(2)}
                    </p>
                    <Badge
                      color={getStatusColor(order.orderAcceptStatus || "Pending")}
                    >
                      {order.orderAcceptStatus || "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="dashboard-text-muted dashboard-text-center dashboard-py-3">
                  No orders found
                </p>
              )}
              <div className="dashboard-text-center dashboard-mt-3">
                <Button
                  color="outline-primary"
                  onClick={() => setActiveTab("orders")}
                  className="dashboard-btn-action"
                >
                  View All Orders
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md="6" className="dashboard-mb-4">
          <Card className="dashboard-shadow-sm dashboard-h-100">
            <CardBody>
              <h5 className="dashboard-mb-3">Account Summary</h5>
              <div className="dashboard-py-2">
                <p className="dashboard-mb-2">
                  <strong>Name:</strong> {userName || "Not provided"}
                </p>
                <p className="dashboard-mb-2">
                        <strong>Email:</strong> {userEmail || "Not provided"}
                      </p>
                      <p className="dashboard-mb-2">
                        <strong>Phone:</strong> {userPhone || "Not provided"}
                      </p>
              </div>
              <div className="dashboard-text-center dashboard-mt-3">
                <Button
                  color="outline-primary"
                  onClick={() => setActiveTab("account")}
                  className="dashboard-btn-action"
                >
                  Edit Profile
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardStats;
