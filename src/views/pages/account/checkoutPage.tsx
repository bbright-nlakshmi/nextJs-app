"use client";
import React, { useState, useEffect, useContext } from "react";
import { NextPage } from "next";
import { useForm } from "react-hook-form";
import { Input, Label, Form, Row, Col, FormGroup } from "reactstrap";
import Breadcrumb from "../../../views/Containers/Breadcrumb";
import { CartContext } from "../../../helpers/cart/cart.context";
import { useRouter } from "next/navigation";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { searchController } from "@/app/globalProvider";
import { API } from "@/app/services/api.service";
import { CouponModel } from "@/app/models/coupon/coupon";
import dayjs from "dayjs";

interface formType {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  email: string;
  state: string;
  address: string;
  city: string;
  pincode: string;
}

interface CouponState {
  applied: boolean;
  coupon: CouponModel | null;
  discount: number;
}

// PayPal configuration - moved outside component
const paypalOptions = {
  clientId: "AZ4S98zFa01vym7NVeo_qthZyOnBhtNvQDsjhaZSMH-2_Y9IAJFbSD3HPueErYqN8Sa8WYRbjP7wWtd_",
  currency: "USD",
  intent: "capture"
};

// Main checkout component without PayPal provider
const CheckoutPageContent: React.FC = () => {
  const router = useRouter();
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;

  const { cartItems, emptyCart } = useContext(CartContext);

  const [payment, setPayment] = useState("cod");
  const [shippingOption, setShippingOption] = useState("standard");
  const [taxRate] = useState(0.10); // 10% tax rate
  
  // Coupon states
  const [availableCoupons, setAvailableCoupons] = useState<CouponModel[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponState>({
    applied: false,
    coupon: null,
    discount: 0
  });
  const [showCoupons, setShowCoupons] = useState(false);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<formType>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      country: "",
      email: "",
      state: "",
      address: "",
      city: "",
      pincode: "",
    }
  });

  // Fetch coupons on component mount
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setIsLoadingCoupons(true);
      const phoneNumber = "8185015406"; // TODO: Replace with actual logged-in user phone
      const result = await API.getCoupons(phoneNumber);

      // Filter only active (non-expired) coupons
      const activeCoupons = result.filter((coupon: CouponModel) => 
        dayjs(coupon.expireDate).isAfter(dayjs())
      );

      setAvailableCoupons(activeCoupons);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // Helper function to get product by ID
  const getProductById = (productId: string) => {
    try {
      return searchController?.getProductById?.(productId) || null;
    } catch (error) {
      console.warn("Error fetching product:", error);
      return null;
    }
  };

  const getPrice = (item: any): number => {
    if (!item) return 0;
    
    try {
      const product = getProductById(item.productId);
      
      if (product) {
        if (product.constructor?.name === 'Kit' && typeof product.getPrice === "function") {
          try {
            const price = product.getPrice({ cartQuantity: item.qty });
            if (typeof price === 'number' && !isNaN(price) && price > 0) {
              return price;
            }
          } catch (methodError) {
            console.warn("Kit getPrice method failed:", methodError);
          }
        }
        
        if (product?.getPrice && typeof product.getPrice === "function") {
          try {
            const price = product.getPrice({
              cartQuantity: item.qty,
              purchaseOptionStr: item.purchaseOptionStr || "",
            });
            if (typeof price === 'number' && !isNaN(price) && price > 0) {
              return price;
            }
          } catch (methodError) {
            console.warn("Product getPrice method failed:", methodError);
          }
        }
      }
      
      const extractPriceFromObject = (obj: any): number => {
        if (!obj || typeof obj !== 'object') return 0;
        
        if ('price' in obj && typeof obj.price === 'number' && obj.price > 0) {
          return obj.price;
        }
        
        if ('kitPrice' in obj && typeof obj.kitPrice === 'number' && obj.kitPrice > 0) {
          return obj.kitPrice;
        }
        
        if (obj.discountPrice && typeof obj.discountPrice === 'number' && obj.discountPrice > 0) {
          return obj.discountPrice;
        }
        
        if (obj.salePrice && typeof obj.salePrice === 'number' && obj.salePrice > 0) {
          return obj.salePrice;
        }
        
        if (obj.finalPrice && typeof obj.finalPrice === 'number' && obj.finalPrice > 0) {
          return obj.finalPrice;
        }
        
        if (obj.currentPrice && typeof obj.currentPrice === 'number' && obj.currentPrice > 0) {
          return obj.currentPrice;
        }
        
        if (obj.sellingPrice && typeof obj.sellingPrice === 'number' && obj.sellingPrice > 0) {
          return obj.sellingPrice;
        }
        
        const nestedPrice = obj.pricing || obj.priceInfo || obj.cost || obj.priceData;
        if (typeof nestedPrice === 'number' && nestedPrice > 0) {
          return nestedPrice;
        }
        if (typeof nestedPrice === 'object' && nestedPrice !== null) {
          const extractedPrice = nestedPrice.amount || nestedPrice.value || nestedPrice.price || nestedPrice.final || nestedPrice.current;
          if (typeof extractedPrice === 'number' && extractedPrice > 0) {
            return extractedPrice;
          }
        }
        
        return 0;
      };
      
      let price = extractPriceFromObject(item);
      if (price > 0) return price;
      
      if (item.product) {
        price = extractPriceFromObject(item.product);
        if (price > 0) return price;
      }
      
      if (product) {
        price = extractPriceFromObject(product);
        if (price > 0) return price;
      }
      
      if (item.productId) {
        const cartItem = cartItems.find((cartItem: any) => cartItem.productId === item.productId);
        if (cartItem) {
          price = extractPriceFromObject(cartItem);
          if (price > 0) return price;
        }
      }
      
    } catch (error) {
      console.warn("Error getting price for item:", error);
    }
    
    return 0;
  };

  const getSubtotal = (): number => {
    return cartItems.reduce((sum: number, item: any) => {
      const price = getPrice(item);
      return sum + price * item.qty * value;
    }, 0);
  };

  const getTaxAmount = (): number => {
    const subtotal = getSubtotal();
    return subtotal * taxRate;
  };

  const calculateCouponDiscount = (coupon: CouponModel, subtotal: number): number => {
    if (!coupon) return 0;

    // Check minimum cart value
    if (subtotal < coupon.minimumCartValue) {
      return 0;
    }

    let discount = 0;
    if (coupon.isCouponPercentage) {
      // Percentage discount
      discount = (subtotal * coupon.couponAmount) / 100;
      
      // Apply max discount cap if specified
      if (coupon.maxCouponAmount > 0 && discount > coupon.maxCouponAmount) {
        discount = coupon.maxCouponAmount;
      }
    } else {
      // Fixed amount discount
      discount = Math.min(coupon.couponAmount, subtotal);
    }

    return discount;
  };

  const applyCoupon = (coupon: CouponModel) => {
    const subtotal = getSubtotal();
    
    // Validate minimum cart value
    if (subtotal < coupon.minimumCartValue) {
      toast.error(`Minimum cart value should be ${symbol}${coupon.minimumCartValue.toFixed(2)}`);
      return;
    }

    // Check if coupon is expired
    if (dayjs(coupon.expireDate).isBefore(dayjs())) {
      toast.error("This coupon has expired");
      return;
    }

    const discount = calculateCouponDiscount(coupon, subtotal);
    
    setAppliedCoupon({
      applied: true,
      coupon: coupon,
      discount: discount
    });

    setCouponCode(coupon.couponCode);
    setShowCoupons(false);
    toast.success(`Coupon applied! You saved ${symbol}${discount.toFixed(2)}`);
  };

  const applyCouponByCode = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const coupon = availableCoupons.find(c => 
      c.couponCode.toLowerCase() === couponCode.toLowerCase()
    );

    if (!coupon) {
      toast.error("Invalid coupon code");
      return;
    }

    applyCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon({
      applied: false,
      coupon: null,
      discount: 0
    });
    setCouponCode("");
    toast.info("Coupon removed");
  };

  // Calculate totals
  const subtotal = getSubtotal();
  const taxAmount = getTaxAmount();
  const couponDiscount = appliedCoupon.applied ? appliedCoupon.discount : 0;
  const finalTotal = subtotal + taxAmount - couponDiscount;

  const onSubmit = (data: formType) => {
    console.log("Form data:", data);
    
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    // Validate all required fields
    const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'country', 'state', 'city', 'address', 'pincode'];
    const missingFields = requiredFields.filter(field => !data[field as keyof formType] || data[field as keyof formType].toString().trim() === '');
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Store order data with coupon information
    const orderData = {
      orderId: `ORD-${Date.now()}`, // Generate unique order ID
      items: cartItems,
      total: finalTotal,
      subtotal: subtotal,
      tax: taxAmount,
      couponDiscount: couponDiscount,
      appliedCoupon: appliedCoupon.applied ? {
        code: appliedCoupon.coupon?.couponCode,
        discount: couponDiscount,
        type: appliedCoupon.coupon?.isCouponPercentage ? 'percentage' : 'fixed'
      } : null,
      billingAddress: data,
      paymentMethod: payment,
      orderDate: new Date().toISOString(),
      status: payment === "cod" ? "pending" : "processing"
    };

    try {
      // Store order data for order success page
      sessionStorage.setItem("order-success-data", JSON.stringify(orderData));
      
      // Store order in order history (you can modify this based on your storage method)
      const existingOrders = JSON.parse(sessionStorage.getItem("order-history") || "[]");
      existingOrders.push(orderData);
      sessionStorage.setItem("order-history", JSON.stringify(existingOrders));
      
      emptyCart();
      toast.success("Order placed successfully!");
      router.push("/pages/order-success");
    } catch (error) {
      console.error("Error storing order data:", error);
      toast.error("Error processing order. Please try again.");
    }
  };

  const onSuccess = (data: any, actions: any) =>
    actions.order.capture().then(() => {
      const orderData = {
        orderId: `ORD-${Date.now()}`,
        items: cartItems,
        total: finalTotal,
        subtotal: subtotal,
        tax: taxAmount,
        couponDiscount: couponDiscount,
        appliedCoupon: appliedCoupon.applied ? {
          code: appliedCoupon.coupon?.couponCode,
          discount: couponDiscount,
          type: appliedCoupon.coupon?.isCouponPercentage ? 'percentage' : 'fixed'
        } : null,
        paymentMethod: "paypal",
        paymentId: data.id,
        orderDate: new Date().toISOString(),
        status: "completed"
      };
      
      sessionStorage.setItem("order-success-data", JSON.stringify(orderData));
      
      // Store in order history
      const existingOrders = JSON.parse(sessionStorage.getItem("order-history") || "[]");
      existingOrders.push(orderData);
      sessionStorage.setItem("order-history", JSON.stringify(existingOrders));
      
      emptyCart();
      toast.success("Payment successful!");
      router.push("/pages/order-success");
    });

  const onCancel = () => toast.error("The payment was cancelled!");
  const onError = (err: any) => {
    console.error("PayPal Error:", err);
    toast.error("Payment error occurred");
  };

  return (
    <>
      <Breadcrumb title="checkout" parent="home" />
      <section className="section-big-py-space bg-light">
        <div className="custom-container">
          {cartItems.length === 0 ? (
            <div className="checkout-empty-cart">
              <h3>Your cart is empty</h3>
              <button 
                className="btn-normal btn mt-3" 
                onClick={() => router.push("/shop")}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Row>
                <Col lg="6">
                  <h3>Billing Details</h3>
                  <Row className="check-out">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="field-label">First Name *</label>
                        <input
                          type="text"
                          placeholder="Enter first name"
                          className={`form-control ${errors.firstName ? "error_border" : ""}`}
                          {...register("firstName", {
                            required: "First name is required",
                            minLength: {
                              value: 2,
                              message: "First name must be at least 2 characters"
                            }
                          })}
                        />
                        {errors.firstName && (
                          <span className="error-message">
                            {errors.firstName.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="field-label">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Enter last name"
                          className={`form-control ${errors.lastName ? "error_border" : ""}`}
                          {...register("lastName", {
                            required: "Last name is required",
                            minLength: {
                              value: 2,
                              message: "Last name must be at least 2 characters"
                            }
                          })}
                        />
                        {errors.lastName && (
                          <span className="error-message">
                            {errors.lastName.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="field-label">Phone *</label>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          className={`form-control ${errors.phone ? "error_border" : ""}`}
                          {...register("phone", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^[+]?[\d\s\-\(\)]{10,}$/,
                              message: "Please enter a valid phone number"
                            }
                          })}
                        />
                        {errors.phone && (
                          <span className="error-message">
                            {errors.phone.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="field-label">Email *</label>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          className={`form-control ${errors.email ? "error_border" : ""}`}
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Please enter a valid email address"
                            }
                          })}
                        />
                        {errors.email && (
                          <span className="error-message">
                            {errors.email.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <label className="field-label">Country *</label>
                        <select
                          className={`form-control ${errors.country ? "error_border" : ""}`}
                          {...register("country", { required: "Country is required" })}
                        >
                          <option value="">Select Country</option>
                          <option value="India">India</option>
                          <option value="South Africa">South Africa</option>
                          <option value="United States">United States</option>
                        </select>
                        {errors.country && (
                          <span className="error-message">
                            {errors.country.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="field-label">State *</label>
                        <input
                          type="text"
                          placeholder="Enter state"
                          className={`form-control ${errors.state ? "error_border" : ""}`}
                          {...register("state", {
                            required: "State is required",
                            minLength: {
                              value: 2,
                              message: "State must be at least 2 characters"
                            }
                          })}
                        />
                        {errors.state && (
                          <span className="error-message">
                            {errors.state.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="field-label">City *</label>
                        <input
                          type="text"
                          placeholder="Enter city"
                          className={`form-control ${errors.city ? "error_border" : ""}`}
                          {...register("city", {
                            required: "City is required",
                            minLength: {
                              value: 2,
                              message: "City must be at least 2 characters"
                            }
                          })}
                        />
                        {errors.city && (
                          <span className="error-message">
                            {errors.city.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <label className="field-label">Address *</label>
                        <textarea
                          rows={3}
                          placeholder="Enter full address"
                          className={`form-control ${errors.address ? "error_border" : ""}`}
                          {...register("address", {
                            required: "Address is required",
                            minLength: {
                              value: 10,
                              message: "Address must be at least 10 characters"
                            }
                          })}
                        />
                        {errors.address && (
                          <span className="error-message">
                            {errors.address.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="field-label">Postal Code *</label>
                        <input
                          type="text"
                          placeholder="Enter postal code"
                          className={`form-control ${errors.pincode ? "error_border" : ""}`}
                          {...register("pincode", {
                            required: "Postal code is required",
                            pattern: {
                              value: /^[A-Za-z0-9\s\-]{3,10}$/,
                              message: "Please enter a valid postal code"
                            }
                          })}
                        />
                        {errors.pincode && (
                          <span className="error-message">
                            {errors.pincode.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </Row>
                </Col>

                <Col lg="6">
                  <div className="checkout-details theme-form section-big-mt-space">
                    
                    {/* Coupon Section */}
                    <div className="coupon-box">
                      <h4>Apply Coupon</h4>
                      <div className="coupon-input-section">
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={appliedCoupon.applied}
                          />
                          <div className="input-group-append">
                            {appliedCoupon.applied ? (
                              <button 
                                type="button" 
                                className="btn btn-danger"
                                onClick={removeCoupon}
                              >
                                Remove
                              </button>
                            ) : (
                              <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={applyCouponByCode}
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {!appliedCoupon.applied && (
                          <div className="available-coupons-section">
                            <button
                              type="button"
                              className="btn btn-link p-0 mt-2"
                              onClick={() => setShowCoupons(!showCoupons)}
                            >
                              {showCoupons ? 'Hide' : 'View'} Available Coupons ({availableCoupons.length})
                            </button>
                            
                            {showCoupons && (
                              <div className="coupons-list">
                                {isLoadingCoupons ? (
                                  <div className="coupon-loading">Loading coupons...</div>
                                ) : availableCoupons.length > 0 ? (
                                  availableCoupons.map((coupon, index) => (
                                    <div key={index} className="coupon-item">
                                      <div className="coupon-info">
                                        <div className="coupon-code">
                                          <strong>{coupon.couponCode}</strong>
                                        </div>
                                        <div className="coupon-details">
                                          <span className="discount">
                                            {coupon.isCouponPercentage 
                                              ? `${coupon.couponAmount}% OFF` 
                                              : `${symbol}${coupon.couponAmount} OFF`}
                                            {coupon.maxCouponAmount > 0 && coupon.isCouponPercentage && 
                                              ` (Max ${symbol}${coupon.maxCouponAmount})`}
                                          </span>
                                          <span className="min-cart">
                                            Min: {symbol}{coupon.minimumCartValue}
                                          </span>
                                          <span className="expiry">
                                            Expires: {dayjs(coupon.expireDate).format("DD MMM YYYY")}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => applyCoupon(coupon)}
                                        disabled={subtotal < coupon.minimumCartValue}
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <div className="no-coupons">No coupons available.</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {appliedCoupon.applied && (
                          <div className="applied-coupon-info">
                            <div className="alert alert-success mt-2">
                              <i className="fa fa-check-circle"></i>
                              <strong>{appliedCoupon.coupon?.couponCode}</strong> applied! 
                              You saved {symbol}{appliedCoupon.discount.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="order-box">
                      <div className="title-box">
                        <div className="row">
                          <div className="col-6"><strong>Product</strong></div>
                          <div className="col-3 text-center"><strong>Qty</strong></div>
                          <div className="col-3 text-right"><strong>Total</strong></div>
                        </div>
                      </div>
                      
                      {/* Cart Items List */}
                      <ul className="qty">
                        {cartItems.map((item: any, index: number) => {
                          const price = getPrice(item);
                          const itemTotal = price * item.qty * value;
                          
                          return (
                            <li key={item.key || index} className="cart-item">
                              <div className="row align-items-left">
                                <div className="col-6">
                                  <span className="product-name">{item.name}</span>
                                  <div className="product-price">
                                    {symbol}{(price * value).toFixed(2)} each
                                  </div>
                                </div>
                                <div className="col-3 text-left">
                                  <span className="qty-badge">×{item.qty}</span>
                                </div>
                                <div className="col-3 text-left">
                                  <span className="item-total">
                                    {symbol}{itemTotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Order Summary */}
                      <ul className="sub-total">
                        <li>
                          <div className="row">
                            <div className="col-8">Subtotal ({cartItems.length} items)</div>
                            <div className="col-4 text-right">
                              <span className="count">
                                {symbol}{subtotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </li>

                        {appliedCoupon.applied && (
                          <li>
                            <div className="row">
                              <div className="col-8">
                                Coupon Discount ({appliedCoupon.coupon?.couponCode})
                              </div>
                              <div className="col-4 text-right">
                                <span className="count text-success">
                                  -{symbol}{couponDiscount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </li>
                        )}

                        <li>
                          <div className="row">
                            <div className="col-8">Tax ({(taxRate * 100).toFixed(0)}%)</div>
                            <div className="col-4 text-right">
                              <span className="count">
                                {symbol}{taxAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </li>
                      </ul>

                      {/* Final Total */}
                      <ul className="total">
                        <li>
                          <div className="row">
                            <div className="col-8"><strong>Total Amount</strong></div>
                            <div className="col-4 text-right">
                              <span className="count">
                                <strong>{symbol}{finalTotal.toFixed(2)}</strong>
                              </span>
                            </div>
                          </div>
                        </li>
                      </ul>
                      {/* Payment Methods */}
                      <div className="payment-box">
                        <div className="upper-box">
                          <h4>Payment Methods</h4>
                          <div className="payment-options">
                            <div className="payment-option">
                              <input
                                type="radio"
                                id="cod"
                                name="payment"
                                value="cod"
                                checked={payment === "cod"}
                                onChange={(e) => setPayment(e.target.value)}
                              />
                              <label htmlFor="cod" className="payment-label">
                                <i className="fa fa-money"></i>
                                Cash on Delivery
                              </label>
                            </div>
                            
                            <div className="payment-option">
                              <input
                                type="radio"
                                id="paypal"
                                name="payment"
                                value="paypal"
                                checked={payment === "paypal"}
                                onChange={(e) => setPayment(e.target.value)}
                              />
                              <label htmlFor="paypal" className="payment-label">
                                <i className="fa fa-paypal"></i>
                                PayPal
                              </label>
                            </div>
                            
                            <div className="payment-option">
                              <input
                                type="radio"
                                id="stripe"
                                name="payment"
                                value="stripe"
                                checked={payment === "stripe"}
                                onChange={(e) => setPayment(e.target.value)}
                              />
                              <label htmlFor="stripe" className="payment-label">
                                <i className="fa fa-credit-card"></i>
                                Credit/Debit Card
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      
                      

                      {/* Place Order Button */}
                      <div className="order-place">
                        {payment === "cod" && (
                          <button 
                            type="submit" 
                            className="btn-normal btn"
                            disabled={cartItems.length === 0}
                          >
                            Place Order
                          </button>
                        )}
                        
                        {payment === "paypal" && (
                          <div className="paypal-button-container">
                            <PayPalButtons
                              createOrder={(data, actions) => {
                                return actions.order.create({
                                  purchase_units: [
                                    {
                                      amount: {
                                        value: finalTotal.toFixed(2),
                                      },
                                    },
                                  ],
                                });
                              }}
                              onApprove={onSuccess}
                              onError={onError}
                              onCancel={onCancel}
                              style={{
                                layout: "horizontal",
                                color: "blue",
                                shape: "rect",
                                label: "paypal",
                              }}
                            />
                          </div>
                        )}
                        
                        {payment === "stripe" && (
                          <button 
                            type="button" 
                            className="btn-normal btn"
                            onClick={() => toast.info("Stripe payment integration coming soon!")}
                          >
                            Pay with Card
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Form>
          )}
        </div>
      </section>

      {/* Order Summary Mobile View */}
      <div className="mobile-order-summary d-lg-none">
        <button 
          className="btn btn-outline-primary w-100"
          onClick={() => setShowCoupons(!showCoupons)}
        >
          Order Summary ({cartItems.length} items) - {symbol}{finalTotal.toFixed(2)}
        </button>
      </div>

      {/* Terms and Conditions Modal */}
      
    </>
  );
};

// Main component with PayPal provider
const CheckoutPage: NextPage = () => {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      <CheckoutPageContent />
    </PayPalScriptProvider>
  );
};

export default CheckoutPage;