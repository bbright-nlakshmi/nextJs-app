"use client";
import React, { useState, useContext } from "react";
import { NextPage } from "next";
import { useForm } from "react-hook-form";
import { Form, Row, Col } from "reactstrap";
import Breadcrumb from "../../../views/Containers/Breadcrumb";
import { CartContext } from "../../../helpers/cart/cart.context";
import { useRouter } from "next/navigation";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { API } from "@/app/services/api.service";
import { searchController } from "@/app/globalProvider";
import { Kit } from "@/app/models/kit/kit";

// Simple OrderModel wrapper to match your API structure
class OrderModel {
  private orderData: any;
  
  constructor(data: any) {
    this.orderData = data;
  }
  
  toJsonObj() {
    return this.orderData;
  }
}

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

interface KitRaw {
  id: string;
  [key: string]: any;
}

// PayPal configuration
const paypalOptions = {
  clientId: "AZ4S98zFa01vym7NVeo_qthZyOnBhtNvQDsjhaZSMH-2_Y9IAJFbSD3HPueErYqN8Sa8WYRbjP7wWtd_",
  currency: "USD",
  intent: "capture"
};

// Static order data template
const createStaticOrderData = (formData: formType, paymentMethod: string, cartItems: any[], totals: any) => {
  const currentTime = new Date().toISOString();
  const orderNumber = Math.floor(Math.random() * 1000000);
  
  return {
    "id": `STEAKSSTAY-E${orderNumber}`,
    "img": [],
    "store": "store",
    "store_id": "5e2f938f-5d53-4f33-bfd1-1248acec2fc7",
    "order_gst": "",
    "tax_group": {},
    "tax_total": totals.tax,
    "user_name": `${formData.firstName} ${formData.lastName}`,
    "cart_total": totals.subtotal,
    "order_time": currentTime,
    "coupon_code": "",
    "order_items": cartItems.map((item, index) => ({
      "id": item.productId || `product-${index}`,
      "url": item.img?.[0] || "",
      "name": item.name || "Product",
      "rating": 0,
      "status": {
        "cancel": null,
        "confirm": null,
        "deliver": null,
        "package": null,
        "process": currentTime,
        "transit": null
      },
      "cost_price": totals.itemPrice || 10,
      "is_product": true,
      "category_id": "default-category-id",
      "category_name": item.category || "General",
      "choosed_price": totals.itemPrice * (item.qty || 1),
      "collected_tax": 0,
      "is_returnable": false,
      "sale_quantity": (item.qty || 1).toString(),
      "cart_item_count": item.qty || 1,
      "order_kit_items": [],
      "sale_quantity_str": `${item.qty || 1}kg`,
      "base_choosed_price": totals.itemPrice * (item.qty || 1),
      "selected_subscription": {
        "end_date": currentTime,
        "interval": 1,
        "start_date": currentTime,
        "time_slots": ["MORNING", "EVENING"],
        "selected_months": ["JAN", "FEB"],
        "selected_weekdays": ["MON", "THU", "SAT"],
        "subscription_type": "DAILY"
      }
    })),
    "txn_details": {},
    "device_token": "",
    "package_cost": 5,
    "payment_mode": paymentMethod === "cod" ? "Cash On Delivery" : "PayPal",
    "phone_number": formData.phone,
    "coupon_amount": 0,
    "creation_time": currentTime,
    "delivery_cost": 0,
    "order_pick_up": false,
    "total_savings": 0,
    "updation_time": currentTime,
    "invoice_series": "ONL_64",
    "order_complete": false,
    "discount_amount": 0,
    "delivery_address": {
      "lat": 23.339261179986867,
      "lng": 77.82606313073967,
      "city": formData.city,
      "address": formData.address,
      "at_store": false,
      "pin_code": formData.pincode,
      "last_name": formData.lastName,
      "first_name": formData.firstName,
      "phone_number": formData.phone
    },
    "assigned_delivery": {
      "name": "Not Assigned",
      "phone": ""
    },
    "final_order_total": totals.final,
    "order_accept_status": "PENDING",
    "user_notification_sent": false,
    "delivery_notification_sent": false,
    "final_order_total_without_delivery": totals.final - 5
  };
};

const CheckoutPageContent: React.FC = () => {
  const router = useRouter();
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const { cartItems, emptyCart } = useContext(CartContext);
  
  const [payment, setPayment] = useState("cod");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<formType>();

  // Price function from cart page - exact implementation
  const getProductById = (productId: string): any => {
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
        const kitRaw = searchController.kits.find((k: KitRaw) => k?.id === productId);
        if (kitRaw) {
          const kit = new Kit();
          if (kit.fromMap && typeof kit.fromMap === "function") {
            kit.fromMap(kitRaw);
            return kit;
          }
        }
      }
    } catch (error) {
      console.error("Error finding product:", error);
    }

    return null;
  };

  const getPrice = (item: any): number => {
    if (!item) return 0;

    try {
      const product = getProductById(item.productId);
      
      if (product) {
        if (product instanceof Kit && typeof product.getPrice === "function") {
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

        const priceFields = ['price', 'kitPrice', 'discountPrice', 'salePrice', 'finalPrice', 'currentPrice', 'sellingPrice'];
        
        for (const field of priceFields) {
          if (field in obj && typeof obj[field] === 'number' && obj[field] > 0) {
            return obj[field];
          }
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

      if (product) {
        const productPrice = extractPriceFromObject(product);
        if (productPrice > 0) return productPrice;
      }

      const itemPrice = extractPriceFromObject(item);
      if (itemPrice > 0) return itemPrice;

      if (typeof item.price === 'number' && item.price > 0) {
        return item.price;
      }

      return 0;
    } catch (err) {
      console.error("Price extraction error:", err);
      return item.price || 0;
    }
  };

  // Calculate totals using the proper price function
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const price = getPrice(item);
    const itemTotal = price * (item.qty || 1) * value;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);

  const taxAmount = subtotal * 0.1;
  const packageCost = 5;
  const finalTotal = subtotal + taxAmount + packageCost;

  // Validate and sanitize order data before submission
  const validateOrderData = (orderData: any) => {
    const issues = [];
    
    // Check required fields
    if (!orderData.user_name || orderData.user_name.trim() === '') {
      issues.push("User name is required");
    }
    
    if (!orderData.phone_number || orderData.phone_number.trim() === '') {
      issues.push("Phone number is required");
    }
    
    if (!orderData.delivery_address || !orderData.delivery_address.address) {
      issues.push("Delivery address is required");
    }
    
    if (!orderData.order_items || orderData.order_items.length === 0) {
      issues.push("Order must contain at least one item");
    }
    
    if (orderData.final_order_total <= 0) {
      issues.push("Invalid order total");
    }
    
    // Check order items
    if (orderData.order_items) {
      orderData.order_items.forEach((item: any, index: number) => {
        if (!item.name || item.name.trim() === '') {
          issues.push(`Item ${index + 1} is missing name`);
        }
        if (!item.sale_quantity || item.sale_quantity <= 0) {
          issues.push(`Item ${index + 1} has invalid quantity`);
        }
        if (!item.choosed_price || item.choosed_price <= 0) {
          issues.push(`Item ${index + 1} has invalid price`);
        }
      });
    }
    
    if (issues.length > 0) {
      throw new Error("Order validation failed: " + issues.join(", "));
    }
    
    return true;
  };

  // Enhanced order submission with better error handling
  const submitOrder = async (orderData: any) => {
    try {
      console.log("Submitting order data:", orderData);
      
      // Check if API service exists
      if (!API || typeof API.saveOrder !== 'function') {
        throw new Error("API service not available or saveOrder method not found");
      }

      // Validate order data
      validateOrderData(orderData);

      // Create OrderModel instance
      const orderModel = new OrderModel(orderData);

      // Call the saveOrder method (it returns void, so we'll treat success as no exception)
      await API.saveOrder(orderModel);
      console.log("Order submitted successfully");
      
      return { success: true, orderId: orderData.id };
    } catch (error) {
      console.error("Order submission error details:", error);
      
      // More specific error messages
      if (error.message?.includes("Network Error")) {
        throw new Error("Network error. Please check your internet connection and try again.");
      } else if (error.message?.includes("400")) {
        throw new Error("Invalid order data. Please check your information and try again.");
      } else if (error.message?.includes("401")) {
        throw new Error("Authentication failed. Please login and try again.");
      } else if (error.message?.includes("500")) {
        throw new Error("Server error. Please try again later.");
      } else if (error.message?.includes("validation failed")) {
        throw new Error(error.message);
      } else {
        throw new Error(error.message || "An unexpected error occurred. Please try again.");
      }
    }
  };

  // Validate cart items before submission
  const validateCartItems = () => {
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Your cart is empty!");
    }

    for (const item of cartItems) {
      if (!item.productId && !item.id) {
        throw new Error("Invalid product found in cart. Please refresh and try again.");
      }
      if (!item.qty || item.qty <= 0) {
        throw new Error("Invalid quantity for product: " + (item.name || "Unknown"));
      }
      const price = getPrice(item);
      if (price <= 0) {
        throw new Error("Invalid price for product: " + (item.name || "Unknown"));
      }
    }
  };

  const onSubmit = async (data: formType) => {
    setIsProcessingOrder(true);
    
    try {
      // Validate cart items
      validateCartItems();
      
      // Validate totals
      if (subtotal <= 0) {
        throw new Error("Invalid cart total. Please refresh and try again.");
      }
      
      const totals = {
        subtotal: subtotal,
        tax: taxAmount,
        final: finalTotal,
        itemPrice: getPrice(cartItems[0]) // For order data structure
      };
      
      const orderData = createStaticOrderData(data, payment, cartItems, totals);
      
      // Submit order
      const response = await submitOrder(orderData);
      
      // Store order data for success page
      const orderSuccessData = {
        orderId: orderData.id,
        items: cartItems,
        total: finalTotal,
        subtotal: subtotal,
        tax: taxAmount,
        packageCost: packageCost,
        billingAddress: data,
        paymentMethod: payment,
        orderDate: new Date().toISOString(),
        status: "pending",
        apiResponse: response
      };

      sessionStorage.setItem("order-success-data", JSON.stringify(orderSuccessData));
      
      emptyCart();
      toast.success("Order placed successfully!");
      router.push("/pages/order-success");
      
    } catch (error) {
      console.error("Order processing error:", error);
      toast.error(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Error processing order. Please try again."
          : "Error processing order. Please try again."
      );
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const onPayPalSuccess = (data: any, actions: any) =>
    actions.order.capture().then(async (paymentDetails: any) => {
      setIsProcessingOrder(true);
      
      try {
        // Validate cart items
        validateCartItems();
        
        const formData = getValues();
        const totals = {
          subtotal: subtotal,
          tax: taxAmount,
          final: finalTotal,
          itemPrice: getPrice(cartItems[0])
        };
        
        const orderData = createStaticOrderData(formData, "paypal", cartItems, totals);
        
        // Add PayPal transaction details
        orderData.txn_details = {
          paypal_payment_id: data.id,
          paypal_order_id: data.id,
          payment_details: paymentDetails
        };
        
        const response = await submitOrder(orderData);
        
        const orderSuccessData = {
          orderId: orderData.id,
          items: cartItems,
          total: finalTotal,
          paymentMethod: "paypal",
          paymentId: data.id,
          orderDate: new Date().toISOString(),
          status: "completed",
          apiResponse: response
        };
        
        sessionStorage.setItem("order-success-data", JSON.stringify(orderSuccessData));
        
        emptyCart();
        toast.success("Payment successful!");
        router.push("/pages/order-success");
        
      } catch (error) {
        console.error("PayPal order processing error:", error);
        toast.error(error.message || "Error processing order. Please try again.");
      } finally {
        setIsProcessingOrder(false);
      }
    });

  // Helper function to get unique identifier for item
  const getItemKey = (item: any): string => {
    return item.cartItemId || item.key || item.id || item.productId || Math.random().toString();
  };

  return (
    <>
      <Breadcrumb title="checkout" parent="home" />
      
      <section className="checkout-container">
        <div className="container">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <h3>Your cart is empty</h3>
              <button 
                className="btn-primary" 
                onClick={() => router.push("/shop")}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Row>
                <Col lg="7">
                  <div className="checkout-form">
                    <h3 className="checkout-title">Billing Details</h3>
                    
                    <Row>
                      <Col md="6">
                        <div className="form-group">
                          <label className="field-label">First Name *</label>
                          <input
                            type="text"
                            placeholder="Enter first name"
                            className={`form-control ${errors.firstName ? "error_border" : ""}`}
                            {...register("firstName", { required: "First name is required" })}
                          />
                          {errors.firstName && (
                            <span className="error-message">{errors.firstName.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="form-group">
                          <label className="field-label">Last Name *</label>
                          <input
                            type="text"
                            placeholder="Enter last name"
                            className={`form-control ${errors.lastName ? "error_border" : ""}`}
                            {...register("lastName", { required: "Last name is required" })}
                          />
                          {errors.lastName && (
                            <span className="error-message">{errors.lastName.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="form-group">
                          <label className="field-label">Phone *</label>
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            className={`form-control ${errors.phone ? "error_border" : ""}`}
                            {...register("phone", { required: "Phone number is required" })}
                          />
                          {errors.phone && (
                            <span className="error-message">{errors.phone.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="form-group">
                          <label className="field-label">Email *</label>
                          <input
                            type="email"
                            placeholder="Enter email address"
                            className={`form-control ${errors.email ? "error_border" : ""}`}
                            {...register("email", { required: "Email is required" })}
                          />
                          {errors.email && (
                            <span className="error-message">{errors.email.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="12">
                        <div className="form-group">
                          <label className="field-label">Country *</label>
                          <select
                            className={`form-control ${errors.country ? "error_border" : ""}`}
                            {...register("country", { required: "Country is required" })}
                          >
                            <option value="">Select Country</option>
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                          </select>
                          {errors.country && (
                            <span className="error-message">{errors.country.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="form-group">
                          <label className="field-label">State *</label>
                          <input
                            type="text"
                            placeholder="Enter state"
                            className={`form-control ${errors.state ? "error_border" : ""}`}
                            {...register("state", { required: "State is required" })}
                          />
                          {errors.state && (
                            <span className="error-message">{errors.state.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="form-group">
                          <label className="field-label">City *</label>
                          <input
                            type="text"
                            placeholder="Enter city"
                            className={`form-control ${errors.city ? "error_border" : ""}`}
                            {...register("city", { required: "City is required" })}
                          />
                          {errors.city && (
                            <span className="error-message">{errors.city.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="12">
                        <div className="form-group">
                          <label className="field-label">Address *</label>
                          <textarea
                            placeholder="Enter full address"
                            className={`form-control ${errors.address ? "error_border" : ""}`}
                            rows={3}
                            {...register("address", { required: "Address is required" })}
                          />
                          {errors.address && (
                            <span className="error-message">{errors.address.message}</span>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="form-group">
                          <label className="field-label">PIN Code *</label>
                          <input
                            type="text"
                            placeholder="Enter PIN code"
                            className={`form-control ${errors.pincode ? "error_border" : ""}`}
                            {...register("pincode", { required: "PIN code is required" })}
                          />
                          {errors.pincode && (
                            <span className="error-message">{errors.pincode.message}</span>
                          )}
                        </div>
                      </Col>
                    </Row>
                    
                    <h3 className="checkout-title">Payment Method</h3>
                    <div className="payment-methods">
                      <div 
                        className={`payment-option ${payment === 'cod' ? 'selected' : ''}`}
                        onClick={() => setPayment('cod')}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={payment === 'cod'}
                          onChange={(e) => setPayment(e.target.value)}
                        />
                        <label>Cash on Delivery (COD)</label>
                      </div>
                      
                      <div 
                        className={`payment-option ${payment === 'paypal' ? 'selected' : ''}`}
                        onClick={() => setPayment('paypal')}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="paypal"
                          checked={payment === 'paypal'}
                          onChange={(e) => setPayment(e.target.value)}
                        />
                        <label>Online Payment</label>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col lg="5">
                  <div className="order-summary">
                    <h3 className="checkout-title">Order Summary</h3>
                    
                    <div className="cart-items">
                      {cartItems.map((item: any, index: number) => {
                        const price = getPrice(item);
                        const itemKey = getItemKey(item);
                        
                        return (
                          <div key={itemKey} className="cart-item">
                            <img 
                              src={item.img?.[0] || "/static/images/placeholder.png"} 
                              alt="product" 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/static/images/placeholder.png";
                              }}
                            />
                            <div className="item-details">
                              <div className="item-name">{item.name || "Unknown Product"}</div>
                              <div className="item-price">
                                Qty: {item.qty || 1} × {symbol}{price.toFixed(2)}
                              </div>
                            </div>
                            <div className="item-total">
                              {symbol}{(price * (item.qty || 1) * value).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="order-totals">
                      <div className="total-row">
                        <span>Subtotal</span>
                        <span>{symbol}{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="total-row">
                        <span>Tax (10%)</span>
                        <span>{symbol}{taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="total-row">
                        <span>Package Cost</span>
                        <span>{symbol}{packageCost.toFixed(2)}</span>
                      </div>
                      <div className="total-row final">
                        <span>Total</span>
                        <span>{symbol}{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {payment === "cod" ? (
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isProcessingOrder}
                      >
                        {isProcessingOrder ? "Processing..." : "Place Order"}
                      </button>
                    ) : (
                      <div className="paypal-container">
                        <PayPalButtons
                          createOrder={(data, actions) => {
                            return actions.order.create({
                              purchase_units: [{
                                amount: {
                                  value: finalTotal.toFixed(2),
                                  currency_code: "USD"
                                }
                              }],
                              intent: "CAPTURE"
                            });
                          }}
                          onApprove={onPayPalSuccess}
                          onCancel={() => toast.error("Payment cancelled")}
                          onError={(err) => {
                            console.error("PayPal error:", err);
                            toast.error("Payment error occurred");
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </Form>
          )}
        </div>
      </section>
    </>
  );
};

const CheckoutPage: NextPage = () => {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      <CheckoutPageContent />
    </PayPalScriptProvider>
  );
};

export default CheckoutPage;