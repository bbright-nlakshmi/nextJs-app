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

// PayPal configuration
const paypalOptions = {
  clientId: "AZ4S98zFa01vym7NVeo_qthZyOnBhtNvQDsjhaZSMH-2_Y9IAJFbSD3HPueErYqN8Sa8WYRbjP7wWtd_",
  currency: "USD",
  intent: "capture"
};

// Static order data template
const createStaticOrderData = (formData: formType, paymentMethod: string, cartItems: any[], totals: any) => {
  const currentTime = new Date().toISOString();
  const orderNumber = Math.floor(Math.random() * 1000);
  
  return {
    "id": `STEAKSSTAY-E${orderNumber}`,
    "img": [],
    "store": "store",
    "store_id": "e9c60eb6-e7a7-4068-8aa4-b63231d4b0af",
    "order_gst": "",
    "tax_group": {},
    "tax_total": totals.tax,
    "user_name": `${formData.firstName} ${formData.lastName}`,
    "cart_total": totals.subtotal,
    "order_time": currentTime,
    "coupon_code": "",
    "order_items": cartItems.map(item => ({
      "id": item.productId || "8f757cd5-e241-49dc-8b9a-8a1ea9ecc6a9",
      "url": item.image || "https://rupeecom-adminportal.blr1.digitaloceanspaces.com/upload/ikngosji/1751615315463199186-i want a logo for my consultancy *KridhnaVidya* it need to be modern and sleek design with lord kridhna reference or with krishnas fluet refference.jpg",
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
      "cost_price": item.price || 10,
      "is_product": true,
      "category_id": "acb67cd0-f12d-4981-b371-56452919778a",
      "category_name": item.category || "General",
      "choosed_price": (item.price || 10) * item.qty,
      "collected_tax": 0,
      "is_returnable": false,
      "sale_quantity": item.qty.toString(),
      "cart_item_count": item.qty,
      "order_kit_items": [],
      "sale_quantity_str": `${item.qty}kg`,
      "base_choosed_price": (item.price || 10) * item.qty,
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

  // Calculate totals
  const getPrice = (item: any) => item.price || 10;
  const subtotal = cartItems.reduce((sum: number, item: any) => sum + getPrice(item) * item.qty, 0);
  const taxAmount = subtotal * 0.1;
  const packageCost = 5;
  const finalTotal = subtotal + taxAmount + packageCost;

  const submitOrder = async (orderData: any) => {
    try {
      const response = await API.createOrder(orderData);
      return response;
    } catch (error) {
      console.error("Order submission failed:", error);
      throw error;
    }
  };

  const onSubmit = async (data: formType) => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    setIsProcessingOrder(true);
    
    try {
      const totals = {
        subtotal: subtotal,
        tax: taxAmount,
        final: finalTotal
      };
      
      const orderData = createStaticOrderData(data, payment, cartItems, totals);
      await submitOrder(orderData);
      
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
        status: "pending"
      };

      sessionStorage.setItem("order-success-data", JSON.stringify(orderSuccessData));
      
      emptyCart();
      toast.success("Order placed successfully!");
      router.push("/pages/order-success");
      
    } catch (error) {
      toast.error("Error processing order. Please try again.");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const onPayPalSuccess = (data: any, actions: any) =>
    actions.order.capture().then(async (paymentDetails: any) => {
      setIsProcessingOrder(true);
      
      try {
        const formData = getValues();
        const totals = {
          subtotal: subtotal,
          tax: taxAmount,
          final: finalTotal
        };
        
        const orderData = createStaticOrderData(formData, "paypal", cartItems, totals);
        await submitOrder(orderData);
        
        const orderSuccessData = {
          orderId: orderData.id,
          items: cartItems,
          total: finalTotal,
          paymentMethod: "paypal",
          paymentId: data.id,
          orderDate: new Date().toISOString(),
          status: "completed"
        };
        
        sessionStorage.setItem("order-success-data", JSON.stringify(orderSuccessData));
        
        emptyCart();
        toast.success("Payment successful!");
        router.push("/pages/order-success");
        
      } catch (error) {
        toast.error("Error processing order. Please try again.");
      } finally {
        setIsProcessingOrder(false);
      }
    });

  return (
    <>
      <style jsx>{`
        .checkout-container {
          background: #f8f9fa;
          padding: 60px 0;
        }
        
        .checkout-form {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .checkout-title {
          color: #333;
          font-size: 24px;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 2px solid #007bff;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .field-label {
          font-weight: 600;
          color: #555;
          margin-bottom: 8px;
          display: block;
        }
        
        .form-control {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }
        
        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        
        .error_border {
          border-color: #dc3545 !important;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }
        
        .order-summary {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: sticky;
          top: 20px;
        }
        
        .cart-item {
          display: flex;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }
        
        .cart-item img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 5px;
          margin-right: 15px;
        }
        
        .item-details {
          flex: 1;
        }
        
        .item-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }
        
        .item-price {
          color: #666;
          font-size: 14px;
        }
        
        .item-total {
          font-weight: 600;
          color: #007bff;
        }
        
        .order-totals {
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        
        .total-row.final {
          border-bottom: none;
          font-weight: 600;
          font-size: 18px;
          color: #333;
          border-top: 2px solid #007bff;
          padding-top: 15px;
        }
        
        .payment-methods {
          margin: 20px 0;
        }
        
        .payment-option {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .payment-option:hover {
          border-color: #007bff;
          background: #f8f9ff;
        }
        
        .payment-option.selected {
          border-color: #007bff;
          background: #f8f9ff;
        }
        
        .payment-option input {
          margin-right: 10px;
        }
        
        .btn-primary {
          background: #007bff;
          border: none;
          padding: 12px 30px;
          border-radius: 5px;
          font-weight: 600;
          width: 100%;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .btn-primary:hover {
          background: #0056b3;
        }
        
        .btn-primary:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .empty-cart {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .empty-cart h3 {
          color: #666;
          margin-bottom: 20px;
        }
        
        .paypal-container {
          margin-top: 20px;
        }
        
        @media (max-width: 768px) {
          .checkout-container {
            padding: 30px 0;
          }
          
          .checkout-form,
          .order-summary {
            padding: 20px;
          }
          
          .cart-item {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .cart-item img {
            margin-bottom: 10px;
          }
        }
      `}</style>

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
                        <label>PayPal</label>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col lg="5">
                  <div className="order-summary">
                    <h3 className="checkout-title">Order Summary</h3>
                    
                    <div className="cart-items">
                      {cartItems.map((item: any, index: number) => (
                        <div key={index} className="cart-item">
                          
                          <div className="item-details">
                            <div className="item-name">{item.name}</div>
                            <div className="item-price">
                              Qty: {item.qty} × {symbol}{getPrice(item).toFixed(2)}
                            </div>
                          </div>
                          <div className="item-total">
                            {symbol}{(getPrice(item) * item.qty).toFixed(2)}
                          </div>
                        </div>
                      ))}
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
                              }]
                            });
                          }}
                          onApprove={onPayPalSuccess}
                          onCancel={() => toast.error("Payment cancelled")}
                          onError={(err) => toast.error("Payment error occurred")}
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