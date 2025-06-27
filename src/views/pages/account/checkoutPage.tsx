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
            <div className="text-center">
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
                                  <div className="p-3">Loading coupons...</div>
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
                                  <div className="p-3">No coupons available.</div>
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
                              <div className="row align-items-center">
                                <div className="col-6">
                                  <span className="product-name">{item.name}</span>
                                  <div className="product-price">
                                    {symbol}{(price * value).toFixed(2)} each
                                  </div>
                                </div>
                                <div className="col-3 text-center">
                                  <span className="qty-badge">×{item.qty}</span>
                                </div>
                                <div className="col-3 text-right">
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
                    </div>

                    {/* Payment Options */}
                    <div className="payment-box">
                      <div className="upper-box">
                        <div className="payment-options">
                          <ul>
                            <li>
                              <div className="radio-option">
                                <input
                                  id="payment-1"
                                  type="radio"
                                  name="payment-radio"
                                  value="cod"
                                  checked={payment === "cod"}
                                  onChange={(e) => setPayment(e.target.value)}
                                />
                                <label htmlFor="payment-1">
                                  <span></span>
                                  Cash On Delivery
                                </label>
                              </div>
                            </li>
                            <li>
                              <div className="radio-option">
                                <input
                                  id="payment-2"
                                  type="radio"
                                  name="payment-radio"
                                  value="card"
                                  checked={payment === "card"}
                                  onChange={(e) => setPayment(e.target.value)}
                                />
                                <label htmlFor="payment-2">
                                  <span></span>
                                  Credit/Debit Card
                                </label>
                              </div>
                            </li>
                            <li>
                              <div className="radio-option">
                                <input
                                  id="payment-3"
                                  type="radio"
                                  name="payment-radio"
                                  value="paypal"
                                  checked={payment === "paypal"}
                                  onChange={(e) => setPayment(e.target.value)}
                                />
                                <label htmlFor="payment-3">
                                  <span></span>
                                  PayPal
                                </label>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Payment Method Specific Content */}
                      <div className="payment-method-content">
                        {payment === "cod" && (
                          <div className="cod-info">
                            <div className="alert alert-info">
                              <i className="fa fa-info-circle"></i>
                              Pay with cash upon delivery. Please keep exact change ready.
                            </div>
                          </div>
                        )}

                        {payment === "card" && (
                          <div className="card-payment-form">
                            <div className="row">
                              <div className="col-12">
                                <div className="form-group">
                                  <label className="field-label">Card Number *</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="1234 5678 9012 3456"
                                    maxLength={19}
                                    onChange={(e) => {
                                      // Format card number with spaces
                                      let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                                      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                                      e.target.value = value;
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="col-8">
                                <div className="form-group">
                                  <label className="field-label">Expiry Date *</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    onChange={(e) => {
                                      let value = e.target.value.replace(/\D/g, '');
                                      if (value.length >= 2) {
                                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                      }
                                      e.target.value = value;
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="field-label">CVV *</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="123"
                                    maxLength={4}
                                    onChange={(e) => {
                                      e.target.value = e.target.value.replace(/\D/g, '');
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="form-group">
                                  <label className="field-label">Cardholder Name *</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter cardholder name"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {payment === "paypal" && (
                          <div className="paypal-payment">
                            <div className="alert alert-info mb-3">
                              <i className="fa fa-paypal"></i>
                              You will be redirected to PayPal to complete your payment securely.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Place Order Button */}
                      <div className="order-place">
                        {payment === "paypal" ? (
                          <PayPalButtons
                            style={{
                              layout: "vertical",
                              color: "blue",
                              shape: "rect",
                              label: "paypal"
                            }}
                            createOrder={(data, actions) => {
                              return actions.order.create({
                                purchase_units: [
                                  {
                                    amount: {
                                      value: finalTotal.toFixed(2),
                                      currency_code: "USD"
                                    },
                                    description: `Order for ${cartItems.length} items`
                                  }
                                ],
                                intent: "CAPTURE"
                              });
                            }}
                            onApprove={onSuccess}
                            onCancel={onCancel}
                            onError={onError}
                          />
                        ) : (
                          <button 
                            type="submit" 
                            className="btn-normal btn"
                            disabled={cartItems.length === 0}
                          >
                            {payment === "card" ? "Pay Now" : "Place Order"}
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

      <style jsx>{`
        .coupon-box {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }

        .coupon-box h4 {
          margin-bottom: 15px;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }

        .coupon-input-section .input-group {
          margin-bottom: 10px;
        }

        .coupon-input-section .form-control {
          border-radius: 4px 0 0 4px;
        }

        .coupon-input-section .btn {
          border-radius: 0 4px 4px 0;
          font-size: 14px;
          padding: 8px 16px;
        }

        .coupons-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin-top: 10px;
        }

        .coupon-item {
          padding: 15px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .coupon-item:last-child {
          border-bottom: none;
        }

        .coupon-info {
          flex: 1;
        }

        .coupon-code {
          font-size: 16px;
          color: #007bff;
          margin-bottom: 5px;
        }

        .coupon-details {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: #666;
        }

        .discount {
          color: #28a745;
          font-weight: 600;
        }

        .applied-coupon-info .alert {
          padding: 10px 15px;
          margin-bottom: 0;
          font-size: 14px;
        }

        .order-box {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .title-box {
          background: #f8f9fa;
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
          font-weight: 600;
        }

        .qty {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .cart-item {
          padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .product-name {
          font-weight: 500;
          color: #333;
          display: block;
          margin-bottom: 4px;
        }

        .product-price {
          font-size: 12px;
          color: #666;
        }

        .qty-badge {
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .item-total {
          font-weight: 600;
          color: #333;
        }

        .sub-total, .total {
          list-style: none;
          padding: 0;
          margin: 0;
          background: #f8f9fa;
        }

        .sub-total li, .total li {
          padding: 12px 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .sub-total li:last-child, .total li:last-child {
          border-bottom: none;
        }

        .total {
          background: #e9ecef;
          font-weight: 600;
        }

        .count {
          font-weight: 600;
        }

        .payment-box {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-top: 25px;
          overflow: hidden;
        }

        .upper-box {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: 1px solid #ddd;
        }

        .payment-options ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .payment-options li {
          margin-bottom: 12px;
        }

        .payment-options li:last-child {
          margin-bottom: 0;
        }

        .radio-option {
          display: flex;
          align-items: center;
        }

        .radio-option input[type="radio"] {
          margin-right: 10px;
          transform: scale(1.2);
        }

        .radio-option label {
          margin-bottom: 0;
          font-weight: 500;
          cursor: pointer;
        }

        .payment-method-content {
          padding: 20px;
        }

        .card-payment-form .form-group {
          margin-bottom: 15px;
        }

        .card-payment-form .field-label {
          font-weight: 500;
          margin-bottom: 5px;
          display: block;
        }

        .card-payment-form .form-control {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px 12px;
        }

        .order-place {
          padding: 20px;
          background: #f8f9fa;
          text-align: center;
        }

        .btn-normal {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
          width: 100%;
        }

        .btn-normal:hover {
          background: #0056b3;
        }

        .btn-normal:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error_border {
          border-color: #dc3545 !important;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .field-label {
          font-weight: 500;
          margin-bottom: 5px;
          display: block;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .alert {
          padding: 12px 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .alert-info {
          background-color: #d1ecf1;
          border-color: #bee5eb;
          color: #0c5460;
        }

        .alert-success {
          background-color: #d4edda;
          border-color: #c3e6cb;
          color: #155724;
        }

        .text-success {
          color: #28a745 !important;
        }

        @media (max-width: 768px) {
          .coupon-details {
            flex-direction: column;
            gap: 5px;
          }
          
          .coupon-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .title-box .row > div {
            font-size: 12px;
          }
          
          .cart-item .row > div {
            margin-bottom: 5px;
          }
        }
      `}</style>
    </>
  );
};

// Main component with PayPal provider wrapper
const CheckoutPage: NextPage = () => {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      <CheckoutPageContent />
    </PayPalScriptProvider>
  );
};

export default CheckoutPage;