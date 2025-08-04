"use client";

import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { NextPage } from "next";
import {
  Row, Col, Container, Spinner, Input, FormGroup, Label, Button,
  Card, CardBody, Badge, Table, Toast, ToastHeader, ToastBody
} from "reactstrap";
import Link from "next/link";
import Breadcrumb from "../../Containers/Breadcrumb";
import { API } from "@/app/services/api.service";
import { OrderModel } from "@/app/models/order/order";
import { OrderItemsModel } from "@/app/models/order_item_model/order_item_model";
import { useWishlistStore } from "../../../helpers/wishlist/wishlistStore";
import { CartContext } from "../../../helpers/cart/cart.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController } from "@/app/globalProvider";


interface UserInfo {
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
}

interface EnrichedWishlistItem {
  productId: string;
  title: string;
  img: string[];
  price: number;
  stock: number;
  cartItemId?: string;
  key?: string;
  id?: string;
  purchaseOptionStr?: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

// Profile Avatar Component
const ProfileAvatar: React.FC<{ name: string; size?: number }> = ({ name, size = 80 }) => {
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <div 
      className="profile-avatar d-flex align-items-center justify-content-center"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#00baf2',
        color: 'white',
        fontSize: size * 0.4,
        fontWeight: '600',
        border: '3px solid #e9ecef'
      }}
    >
      {initial}
    </div>
  );
};

const Dashboard: NextPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // User Info State
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "MARK JECNO",
    email: "MARK-JECNO@gmail.com",
    phone: "7671985191",
    billingAddress: "",
    shippingAddress: ""
  });
  const [editingUser, setEditingUser] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  
  // Order States
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Wishlist Integration
  const { wishlistItems, removeFromWish } = useWishlistStore();
  const { addToCart } = useContext(CartContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [enrichedWishlistData, setEnrichedWishlistData] = useState<EnrichedWishlistItem[]>([]);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Functions
  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Utility functions
  const getProductById = useCallback((productId: string): any => {
    if (!productId) return null;
    try {
      if (searchController?.allProducts instanceof Map) {
        for (const products of searchController.allProducts.values()) {
          if (Array.isArray(products)) {
            const product = products.find((p: any) => p?.id === productId);
            if (product) return product;
          }
        }
      }
      if (searchController?.kits && Array.isArray(searchController.kits)) {
        const kitRaw = searchController.kits.find((k: any) => k?.id === productId);
        if (kitRaw) return kitRaw;
      }
      return searchController?.getDetails?.(productId, "wishlist") || null;
    } catch (error) {
      console.error("Error finding product:", error);
      return null;
    }
  }, []);

  const getPrice = useCallback((item: EnrichedWishlistItem): number => {
    if (!item) return 0;
    try {
      const product = getProductById(item.productId);
      if (product?.getPrice && typeof product.getPrice === "function") {
        try {
          const price = product.getPrice({ cartQuantity: 1, purchaseOptionStr: item.purchaseOptionStr || "" });
          if (typeof price === 'number' && !isNaN(price) && price > 0) return price;
        } catch (methodError) {
          console.warn("Product getPrice method failed:", methodError);
        }
      }
      
      const extractPrice = (obj: any): number => {
        if (!obj || typeof obj !== 'object') return 0;
        const priceFields = ['price', 'kitPrice', 'discountPrice', 'salePrice', 'finalPrice'];
        for (const field of priceFields) {
          if (field in obj && typeof obj[field] === 'number' && obj[field] > 0) return obj[field];
        }
        return 0;
      };

      return extractPrice(product) || extractPrice(item) || item.price || 0;
    } catch (err) {
      console.error("Price extraction error:", err);
      return item.price || 0;
    }
  }, [getProductById]);

  const saveUserInfo = useCallback((newInfo: UserInfo) => {
    setUserInfo(newInfo);
    localStorage.setItem('userInfo', JSON.stringify(newInfo));
  }, []);

  const formatDate = useCallback((dateStr: string) => 
    new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), []);

  const getStatusColor = useCallback((status: string) => {
    const colors = { delivered: 'success', pending: 'warning', processing: 'info', cancelled: 'danger' };
    return colors[status?.toLowerCase()] || 'secondary';
  }, []);

  // Effects
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        setUserInfo(prev => ({ ...prev, ...JSON.parse(storedUser) }));
      } catch (error) {
        console.error("Error parsing stored user info:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    const enrichedData = wishlistItems.map((item) => {
      const found = item.productId ? getProductById(item.productId) : null;
      const enriched = found && typeof found === "object" ? found : {};
      return {
        ...item,
        title: enriched.title || enriched.name || item.title || item.name || "Unnamed Product",
        img: enriched.img || enriched.images || item.img || [""],
        price: item.price || 0,
        stock: enriched.stock ?? enriched.quantity ?? item.stock ?? 0,
      } as EnrichedWishlistItem;
    });
    setEnrichedWishlistData(enrichedData);
  }, [wishlistItems, getProductById]);

  // Handlers
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await API.getOrders(userInfo.phone);
      fetchedOrders.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
    } catch (err) {
      setError("Could not load your orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = useCallback(() => {
    if (!fromDate || !toDate) {
      alert("Please select both dates");
      return;
    }
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.creationTime);
      return orderDate >= new Date(fromDate) && orderDate <= new Date(toDate);
    });
    setFilteredOrders(filtered);
  }, [orders, fromDate, toDate]);

  const handleUserEdit = useCallback((field: string, value: string) => {
    const newInfo = { ...userInfo, [field]: value };
    saveUserInfo(newInfo);
  }, [userInfo, saveUserInfo]);

  const handleAddToCart = useCallback((item: any) => {
    addToCart(item);
    removeFromWish(item);
    showToast('success', 'Added to Cart', `${item.title} has been added to your cart and removed from wishlist.`);
  }, [addToCart, removeFromWish, showToast]);

  const handleRemoveFromWishlist = useCallback((item: any) => {
    removeFromWish(item);
    showToast('info', 'Item Removed', `${item.title} has been removed from your wishlist.`);
  }, [removeFromWish, showToast]);

  const stats = useMemo(() => ({
    totalOrders: orders.length,
    deliveredOrders: orders.filter(order => order.orderAcceptStatus?.toLowerCase() === 'delivered').length,
    wishlistItems: enrichedWishlistData.length
  }), [orders, enrichedWishlistData]);

  // Render functions
  const renderWishlistItem = (item: EnrichedWishlistItem, isMobile = false) => {
    const price = getPrice(item);
    const itemKey = item.cartItemId || item.key || item.id || item.productId || Math.random().toString();

    if (isMobile) {
      return (
        <Card key={itemKey} className="mb-3 shadow-sm">
          <CardBody>
            <div className="row align-items-center mb-3">
              <div className="col-3">
                <img 
                  src={item.img?.[0] || "/static/images/placeholder.png"} 
                  alt="wishlist" 
                  className="img-fluid rounded"
                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                />
              </div>
              <div className="col-6">
                <h6 className="mb-1">{item.title}</h6>
                <p className="mb-0 small" style={{ color: '#00baf2', fontWeight: 'bold' }}>
                  {symbol}{(price * value).toFixed(2)}
                </p>
              </div>
              <div className="col-3 text-right">
                <small style={{ color: (item.stock ?? 0) > 0 ? '#28a745' : '#dc3545' }}>
                  {(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                </small>
              </div>
            </div>
            <div className="action-button-group justify-content-center">
              <Button
                color="outline-danger"
                size="sm"
                onClick={() => handleRemoveFromWishlist(item)}
                className="btn-action-sm"
              >
                <i className="ti-close me-1"></i>Remove
              </Button>
              <Button
                color="outline-success"
                size="sm"
                onClick={() => handleAddToCart(item)}
                disabled={(item.stock ?? 0) <= 0}
                className="btn-action-sm"
              >
                <i className="ti-shopping-cart me-1"></i>Add to Cart
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    return (
      <tr key={itemKey}>
        <td className="text-center p-3">
          <img 
            src={item.img?.[0] || "/static/images/placeholder.png"} 
            alt="wishlist" 
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '8px' }} 
          />
        </td>
        <td className="p-3">{item.title}</td>
        <td className="text-center p-3" style={{ fontWeight: '600', color: '#333' }}>
          {symbol}{(price * value).toFixed(2)}
        </td>
        <td className="text-center p-3" style={{ color: (item.stock ?? 0) > 0 ? '#28a745' : '#dc3545', fontWeight: '500' }}>
          {(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
        </td>
        <td className="text-center p-3">
          <div className="action-button-group">
            <Button
              color="outline-danger"
              size="sm"
              onClick={() => handleRemoveFromWishlist(item)}
              className="btn-action-sm"
            >
              <i className="ti-close"></i>
            </Button>
            <Button
              color="outline-success"
              size="sm"
              onClick={() => handleAddToCart(item)}
              disabled={(item.stock ?? 0) <= 0}
              className="btn-action-sm"
            >
              <i className="ti-shopping-cart"></i>
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  const renderDashboardContent = () => {
    switch (activeTab) {
      case "wishlist":
        return (
          <div>
            <div className="page-title mb-4">
              <h2>My Wishlist</h2>
              <p className="text-muted">Manage your saved items</p>
            </div>

            {enrichedWishlistData.length > 0 ? (
              <>
                <div className="d-none d-lg-block">
                  <Card className="shadow-sm">
                    <CardBody className="p-0">
                      <Table responsive className="mb-0">
                        <thead>
                          <tr className="table-head">
                            <th className="text-center p-3">Image</th>
                            <th className="p-3">Product Name</th>
                            <th className="text-center p-3">Price</th>
                            <th className="text-center p-3">Availability</th>
                            <th className="text-center p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrichedWishlistData.map(item => renderWishlistItem(item))}
                        </tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </div>

                <div className="d-block d-lg-none">
                  {enrichedWishlistData.map(item => renderWishlistItem(item, true))}
                </div>

                <div className="row cart-buttons mt-4">
                  <div className="col-12">
                    <div className="d-flex justify-content-between flex-wrap gap-3">
                      <Link href="/">
                        <Button color="outline-primary" size="lg" className="btn-primary-custom">
                          <i className="fa fa-arrow-left me-2"></i>Continue Shopping
                        </Button>
                      </Link>
                      <Link href="/pages/account/checkout">
                        <Button color="primary" size="lg" className="btn-primary-custom">
                          Check Out<i className="fa fa-arrow-right ms-2"></i>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Card className="shadow-sm">
                <CardBody className="text-center py-5">
                  <i className="fa fa-heart fa-5x mb-4" style={{ color: '#00baf2' }}></i>
                  <h3 className="mb-3"><strong>Your wishlist is Empty</strong></h3>
                  <p className="text-muted mb-4">Explore more and shortlist some items.</p>
                  <Link href="/">
                    <Button color="primary" className="btn-primary-custom">
                      <i className="fa fa-shopping-cart me-2"></i>Start Shopping
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            )}
          </div>
        );

      case "orders":
        return (
          <div>
            <div className="page-title mb-4">
              <h2>My Orders</h2>
              <p className="text-muted">Track your order history</p>
            </div>

            <Card className="mb-4 shadow-sm">
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
                    <div className="mt-4">
                      <div className="action-button-group">
                        <Button color="primary" onClick={handleFilter} className="btn-primary-custom">
                          Filter
                        </Button>
                        <Button color="secondary" onClick={() => { setFromDate(""); setToDate(""); setFilteredOrders(orders); }} className="btn-secondary-custom">
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {loading ? (
              <div className="text-center py-5">
                <Spinner size="lg" color="primary" />
                <p className="mt-3">Loading orders...</p>
              </div>
            ) : error ? (
              <Card className="shadow-sm">
                <CardBody className="text-center py-5">
                  <h5 className="text-danger">{error}</h5>
                  <Button color="primary" onClick={fetchOrders} className="btn-primary-custom">Try Again</Button>
                </CardBody>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="shadow-sm">
                <CardBody className="text-center py-5">
                  <i className="fa fa-shopping-bag fa-5x mb-4" style={{ color: '#00baf2' }}></i>
                  <h5>No orders found</h5>
                  <p>You haven't placed any orders yet</p>
                </CardBody>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="mb-3 shadow-sm">
                  <CardBody>
                    <div 
                      className="d-flex justify-content-between align-items-center cursor-pointer"
                      onClick={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                    >
                      <div>
                        <h6 className="mb-1">Order #{order.id}</h6>
                        <small className="text-muted">{formatDate(order.creationTime)}</small>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="text-center">
                          <strong style={{ color: '#00baf2' }}>{Object.keys(order.orderItems).length}</strong>
                          <div><small>Items</small></div>
                        </div>
                        <div className="text-center">
                          <strong style={{ color: '#00baf2' }}>₹{order.finalOrderTotal.toFixed(2)}</strong>
                          <div><small>Total</small></div>
                        </div>
                        <Badge color={getStatusColor(order.orderAcceptStatus || "Pending")}>
                          {order.orderAcceptStatus || "Pending"}
                        </Badge>
                        <i className={`fa ${expandedOrderId === order.id ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: '#00baf2' }}></i>
                      </div>
                    </div>

                    {expandedOrderId === order.id && (
                      <div className="mt-3 pt-3 border-top">
                        <h6>Order Details</h6>
                        {Object.values(order.orderItems).map((item: OrderItemsModel, idx) => (
                          <div key={idx} className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                            <img
                              src={item.url || "/images/placeholder.png"}
                              alt={item.name}
                              style={{ width: 60, height: 60, objectFit: 'cover' }}
                              className="me-3 rounded"
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{item.name}</h6>
                              <p className="text-muted mb-0">{item.categoryName || "N/A"}</p>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold" style={{ color: '#00baf2' }}>₹{item.choosedPrice?.toFixed(2) ?? "0.00"}</div>
                              <small>Qty: {item.cartItemCount}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        );

      case "account":
        return (
          <div>
            <div className="page-title mb-4">
              <h2>Account Information</h2>
              <p className="text-muted">Manage your personal details and addresses</p>
            </div>
            
            {/* Contact Information Section */}
            <Card className="shadow-sm mb-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="mb-1" style={{ color: '#333', fontWeight: '600' }}>
                      <i className="fa fa-user me-2" style={{ color: '#00baf2' }}></i>
                      Contact Information
                    </h5>
                    <p className="text-muted mb-0 small">Keep your contact details up to date</p>
                  </div>
                  <Button 
                    color={editingUser ? "success" : "primary"}
                    size="sm" 
                    onClick={() => setEditingUser(!editingUser)}
                    className={editingUser ? "btn-success-custom-sm" : "btn-primary-custom-sm"}
                  >
                    <i className={`fa ${editingUser ? 'fa-check' : 'fa-edit'} me-1`}></i>
                    {editingUser ? 'Save' : 'Edit'}
                  </Button>
                </div>
                
                {editingUser ? (
                  <Row>
                    <Col md="6">
                      <FormGroup className="mb-3">
                        <Label className="form-label">
                          <i className="fa fa-user me-2 text-muted"></i>Full Name
                        </Label>
                        <Input 
                          type="text" 
                          value={userInfo.name} 
                          onChange={(e) => handleUserEdit('name', e.target.value)}
                          className="form-control-custom"
                          placeholder="Enter your full name"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup className="mb-3">
                        <Label className="form-label">
                          <i className="fa fa-envelope me-2 text-muted"></i>Email Address
                        </Label>
                        <Input 
                          type="email" 
                          value={userInfo.email} 
                          onChange={(e) => handleUserEdit('email', e.target.value)}
                          className="form-control-custom"
                          placeholder="Enter your email address"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup className="mb-3">
                        <Label className="form-label">
                          <i className="fa fa-phone me-2 text-muted"></i>Phone Number
                        </Label>
                        <Input 
                          type="text" 
                          value={userInfo.phone} 
                          onChange={(e) => handleUserEdit('phone', e.target.value)}
                          className="form-control-custom"
                          placeholder="Enter your phone number"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                ) : (
                  <Row>
                    <Col md="4">
                      <div className="info-item mb-3">
                        <div className="info-label">
                          <i className="fa fa-user me-2" style={{ color: '#00baf2' }}></i>
                          <strong>Name</strong>
                        </div>
                        <div className="info-value">{userInfo.name}</div>
                      </div>
                    </Col>
                    <Col md="4">
                      <div className="info-item mb-3">
                        <div className="info-label">
                          <i className="fa fa-envelope me-2" style={{ color: '#00baf2' }}></i>
                          <strong>Email</strong>
                        </div>
                        <div className="info-value">{userInfo.email}</div>
                      </div>
                    </Col>
                    <Col md="4">
                      <div className="info-item mb-3">
                        <div className="info-label">
                          <i className="fa fa-phone me-2" style={{ color: '#00baf2' }}></i>
                          <strong>Phone</strong>
                        </div>
                        <div className="info-value">{userInfo.phone}</div>
                      </div>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>

            {/* Address Information Section */}
            <Card className="shadow-sm">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="mb-1" style={{ color: '#333', fontWeight: '600' }}>
                      <i className="fa fa-map-marker me-2" style={{ color: '#00baf2' }}></i>
                      Address Information
                    </h5>
                    <p className="text-muted mb-0 small">Manage your billing and shipping addresses</p>
                  </div>
                  <Button 
                    color={editingAddress ? "success" : "primary"}
                    size="sm" 
                    onClick={() => setEditingAddress(!editingAddress)}
                    className={editingAddress ? "btn-success-custom-sm" : "btn-primary-custom-sm"}
                  >
                    <i className={`fa ${editingAddress ? 'fa-check' : 'fa-edit'} me-1`}></i>
                    {editingAddress ? 'Save' : 'Edit'}
                  </Button>
                </div>
                
                {editingAddress ? (
                  <Row>
                    <Col md="6">
                      <FormGroup className="mb-3">
                        <Label className="form-label">
                          <i className="fa fa-credit-card me-2 text-muted"></i>Billing Address
                        </Label>
                        <Input
                          type="textarea"
                          rows="4"
                          value={userInfo.billingAddress}
                          onChange={(e) => handleUserEdit('billingAddress', e.target.value)}
                          placeholder="Enter your billing address"
                          className="form-control-custom"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup className="mb-3">
                        <Label className="form-label">
                          <i className="fa fa-truck me-2 text-muted"></i>Shipping Address
                        </Label>
                        <Input
                          type="textarea"
                          rows="4"
                          value={userInfo.shippingAddress}
                          onChange={(e) => handleUserEdit('shippingAddress', e.target.value)}
                          placeholder="Enter your shipping address"
                          className="form-control-custom"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                ) : (
                  <Row>
                    <Col md="6">
                      <div className="address-card">
                        <div className="address-header">
                          <i className="fa fa-credit-card me-2" style={{ color: '#00baf2' }}></i>
                          <strong>Billing Address</strong>
                        </div>
                        <div className="address-content">
                          {userInfo.billingAddress || (
                            <span className="text-muted">
                              <i className="fa fa-plus-circle me-2"></i>
                              No billing address added yet
                            </span>
                          )}