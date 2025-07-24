import { NextPage } from "next";
import { useState, useEffect } from "react";
import { Col, Container, Row, Spinner, Input, FormGroup, Label, Button, Card, Badge, Table } from "reactstrap";
import Breadcrumb from "../../Containers/Breadcrumb";
import { API } from "@/app/services/api.service";
import { OrderModel } from "@/app/models/order/order";
import { OrderItemsModel } from "@/app/models/order_item_model/order_item_model";
import { useWishlistStore } from "../../../helpers/wishlist/wishlistStore";
import { CartContext } from "../../../helpers/cart/cart.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController } from "@/app/globalProvider";
import { WishlistProduct } from "../../../helpers/wishlist/wishlistStore";
import React from "react";

interface MenuItem {
  id: string;
  title: string;
}

// Enhanced interface for enriched wishlist data
interface EnrichedWishlistItem extends WishlistProduct {
  title: string;
  img: string[];
  price: number;
  stock: number;
}

// User profile interface
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  newsletterSubscriptions: {
    weekly: boolean;
    promotional: boolean;
    productUpdates: boolean;
  };
}

const menuItems: MenuItem[] = [
  { id: "dashboard", title: "Account Info" },
  { id: "addressbook", title: "Address Book" },
  { id: "orders", title: "My Orders" },
  { id: "wishlist", title: "My Wishlist" },
  { id: "newsletter", title: "Newsletter" },
  { id: "account", title: "My Account" },
  { id: "password", title: "Change Password" }
];

const Dashboard: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  
  // Orders state
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderModel[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "MARK",
    lastName: "JECNO",
    email: "MARk-JECNO@gmail.com",
    phone: "7671985191",
    dateOfBirth: "",
    billingAddress: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States"
    },
    shippingAddress: {
      street: "456 Oak Avenue",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11201",
      country: "United States"
    },
    newsletterSubscriptions: {
      weekly: false,
      promotional: true,
      productUpdates: false
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Wishlist state
  const { wishlistItems, removeFromWish } = useWishlistStore();
  const { addToCart } = React.useContext(CartContext);
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [enrichedWishlistData, setEnrichedWishlistData] = useState<EnrichedWishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const phoneNumber = userProfile.phone;

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      // Replace with actual API call
      // const profile = await API.getUserProfile(phoneNumber);
      // setUserProfile(profile);
      
      // Simulated API call - replace with actual implementation
      setTimeout(() => {
        // Keep the existing mock data for now
        setProfileLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileLoading(false);
    }
  };

  // Enhanced product lookup with multiple fallback strategies
  const getProductById = (productId: string): any => {
    if (!productId) return null;

    try {
      // Search in allProducts Map
      if (searchController?.allProducts instanceof Map) {
        for (const products of searchController.allProducts.values()) {
          if (Array.isArray(products)) {
            const product = products.find((p: any) => p?.id === productId);
            if (product) return product;
          }
        }
      }

      // Search in kits array with proper null checks
      if (searchController?.kits && Array.isArray(searchController.kits)) {
        const kitRaw = searchController.kits.find(
          (k: any) => k?.id === productId
        );
        if (kitRaw) {
          return kitRaw;
        }
      }

      // Try getDetails as fallback with required eventName parameter
      const found = searchController?.getDetails
        ? searchController.getDetails(productId, "wishlist")
        : null;
      if (found && typeof found === "object") {
        return found;
      }
    } catch (error) {
      console.error("Error finding product:", error);
    }

    return null;
  };

  // Enhanced price extraction logic
  const extractPriceFromObject = (obj: any): number => {
    if (!obj || typeof obj !== "object") return 0;

    // Check standard price fields first
    if ("price" in obj && typeof obj.price === "number" && obj.price > 0) {
      return obj.price;
    }

    // Check Kit-specific price fields
    if ("kitPrice" in obj && typeof obj.kitPrice === "number" && obj.kitPrice > 0) {
      return obj.kitPrice;
    }

    // Check for discount price (prioritize over original price)
    if (obj.discountPrice && typeof obj.discountPrice === "number" && obj.discountPrice > 0) {
      return obj.discountPrice;
    }

    // Check for sale price
    if (obj.salePrice && typeof obj.salePrice === "number" && obj.salePrice > 0) {
      return obj.salePrice;
    }

    // Check for finalPrice
    if (obj.finalPrice && typeof obj.finalPrice === "number" && obj.finalPrice > 0) {
      return obj.finalPrice;
    }

    // Check for currentPrice
    if (obj.currentPrice && typeof obj.currentPrice === "number" && obj.currentPrice > 0) {
      return obj.currentPrice;
    }

    // Check for sellingPrice
    if (obj.sellingPrice && typeof obj.sellingPrice === "number" && obj.sellingPrice > 0) {
      return obj.sellingPrice;
    }

    return 0;
  };

  // Enhanced enrichment logic for wishlist
  useEffect(() => {
    const enrichWishlistData = async () => {
      setWishlistLoading(true);
      
      const enrichedData = wishlistItems.map((item) => {
        const found = item.productId ? getProductById(item.productId) : null;
        const enriched = found && typeof found === "object" ? found : {};

        // Extract price from found product or fallback to item price
        const productPrice =
          extractPriceFromObject(enriched) ||
          extractPriceFromObject(item) ||
          item.price ||
          0;

        return {
          ...item,
          title:
            enriched.title ||
            enriched.name ||
            item.title ||
            item.name ||
            "Unnamed Product",
          img: enriched.img || enriched.images || item.img || ["/images/product-sidebar/001.jpg"],
          price: productPrice,
          stock: enriched.stock ?? enriched.quantity ?? item.stock ?? 0,
        } as EnrichedWishlistItem;
      });

      setEnrichedWishlistData(enrichedData);
      setWishlistLoading(false);
    };

    enrichWishlistData();
  }, [wishlistItems]);

  // Load user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleMenuClick = (item: MenuItem) => {
    setActiveMenuItem(item.id);
    setIsOpen(false);
    
    // Load orders when orders tab is clicked
    if (item.id === "orders" && orders.length === 0) {
      fetchOrders();
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const fetchedOrders = await API.getOrders(phoneNumber);
      fetchedOrders.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setOrdersError("Could not load your orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

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

    const fromDateTime = new Date(fromDate);
    fromDateTime.setHours(0, 0, 0, 0);

    const toDateTime = new Date(toDate);
    toDateTime.setHours(23, 59, 59, 999);

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

  // Wishlist handlers
  const handleAddToCart = (item: WishlistProduct) => {
    addToCart(item);
    removeFromWish(item);
  };

  const handleRemoveFromWishlist = (item: WishlistProduct) => {
    removeFromWish(item);
  };

  const handleClearWishlist = () => {
    if (window.confirm("Are you sure you want to clear your entire wishlist?")) {
      wishlistItems.forEach(item => removeFromWish(item));
    }
  };

  // Profile update handlers
  const handleProfileUpdate = (updatedProfile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updatedProfile }));
    // Here you would typically make an API call to save the updated profile
    // await API.updateUserProfile(phoneNumber, updatedProfile);
  };

  const renderMainContent = () => {
    switch (activeMenuItem) {
      case "dashboard":
        return (
          <div className="dashboard">
            <div className="page-title">
              <h2>My Dashboard</h2>
            </div>
            <div className="welcome-msg">
              <p>Hello, {userProfile.firstName} {userProfile.lastName}!</p>
              <p>From your My Account Dashboard you have the ability to view a snapshot of your recent account activity and update your account information. Select a link below to view or edit information.</p>
            </div>
            <div className="box-account box-info">
              <div className="box-head">
                <h2>Account Information</h2>
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <div className="box">
                    <div className="box-title">
                      <h3>Contact Information</h3>
                      <a href="#" onClick={(e) => { e.preventDefault(); setActiveMenuItem("account"); }}>Edit</a>
                    </div>
                    <div className="box-content">
                      <h6>{userProfile.firstName} {userProfile.lastName}</h6>
                      <h6>{userProfile.email}</h6>
                      <h6>{userProfile.phone}</h6>
                      <h6>
                        <a href="#" onClick={() => setActiveMenuItem("password")}>Change Password</a>
                      </h6>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="box">
                    <div className="box-title">
                      <h3>Newsletters</h3>
                      <a href="#" onClick={() => setActiveMenuItem("newsletter")}>Edit</a>
                    </div>
                    <div className="box-content">
                      <p>
                        {Object.values(userProfile.newsletterSubscriptions).some(sub => sub) 
                          ? "You are subscribed to newsletter updates." 
                          : "You are currently not subscribed to any newsletter."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="box">
                  <div className="box-title">
                    <h3>Address Book</h3>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveMenuItem("addressbook"); }}>Manage Addresses</a>
                  </div>
                  <div className="row">
                    <div className="col-sm-6">
                      <h6>Default Billing Address</h6>
                      <address>
                        {userProfile.billingAddress ? (
                          <>
                            {userProfile.firstName} {userProfile.lastName}<br />
                            {userProfile.billingAddress.street}<br />
                            {userProfile.billingAddress.city}, {userProfile.billingAddress.state} {userProfile.billingAddress.zipCode}<br />
                            {userProfile.billingAddress.country}<br />
                            Phone: {userProfile.phone}
                          </>
                        ) : (
                          <>
                            You have not set a default billing address.
                            <br />
                          </>
                        )}
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveMenuItem("addressbook"); }}>Edit Address</a>
                      </address>
                    </div>
                    <div className="col-sm-6">
                      <h6>Default Shipping Address</h6>
                      <address>
                        {userProfile.shippingAddress ? (
                          <>
                            {userProfile.firstName} {userProfile.lastName}<br />
                            {userProfile.shippingAddress.street}<br />
                            {userProfile.shippingAddress.city}, {userProfile.shippingAddress.state} {userProfile.shippingAddress.zipCode}<br />
                            {userProfile.shippingAddress.country}<br />
                            Phone: {userProfile.phone}
                          </>
                        ) : (
                          <>
                            You have not set a default shipping address.
                            <br />
                          </>
                        )}
                        <a href="#" onClick={() => handleMenuClick(menuItems.find(item => item.id === "addressbook")!)}>Edit Address</a>
                      </address>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Section */}
              <div className="row mt-4">
                <div className="col-sm-4">
                  <div className="box text-center">
                    <div className="box-content">
                      <h4 className="text-primary">{orders.length}</h4>
                      <p>Total Orders</p>
                      <a href="#" onClick={() => handleMenuClick(menuItems.find(item => item.id === "orders")!)}>
                        View Orders
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="box text-center">
                    <div className="box-content">
                      <h4 className="text-danger">{wishlistItems.length}</h4>
                      <p>Wishlist Items</p>
                      <a href="#" onClick={() => handleMenuClick(menuItems.find(item => item.id === "wishlist")!)}>
                        View Wishlist
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="box text-center">
                    <div className="box-content">
                      <h4 className="text-success">
                        {orders.filter(order => order.orderAcceptStatus?.toLowerCase() === 'delivered').length}
                      </h4>
                      <p>Delivered Orders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "addressbook":
        return (
          <div className="dashboard">
            <div className="page-title">
              <h2>Address Book</h2>
            </div>
            <div className="box-account box-info">
              <div className="box-head">
                <h2>Manage Your Addresses</h2>
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <div className="box">
                    <div className="box-title">
                      <h3>Billing Address</h3>
                      <a href="#" onClick={(e) => { e.preventDefault(); setActiveMenuItem("account"); }}>Edit</a>
                    </div>
                    <div className="box-content">
                      <address>
                        {userProfile.billingAddress ? (
                          <>
                            {userProfile.firstName} {userProfile.lastName}<br />
                            {userProfile.billingAddress.street}<br />
                            {userProfile.billingAddress.city}, {userProfile.billingAddress.state} {userProfile.billingAddress.zipCode}<br />
                            {userProfile.billingAddress.country}<br />
                            Phone: {userProfile.phone}
                          </>
                        ) : (
                          "No billing address set"
                        )}
                      </address>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="box">
                    <div className="box-title">
                      <h3>Shipping Address</h3>
                      <a href="#" onClick={(e) => { e.preventDefault(); setActiveMenuItem("account"); }}>Edit</a>
                    </div>
                    <div className="box-content">
                      <address>
                        {userProfile.shippingAddress ? (
                          <>
                            {userProfile.firstName} {userProfile.lastName}<br />
                            {userProfile.shippingAddress.street}<br />
                            {userProfile.shippingAddress.city}, {userProfile.shippingAddress.state} {userProfile.shippingAddress.zipCode}<br />
                            {userProfile.shippingAddress.country}<br />
                            Phone: {userProfile.phone}
                          </>
                        ) : (
                          "No shipping address set"
                        )}
                      </address>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-3">
                <button className="btn btn-primary me-2" onClick={() => setActiveMenuItem("account")}>
                  Add New Address
                </button>
                <button className="btn btn-outline-secondary">Set Default</button>
              </div>
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="dashboard">
            <div className="page-title">
              <h2>My Orders</h2>
            </div>
            <div className="box-account box-info">
              <div className="box-head">
                <h2>Order History</h2>
              </div>
              
              {/* Enhanced Filter Section */}
              <Card className="filter-card mb-4">
                <div className="filter-section">
                  <div className="filter-content p-3">
                    <h5 className="filter-title mb-3">Filter Your Orders</h5>
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
                        <div className="button-group mt-3">
                          <Button color="primary" className="me-2" onClick={handleFilter}>
                            Apply Filter
                          </Button>
                          <Button color="secondary" onClick={handleClearFilter}>
                            Clear Filter
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Card>

              {/* Orders Content */}
              {ordersLoading ? (
                <div className="text-center py-5">
                  <Spinner size="lg" />
                  <p className="mt-3">Loading your orders...</p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-5">
                  <div className="mb-3">⚠️</div>
                  <h5 className="text-danger">{ordersError}</h5>
                  <Button color="primary" className="mt-3" onClick={fetchOrders}>
                    Try Again
                  </Button>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">📦</div>
                  <h5>No orders found</h5>
                  <p>
                    {fromDate || toDate 
                      ? "No orders match your selected date range" 
                      : "You haven't placed any orders yet"
                    }
                  </p>
                  {(fromDate || toDate) && (
                    <Button color="primary" className="mt-3" onClick={handleClearFilter}>
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
                    <Card key={order.id} className="order-card mb-3">
                      <div 
                        className="order-header p-3"
                        onClick={() => toggleExpand(order.id)}
                        style={{ cursor: 'pointer' }}
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
                        <div className="order-details p-3 border-top">
                          <h6 className="section-title mb-3">Order Details</h6>
                          <div className="row">
                            {Object.values(order.orderItems).map((item: OrderItemsModel, idx) => {
                              const status = item?.status ?? {};
                              const statusKey = Object.keys(status).find((key) => status[key]) ?? "Pending";

                              return (
                                <div key={idx} className="col-12 mb-3">
                                  <div className="product-item d-flex align-items-center p-2 border rounded">
                                    <div className="me-3">
                                      <img
                                        src={item.url || item.orderKitItems?.[0]?.img?.[0] || "/images/product-sidebar/001.jpg"}
                                        alt={item.name}
                                        className="product-image"
                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
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
            </div>
          </div>
        );

      case "wishlist":
        return (
          <div className="dashboard">
            <div className="page-title">
              <h2>My Wishlist</h2>
            </div>
            <div className="box-account box-info">
              <div className="box-head d-flex justify-content-between align-items-center">
                <h2>Saved Items ({enrichedWishlistData.length})</h2>
                {enrichedWishlistData.length > 0 && (
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleClearWishlist}
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {wishlistLoading ? (
                <div className="text-center py-5">
                  <Spinner size="lg" />
                  <p className="mt-3">Loading wishlist...</p>
                </div>
              ) : enrichedWishlistData.length > 0 ? (
                <div className="wishlist-content">
                  {/* Desktop Table View */}
                  <div className="d-none d-lg-block">
                    <div className="table-responsive">
                      <table className="table wishlist-table align-middle">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" className="border-0 py-3">Product</th>
                            <th scope="col" className="border-0 py-3 text-center">Price</th>
                            <th scope="col" className="border-0 py-3 text-center">Stock Status</th>
                            <th scope="col" className="border-0 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrichedWishlistData.map((item, index) => (
                            <tr key={`${item.productId}-${item.variantId ?? index}`} className="wishlist-row">
                              <td className="py-4">
                                <div className="d-flex align-items-center">
                                  <div className="product-image-container me-3">
                                    <img
                                      src={item.img?.[0] || "/images/product-sidebar/001.jpg"}
                                      alt={item.title || "Product"}
                                      className="wishlist-product-img"
                                      onError={(e) => {
                                        e.currentTarget.src = "/images/product-sidebar/001.jpg";
                                      }}
                                    />
                                  </div>
                                  <div className="product-details">
                                    <h6 className="product-name mb-1">{item.title}</h6>
                                    {item.variantId && (
                                      <small className="text-muted d-block">Variant: {item.variantId}</small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="text-center py-4">
                                <div className="price-container">
                                  <span className="current-price fw-bold">
                                    {symbol}{((item.price || 0) * value).toFixed(2)}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center py-4">
                                <span className={`stock-badge ${(item.stock ?? 0) > 0 ? 'stock-in' : 'stock-out'}`}>
                                  {(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                                </span>
                                {(item.stock ?? 0) > 0 && (
                                  <div className="stock-count mt-1">
                                    <small className="text-muted">({item.stock} available)</small>
                                  </div>
                                )}
                              </td>
                              <td className="text-center py-4">
                                <div className="action-buttons-container">
                                  <button
                                    className="btn btn-primary btn-sm me-2"
                                    onClick={() => handleAddToCart(item)}
                                    disabled={(item.stock ?? 0) <= 0}
                                    title={`Add ${item.title} to cart`}
                                  >
                                    <i className="fa fa-cart-plus me-1"></i>
                                    Add to Cart
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleRemoveFromWishlist(item)}
                                    title={`Remove ${item.title} from wishlist`}
                                  >
                                    <i className="fa fa-times me-1"></i>
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tablet View */}
                  <div className="d-none d-md-block d-lg-none">
                    <div className="row">
                      {enrichedWishlistData.map((item, index) => (
                        <div key={`tablet-${item.productId}-${item.variantId ?? index}`} className="col-12 mb-4">
                          <div className="wishlist-card-tablet card">
                            <div className="card-body p-3">
                              <div className="row align-items-center">
                                <div className="col-4">
                                  <div className="product-image-container">
                                    <img
                                      src={item.img?.[0] || "/images/product-sidebar/001.jpg"}
                                      alt={item.title || "Product"}
                                      className="wishlist-product-img-tablet"
                                      onError={(e) => {
                                        e.currentTarget.src = "/images/product-sidebar/001.jpg";
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="col-8">
                                  <div className="product-info">
                                    <h6 className="product-name mb-2">{item.title}</h6>
                                    <div className="price-info mb-2">
                                      <span className="current-price fw-bold">
                                        {symbol}{((item.price || 0) * value).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="stock-info mb-3">
                                      <span className={`stock-badge ${(item.stock ?? 0) > 0 ? 'stock-in' : 'stock-out'}`}>
                                        {(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                                      </span>
                                      {(item.stock ?? 0) > 0 && (
                                        <small className="text-muted ms-2">({item.stock} available)</small>
                                      )}
                                    </div>
                                    <div className="action-buttons-container">
                                      <button
                                        className="btn btn-primary btn-sm me-2"
                                        onClick={() => handleAddToCart(item)}
                                        disabled={(item.stock ?? 0) <= 0}
                                      >
                                        <i className="fa fa-cart-plus me-1"></i>
                                        Add to Cart
                                      </button>
                                      <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleRemoveFromWishlist(item)}
                                      >
                                        <i className="fa fa-times me-1"></i>
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="d-block d-md-none">
                    {enrichedWishlistData.map((item, index) => (
                      <div key={`mobile-${item.productId}-${item.variantId ?? index}`} className="wishlist-card-mobile mb-3">
                        <div className="card">
                          <div className="card-body p-3">
                            <div className="row">
                              <div className="col-4">
                                <div className="product-image-container">
                                  <img
                                    src={item.img?.[0] || "/images/product-sidebar/001.jpg"}
                                    alt={item.title || "Product"}
                                    className="wishlist-product-img-mobile"
                                    onError={(e) => {
                                      e.currentTarget.src = "/images/product-sidebar/001.jpg";
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="col-8">
                                <div className="product-info">
                                  <h6 className="product-name mb-2">{item.title}</h6>
                                  <div className="price-info mb-2">
                                    <span className="current-price fw-bold">
                                      {symbol}{((item.price || 0) * value).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="stock-info mb-3">
                                    <span className={`stock-badge ${(item.stock ?? 0) > 0 ? 'stock-in' : 'stock-out'}`}>
                                      {(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="row mt-3">
                              <div className="col-12">
                                <div className="action-buttons-container d-flex gap-2">
                                  <button
                                    className="btn btn-primary btn-sm flex-fill"
                                    onClick={() => handleAddToCart(item)}
                                    disabled={(item.stock ?? 0) <= 0}
                                  >
                                    <i className="fa fa-cart-plus me-1"></i>
                                    Add to Cart
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleRemoveFromWishlist(item)}
                                  >
                                    <i className="fa fa-times"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Wishlist Actions */}
                  <div className="wishlist-actions text-center mt-4 pt-4 border-top">
                    <button 
                      className="btn btn-outline-primary me-3"
                      onClick={() => window.location.href = '/products'}
                    >
                      <i className="fa fa-shopping-bag me-2"></i>
                      Continue Shopping
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={handleClearWishlist}
                    >
                      <i className="fa fa-trash me-2"></i>
                      Clear Wishlist
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-wishlist text-center py-5">
                  <div className="empty-wishlist-content">
                    <div className="empty-icon mb-4">
                      <i className="fa fa-heart-o" style={{fontSize: '4rem', color: '#dee2e6'}}></i>
                    </div>
                    <h4 className="empty-title mb-3">Your wishlist is empty</h4>
                    <p className="empty-text mb-4">
                      Explore our products and add items you love to your wishlist.
                    </p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.location.href = '/products'}
                    >
                      <i className="fa fa-shopping-bag me-2"></i>
                      Start Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "newsletter":
        return (
          <div className="dashboard">
            <div className="page-title">
              <h2>Newsletter Subscription</h2>
            </div>
            <div className="box-account box-info">
              <div className="box-head">
                <h2>Newsletter Settings</h2>
              </div>
              <div className="box-content">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Handle newsletter subscription update
                  alert("Newsletter preferences updated!");
                }}>
                  <div className="form-group mb-3">
                    <div className="form-check">
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="weeklyNewsletter"
                        checked={userProfile.newsletterSubscriptions.weekly}
                        onChange={(e) => handleProfileUpdate({
                          newsletterSubscriptions: {
                            ...userProfile.newsletterSubscriptions,
                            weekly: e.target.checked
                          }
                        })}
                      />
                      <label className="form-check-label" htmlFor="weeklyNewsletter">
                        Subscribe to our weekly newsletter
                      </label>
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <div className="form-check">
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="promotionalOffers"
                        checked={userProfile.newsletterSubscriptions.promotional}
                        onChange={(e) => handleProfileUpdate({
                          newsletterSubscriptions: {
                            ...userProfile.newsletterSubscriptions,
                            promotional: e.target.checked
                          }
                        })}
                      />
                      <label className="form-check-label" htmlFor="promotionalOffers">
                        Subscribe to promotional offers
                      </label>
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <div className="form-check">
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="productUpdates"
                        checked={userProfile.newsletterSubscriptions.productUpdates}
                        onChange={(e) => handleProfileUpdate({
                          newsletterSubscriptions: {
                            ...userProfile.newsletterSubscriptions,
                            productUpdates: e.target.checked
                          }
                        })}
                      />
                      <label className="form-check-label" htmlFor="productUpdates">
                        Subscribe to product updates
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Update Preferences
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case "account":
        return (
          <div className="dashboard">
            <div className="page-title">
              <h2>My Account</h2>
            </div>
            <div className="box-account box-info">
              <div className="box-head">
                <h2>Profile Information</h2>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedProfile = {
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  dateOfBirth: formData.get('dateOfBirth') as string,
                };
                handleProfileUpdate(updatedProfile);
                alert("Profile updated successfully!");
              }}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label htmlFor="firstName">First Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="firstName" 
                        name="firstName"
                        defaultValue={userProfile.firstName}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label htmlFor="lastName">Last Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="lastName" 
                        name="lastName"
                        defaultValue={userProfile.lastName}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    name="email"
                    defaultValue={userProfile.email}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    id="phone" 
                    name="phone"
                    defaultValue={userProfile.phone}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    id="dateOfBirth" 
                    name="dateOfBirth"
                    defaultValue={userProfile.dateOfBirth}
                  />
                </div>
                
                {/* Address Information */}
                <hr className="my-4" />
                <h5 className="mb-3">Address Information</h5>
                
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="mb-3">Billing Address</h6>
                    <div className="form-group mb-3">
                      <label htmlFor="billingStreet">Street Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="billingStreet"
                        defaultValue={userProfile.billingAddress?.street}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="billingCity">City</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="billingCity"
                            defaultValue={userProfile.billingAddress?.city}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="billingState">State</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="billingState"
                            defaultValue={userProfile.billingAddress?.state}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="billingZip">ZIP Code</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="billingZip"
                            defaultValue={userProfile.billingAddress?.zipCode}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="billingCountry">Country</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="billingCountry"
                            defaultValue={userProfile.billingAddress?.country}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="mb-3">Shipping Address</h6>
                    <div className="form-group mb-3">
                      <div className="form-check">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          id="sameAsBilling"
                          onChange={(e) => {
                            const shippingFields = ['shippingStreet', 'shippingCity', 'shippingState', 'shippingZip', 'shippingCountry'];
                            const billingFields = ['billingStreet', 'billingCity', 'billingState', 'billingZip', 'billingCountry'];
                            
                            if (e.target.checked) {
                              billingFields.forEach((billingField, index) => {
                                const billingElement = document.getElementById(billingField) as HTMLInputElement;
                                const shippingElement = document.getElementById(shippingFields[index]) as HTMLInputElement;
                                if (billingElement && shippingElement) {
                                  shippingElement.value = billingElement.value;
                                  shippingElement.disabled = true;
                                }
                              });
                            } else {
                              shippingFields.forEach(field => {
                                const element = document.getElementById(field) as HTMLInputElement;
                                if (element) {
                                  element.disabled = false;
                                }
                              });
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="sameAsBilling">
                          Same as billing address
                        </label>
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <label htmlFor="shippingStreet">Street Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="shippingStreet"
                        defaultValue={userProfile.shippingAddress?.street}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="shippingCity">City</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="shippingCity"
                            defaultValue={userProfile.shippingAddress?.city}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="shippingState">State</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="shippingState"
                            defaultValue={userProfile.shippingAddress?.state}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="shippingZip">ZIP Code</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="shippingZip"
                            defaultValue={userProfile.shippingAddress?.zipCode}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="shippingCountry">Country</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="shippingCountry"
                            defaultValue={userProfile.shippingAddress?.country}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <button type="submit" className="btn btn-primary me-3">
                    Update Profile
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveMenuItem("dashboard")}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      
      case "password":
        return (
          <div className="dashboard">
            <div className="page-title">
              <h2>Change Password</h2>
            </div>
            <div className="box-account box-info">
              <div className="box-head">
                <h2>Password Settings</h2>
              </div>
              <div className="box-content">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const currentPassword = formData.get('currentPassword') as string;
                  const newPassword = formData.get('newPassword') as string;
                  const confirmPassword = formData.get('confirmPassword') as string;

                  if (newPassword !== confirmPassword) {
                    alert("New passwords don't match!");
                    return;
                  }

                  if (newPassword.length < 8) {
                    alert("Password must be at least 8 characters long!");
                    return;
                  }

                  // Here you would typically make an API call to change the password
                  // await API.changePassword(phoneNumber, currentPassword, newPassword);
                  alert("Password changed successfully!");
                  e.currentTarget.reset();
                }}>
                  <div className="form-group mb-3">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="currentPassword" 
                      name="currentPassword"
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="newPassword">New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="newPassword" 
                      name="newPassword"
                      minLength={8}
                      required
                    />
                    <small className="form-text text-muted">
                      Password must be at least 8 characters long.
                    </small>
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="confirmPassword" 
                      name="confirmPassword"
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button type="submit" className="btn btn-primary me-3">
                      Change Password
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveMenuItem("dashboard")}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {/* breadcrumb start */}
      <Breadcrumb title="Dashboard" parent="home" />
      {/* breadcrumb End */}

      {/* section start */}
      <section className="section-big-py-space bg-light">
        <Container>
          <Row>
            <Col lg="3">
              <div
                className="account-sidebar"
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                <a className="popup-btn">my account</a>
              </div>
              <div
                className={`dashboard-left`}
                style={{
                  left: isOpen ? "0px" : "",
                }}
              >
                <div className="collection-mobile-back">
                  <span
                    className="filter-back"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    <i className="fa fa-angle-left" aria-hidden="true"></i> back
                  </span>
                </div>
                <div className="block-content ">
                  <ul>
                    {menuItems.map((item) => (
                      <li key={item.id} className={activeMenuItem === item.id ? "active" : ""}>
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handleMenuClick(item);
                          }}
                        >
                          {item.title}
                          {item.id === "wishlist" && wishlistItems.length > 0 && (
                            <span className="badge bg-danger ms-2">{wishlistItems.length}</span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Col>
            <Col lg="9">
              <div className="dashboard-right">
                {renderMainContent()}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* section end */}

      <style jsx>{`
        /* Enhanced Wishlist Styles */
        .wishlist-content {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .wishlist-table {
          margin-bottom: 0;
          background: white;
        }

        .wishlist-table thead th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .wishlist-row {
          transition: all 0.3s ease;
          border-bottom: 1px solid #f1f3f4;
        }

        .wishlist-row:hover {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .product-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .product-image-container:hover {
          transform: scale(1.05);
        }

        .wishlist-product-img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .wishlist-product-img-tablet {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .wishlist-product-img-mobile {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .product-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 1rem;
          line-height: 1.4;
          margin-bottom: 0;
          transition: color 0.3s ease;
        }

        .product-name:hover {
          color: #3498db;
        }

        .price-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .current-price {
          color: #e74c3c;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .original-price {
          color: #7f8c8d;
          text-decoration: line-through;
          font-size: 0.9rem;
        }

        .discount-badge {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .stock-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }

        .stock-in {
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
        }

        .stock-out {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
        }

        .stock-count {
          font-size: 0.75rem;
          color: #7f8c8d;
        }

        .action-buttons-container {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .action-buttons-container .btn {
          transition: all 0.3s ease;
          border-radius: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.8rem;
          padding: 8px 16px;
        }

        .action-buttons-container .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .action-buttons-container .btn-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
        }

        .action-buttons-container .btn-outline-danger {
          border: 2px solid #e74c3c;
          color: #e74c3c;
          background: transparent;
        }

        .action-buttons-container .btn-outline-danger:hover {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          border-color: #c0392b;
          color: white;
        }

        /* Tablet and Mobile Specific Styles */
        .wishlist-card-tablet, .wishlist-card-mobile {
          transition: all 0.3s ease;
          border: none;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .wishlist-card-tablet:hover, .wishlist-card-mobile:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .wishlist-actions {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          padding: 20px;
        }

        .empty-wishlist {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 12px;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-wishlist-content {
          text-align: center;
          max-width: 400px;
        }

        .empty-icon {
          background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .empty-title {
          color: #2c3e50;
          font-weight: 600;
        }

        .empty-text {
          color: #7f8c8d;
          line-height: 1.6;
        }

        /* Orders Styles */
        .filter-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .filter-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .filter-title {
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 0;
        }

        .filter-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 8px;
        }

        .filter-group .form-control {
          border-radius: 8px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }

        .filter-group .form-control:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
        }

        .button-group .btn {
          border-radius: 8px;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .order-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .order-header {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-bottom: 1px solid #e9ecef;
          transition: background 0.3s ease;
        }

        .order-header:hover {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .expand-icon {
          transition: transform 0.3s ease;
          color: #7f8c8d;
          font-weight: bold;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
          color: #3498db;
        }

        .order-details {
          background: #fdfdfd;
        }

        .section-title {
          color: #2c3e50;
          font-weight: 600;
          border-bottom: 2px solid #3498db;
          padding-bottom: 8px;
          margin-bottom: 20px;
        }

        .product-item {
          transition: all 0.3s ease;
          background: white;
        }

        .product-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }

        .product-image {
          border-radius: 8px;
          transition: transform 0.3s ease;
        }

        .product-image:hover {
          transform: scale(1.05);
        }

        /* Dashboard Styles */
        .dashboard {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .page-title h2 {
          color: #2c3e50;
          font-weight: 700;
          margin-bottom: 20px;
          position: relative;
        }

        .page-title h2::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 50px;
          height: 3px;
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          border-radius: 2px;
        }

        .welcome-msg p {
          color: #7f8c8d;
          line-height: 1.6;
          margin-bottom: 15px;
        }

        .box-account {
          margin-top: 30px;
        }

        .box-head h2 {
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #ecf0f1;
        }

        .box {
          background: #fdfdfd;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #ecf0f1;
          transition: all 0.3s ease;
        }

        .box:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .box-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ecf0f1;
        }

        .box-title h3 {
          color: #2c3e50;
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 0;
        }

        .box-title a {
          color: #3498db;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .box-title a:hover {
          color: #2980b9;
          text-decoration: underline;
        }

        .box-content h6 {
          color: #2c3e50;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .box-content address {
          color: #7f8c8d;
          line-height: 1.6;
          margin-bottom: 0;
        }

        .box-content a {
          color: #3498db;
          text-decoration: none;
          font-weight: 500;
        }

        .box-content a:hover {
          color: #2980b9;
          text-decoration: underline;
        }

        /* Stats boxes */
        .box.text-center {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid #ecf0f1;
        }

        .box.text-center h4 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .box.text-center p {
          color: #7f8c8d;
          font-weight: 500;
          margin-bottom: 15px;
        }

        /* Form Styles */
        .form-group label {
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .form-control {
          border-radius: 8px;
          border: 2px solid #e9ecef;
          padding: 12px 15px;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
        }

        .form-check-input:checked {
          background-color: #3498db;
          border-color: #3498db;
        }

        .form-check-label {
          color: #495057;
          font-weight: 500;
        }

        /* Button Styles */
        .btn-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
        }

        .btn-outline-secondary {
          border: 2px solid #6c757d;
          color: #6c757d;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-outline-secondary:hover {
          background: #6c757d;
          border-color: #6c757d;
          transform: translateY(-2px);
        }

        .btn-outline-danger {
          border: 2px solid #e74c3c;
          color: #e74c3c;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-outline-danger:hover {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          border-color: #c0392b;
          color: white;
          transform: translateY(-2px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .dashboard {
            padding: 20px 15px;
          }

          .page-title h2 {
            font-size: 1.5rem;
          }

          .box {
            padding: 15px;
          }

          .box-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .action-buttons-container {
            flex-direction: column;
          }

          .action-buttons-container .btn {
            width: 100%;
            margin-bottom: 8px;
          }

          .filter-row {
            flex-direction: column;
          }

          .button-group {
            text-align: center;
          }

          .button-group .btn {
            width: 100%;
            margin-bottom: 10px;
          }
        }

        /* Sidebar Styles */
        .account-sidebar {
          display: none;
        }

        .dashboard-left {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20px 0;
          position: sticky;
          top: 20px;
        }

        .dashboard-left ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .dashboard-left li {
          margin-bottom: 0;
          border-bottom: 1px solid #ecf0f1;
        }

        .dashboard-left li:last-child {
          border-bottom: none;
        }

        .dashboard-left li a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          color: #7f8c8d;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          border-radius: 0;
        }

        .dashboard-left li a:hover {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          color: #2c3e50;
          transform: translateX(5px);
        }

        .dashboard-left li.active a {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          font-weight: 600;
          position: relative;
        }

        .dashboard-left li.active a::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #2980b9;
        }

        .badge {
          font-size: 0.7rem;
          padding: 4px 8px;
          border-radius: 12px;
        }

        /* Mobile Sidebar */
        @media (max-width: 991px) {
          .account-sidebar {
            display: block;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            cursor: pointer;
            text-align: center;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .account-sidebar:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
          }

          .dashboard-left {
            position: fixed;
            top: 0;
            left: -300px;
            width: 300px;
            height: 100vh;
            z-index: 1050;
            transition: left 0.3s ease;
            overflow-y: auto;
          }

          .collection-mobile-back {
            padding: 20px 25px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
          }

          .filter-back {
            color: white;
            text-decoration: none;
            font-weight: 500;
            cursor: pointer;
          }

          .filter-back:hover {
            color: #ecf0f1;
          }
        }

        /* Loading and Error States */
        .text-center.py-5 {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .spinner-border {
          color: #3498db;
        }

        /* Animation Classes */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dashboard-right > * {
          animation: fadeIn 0.5s ease;
        }

        /* Custom Scrollbar */
        .dashboard-left::-webkit-scrollbar {
          width: 6px;
        }

        .dashboard-left::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .dashboard-left::-webkit-scrollbar-thumb {
          background: #3498db;
          border-radius: 3px;
        }

        .dashboard-left::-webkit-scrollbar-thumb:hover {
          background: #2980b9;
        }
      `}</style>
    </>
  );
};

export default Dashboard;