"use client";
import React from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
  Badge,
} from "reactstrap";
import { OrderModel } from "@/app/models/order/order";
import { OrderItemsModel } from "@/app/models/order_item_model/order_item_model";

interface OrdersListProps {
  orders: OrderModel[];
  filteredOrders: OrderModel[];
  loading: boolean;
  error: string | null;
  fromDate: string;
  toDate: string;
  expandedOrderId: string | null;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  setFilteredOrders: (orders: OrderModel[]) => void;
  setExpandedOrderId: (id: string | null) => void;
  handleFilter: () => void;
  formatDate: (d: string) => string;
  getStatusColor: (s: string) => string;
  symbol: string;
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  filteredOrders,
  loading,
  error,
  fromDate,
  toDate,
  expandedOrderId,
  setFromDate,
  setToDate,
  setFilteredOrders,
  setExpandedOrderId,
  handleFilter,
  formatDate,
  getStatusColor,
  symbol,
}) => {
  return (
    <div>
      <div className="dashboard-page-title dashboard-mb-4">
        <h2>My Orders</h2>
        <p className="dashboard-text-muted">Track your order history</p>
      </div>
      <Card className="dashboard-mb-4 dashboard-shadow-sm">
        <CardBody>
          <h5>Filter Orders</h5>
          <Row>
            <Col md="4">
              <FormGroup>
                <Label>From Date</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>To Date</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </FormGroup>
            </Col>
            <Col md="4">
              <div className="dashboard-mt-4">
                <div className="dashboard-action-button-group">
                  <Button
                    color="primary"
                    onClick={handleFilter}
                    className="dashboard-btn-primary-custom"
                  >
                    Filter
                  </Button>
                  <Button
                    color="secondary"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setFilteredOrders(orders);
                    }}
                    className="dashboard-btn-secondary-custom"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {loading ? (
        <div className="dashboard-text-center dashboard-py-5">
          <Spinner size="lg" color="primary" />
          <p className="dashboard-mt-3">Loading orders...</p>
        </div>
      ) : error ? (
        <Card className="dashboard-shadow-sm">
          <CardBody className="dashboard-text-center dashboard-py-5">
            <h5 className="dashboard-text-danger">{error}</h5>
            <Button
              color="primary"
              onClick={() => window.location.reload()}
              className="dashboard-btn-primary-custom"
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="dashboard-shadow-sm">
          <CardBody className="dashboard-text-center dashboard-py-5">
            <i className="fa fa-shopping-bag fa-5x dashboard-mb-4 dashboard-primary-color" />
            <h5>No orders found</h5>
            <p>You haven't placed any orders yet</p>
          </CardBody>
        </Card>
      ) : (
        <div className="dashboard-orders-scroll">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="dashboard-mb-3 dashboard-shadow-sm">
              <CardBody>
                <div
                  className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-cursor-pointer"
                  onClick={() =>
                    setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                  }
                >
                  <div>
                    <h6 className="dashboard-mb-1">Order #{order.id}</h6>
                    <small className="dashboard-text-muted">{formatDate(order.creationTime)}</small>
                  </div>
                  <div className="dashboard-flex dashboard-align-items-center dashboard-gap-3">
                    <div className="dashboard-text-center">
                      <strong className="dashboard-primary-color">
                        {Object.keys(order.orderItems).length}
                      </strong>
                      <div>
                        <small>Items</small>
                      </div>
                    </div>
                    <div className="dashboard-text-center">
                      <strong className="dashboard-primary-color">
                        {symbol}
                        {order.finalOrderTotal.toFixed(2)}
                      </strong>
                      <div>
                        <small>Total</small>
                      </div>
                    </div>
                    <Badge color={getStatusColor(order.orderAcceptStatus || "Pending")}>
                      {order.orderAcceptStatus || "Pending"}
                    </Badge>
                    <i
                      className={`fa ${
                        expandedOrderId === order.id ? "fa-chevron-up" : "fa-chevron-down"
                      } dashboard-primary-color`}
                    />
                  </div>
                </div>
                {expandedOrderId === order.id && (
                  <div className="dashboard-mt-3 dashboard-pt-3 dashboard-border-top">
                    <h6>Order Details</h6>
                    {Object.values(order.orderItems || {}).map((item: any) => {
                      const normalizedItem: OrderItemsModel = {
                        ...item,
                        saleQuantity: Number(item.saleQuantity ?? 0), // ensure it's number
                      };

                      return (
                        <div
                          key={normalizedItem.id}
                          className="dashboard-flex dashboard-align-items-center dashboard-mb-3 dashboard-p-3 dashboard-bg-light dashboard-rounded"
                        >
                          <img
                            src={normalizedItem.url || "/images/placeholder.png"}
                            alt={normalizedItem.name || "Product"}
                            className="dashboard-me-3 dashboard-rounded dashboard-order-item-img"
                          />
                          <div className="dashboard-flex-grow-1">
                            <h6 className="dashboard-mb-1">{normalizedItem.name || "Unnamed Product"}</h6>
                            <p className="dashboard-text-muted dashboard-mb-0">
                              {normalizedItem.categoryName || "N/A"}
                            </p>
                          </div>
                          <div className="dashboard-text-end">
                            <div className="dashboard-fw-bold dashboard-primary-color">
                              {symbol}
                              {normalizedItem.choosedPrice?.toFixed(2) ?? "0.00"}
                            </div>
                            <small>Qty: {normalizedItem.cartItemCount ?? 0}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
