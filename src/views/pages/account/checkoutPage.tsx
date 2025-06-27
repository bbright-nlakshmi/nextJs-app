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

const CheckoutPage: NextPage = () => {
  const router = useRouter();
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;

  const { cartItems, emptyCart } = useContext(CartContext);

  const [payment, setPayment] = useState("stripe");
  const [shippingOption, setShippingOption] = useState("standard");
  const [taxRate] = useState(0.10); // 10% tax rate

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

  // Helper function to get product by ID (assuming this exists in your system)
  const getProductById = (productId: string) => {
    try {
      // Replace this with your actual product fetching logic
      // This might be from a global state, API call, or product context
      return searchController?.getProductById?.(productId) || null;
    } catch (error) {
      console.warn("Error fetching product:", error);
      return null;
    }
  };

  const getPrice = (item: any): number => {
    if (!item) return 0;
    
    try {
      // First try to get the product/kit from the system
      const product = getProductById(item.productId);
      
      // If we have the product, try to get price from it using methods first
      if (product) {
        // Try Kit getPrice method
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
        
        // Try Product getPrice method
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
      
      // Enhanced price extraction - same logic as working PriceRanges component
      const extractPriceFromObject = (obj: any): number => {
        if (!obj || typeof obj !== 'object') return 0;
        
        // Check standard price fields first
        if ('price' in obj && typeof obj.price === 'number' && obj.price > 0) {
          return obj.price;
        }
        
        // Check Kit-specific price fields
        if ('kitPrice' in obj && typeof obj.kitPrice === 'number' && obj.kitPrice > 0) {
          return obj.kitPrice;
        }
        
        // Check for discount price (prioritize over original price)
        if (obj.discountPrice && typeof obj.discountPrice === 'number' && obj.discountPrice > 0) {
          return obj.discountPrice;
        }
        
        // Check for sale price
        if (obj.salePrice && typeof obj.salePrice === 'number' && obj.salePrice > 0) {
          return obj.salePrice;
        }
        
        // Check for finalPrice
        if (obj.finalPrice && typeof obj.finalPrice === 'number' && obj.finalPrice > 0) {
          return obj.finalPrice;
        }
        
        // Check for currentPrice
        if (obj.currentPrice && typeof obj.currentPrice === 'number' && obj.currentPrice > 0) {
          return obj.currentPrice;
        }
        
        // Check for sellingPrice
        if (obj.sellingPrice && typeof obj.sellingPrice === 'number' && obj.sellingPrice > 0) {
          return obj.sellingPrice;
        }
        
        // Try extracting from nested price objects
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
      
      // Try extracting price from the item itself
      let price = extractPriceFromObject(item);
      if (price > 0) return price;
      
      // Try extracting price from the product data
      if (item.product) {
        price = extractPriceFromObject(item.product);
        if (price > 0) return price;
      }
      
      // Try extracting from the fetched product
      if (product) {
        price = extractPriceFromObject(product);
        if (price > 0) return price;
      }
      
      // Legacy fallback - check if item has productId-based lookup
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

  // const getShippingCost = (): number => {
  //   switch (shippingOption) {
  //     case "free":
  //       return 0;
  //     case "local":
  //       return 50 * value;
  //     case "express":
  //       return 200 * value;
  //     default: // standard
  //       return 100 * value;
  //   }
  // };

  const getTaxAmount = (): number => {
    const subtotal = getSubtotal();
    return subtotal * taxRate;
  };

  // Calculate final total including shipping and tax
  const subtotal = getSubtotal();
  // const shippingCost = getShippingCost();
  const taxAmount = getTaxAmount();
  const finalTotal = subtotal  + taxAmount;

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

    // Store order data
    const orderData = {
      items: cartItems,
      total: finalTotal,
      subtotal: subtotal,
      // shipping: shippingCost,
      tax: taxAmount,
      billingAddress: data,
      paymentMethod: payment,
      orderDate: new Date().toISOString()
    };

    try {
      // Note: Replaced localStorage with sessionStorage for better practice
      sessionStorage.setItem("order-success-data", JSON.stringify(orderData));
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
        items: cartItems,
        total: finalTotal,
        subtotal: subtotal,
        // shipping: shippingCost,
        tax: taxAmount,
        paymentMethod: "paypal",
        paymentId: data.id,
        orderDate: new Date().toISOString()
      };
      
      sessionStorage.setItem("order-success-data", JSON.stringify(orderData));
      emptyCart();
      toast.success("Payment successful!");
      router.push("/pages/order-success");
    });

  const onCancel = () => toast.error("The payment was cancelled!");
  const onError = (err: any) => {
    console.error("PayPal Error:", err);
    toast.error("Payment error occurred");
  };

  const paypalOptions = {
    clientId: "AZ4S98zFa01vym7NVeo_qthZyOnBhtNvQDsjhaZSMH-2_Y9IAJFbSD3HPueErYqN8Sa8WYRbjP7wWtd_",
  };

  const handleShippingChange = (option: string) => {
    setShippingOption(option);
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
                      <h4>Payment Method</h4>
                      <ul>
                        {[
                          
                          { value: "cod", label: "Cash On Delivery" },
                          { value: "Online Paymet", label: "Online Payment" }
                        ].map((option, i) => (
                          <li key={i}>
                            <div className="radio-option">
                              <input
                                type="radio"
                                name="payment-group"
                                id={`payment-${i}`}
                                checked={payment === option.value}
                                onChange={() => setPayment(option.value)}
                              />
                              <label htmlFor={`payment-${i}`}>
                                {option.label}
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {finalTotal > 0 && (
                        <div className="text-right mt-3">
                          {payment === "stripe" || payment === "cod" ? (
                            <button type="submit" className="btn-normal btn">
                              {payment === "cod" ? "Place Order (COD)" : "Place Order"}
                            </button>
                          ) : (
                            <PayPalScriptProvider
                              options={{ 
                                clientId: paypalOptions.clientId, 
                                components: "buttons", 
                                currency: "USD"
                              }}
                            >
                              <PayPalButtons
                                forceReRender={[finalTotal]}
                                createOrder={(data, actions) =>
                                  actions.order.create({
                                    purchase_units: [
                                      {
                                        amount: {
                                          currency_code: "USD",
                                          value: finalTotal.toFixed(2),
                                        },
                                      },
                                    ],
                                    intent: "CAPTURE",
                                  })
                                }
                                onApprove={onSuccess}
                                onCancel={onCancel}
                                onError={onError}
                              />
                            </PayPalScriptProvider>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </Form>
          )}
        </div>
      </section>

      <style jsx>{`
        .form-group {
          margin-bottom: 1rem;
        }
        .form-control {
          width: 100%;
          padding: 0.375rem 0.75rem;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          color: #495057;
          background-color: #fff;
          background-clip: padding-box;
          border: 1px solid #ced4da;
          border-radius: 0.25rem;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        .form-control:focus {
          color: #495057;
          background-color: #fff;
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        .cart-item {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .cart-item:last-child {
          border-bottom: none;
        }
        .product-name {
          font-weight: 500;
          color: #333;
        }
        .product-price {
          color: #666;
          font-size: 0.9em;
        }
        .qty-badge {
          background: #f8f9fa;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }
        .item-total {
          font-weight: 600;
          color: #333;
        }
        .order-box {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: white;
          margin-bottom: 20px;
        }
        .title-box {
          border-bottom: 2px solid #f8f9fa;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .payment-box {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: white;
        }
        .form-check {
          margin-bottom: 8px;
        }
        .form-check-label {
          margin-left: 8px;
          cursor: pointer;
        }
        .sub-total li, .total li {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .total {
          border-top: 2px solid #333;
          margin-top: 10px;
          padding-top: 10px;
        }
        .error-message {
          color: #dc3545;
          font-size: 0.875em;
          margin-top: 5px;
          display: block;
        }
        .error_border {
          border-color: #dc3545 !important;
        }
        .field-label {
          font-weight: 600;
          margin-bottom: 5px;
        }
        .radio-option {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .radio-option input[type="radio"] {
          margin-right: 8px;
        }
      `}</style>
    </>
  );
};

export default CheckoutPage;