"use client";
import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Form, Row, Col } from "reactstrap";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import { CartContext } from "@/helpers/cart/cart.context";
import { useRouter } from "next/navigation";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { toast } from "react-toastify";
import { useCart } from "@/app/models/useCart/useCart";
import { API } from "@/app/services/api.service";
import { appConfig } from "../../../app/config/index"; 
import  RazorpayButton  from "@/app/(MainBody)/pages/account/checkout/components/RazorpayButton";

export interface formType {
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

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const currencyContext = useContext(CurrencyContext);
  const cartContext = useContext(CartContext);
 
  // Safe context access with fallbacks
  const symbol = currencyContext?.selectedCurr?.symbol || '$';
  const contextCartItems = cartContext?.cartItems || [];
  const emptyCart = cartContext?.emptyCart || (() => {});
 
  const initializationRef = useRef({
    cartInitialized: false,
    contextItemsLength: 0
  });
 
  // Custom hooks
  const cartHook = useCart();
 
  // Destructure with fallbacks
  const {
    cartItems = [],
    selectedPaymentMode,
    deliveryAddressModel,
    storeDetails,
    calcCartAmount = () => 0,
    getCartDiscount = () => 0,
    getPackageCost = () => 0,
    getDeliveryCost = () => 0,
    totalTaxAmount = () => 0,
    getCartSavings = () => 0,
    finalOrderAmount = () => 0,
    getOrderItems = () => [],
    setSelectedPaymentMode = () => {},
    setDeliveryAddressModel = () => {},
    setOrderGst = () => {},
    clearCart = () => {},
    addItemToCart = () => {},
    cartIsEmpty = () => true
  } = cartHook || {};
 
  // Local state
  const [gstNumber, setGstNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
 
  const { register, handleSubmit, formState: { errors } } = useForm<formType>();
 
  // Get app configuration values
  const tenantId = appConfig.tenantId;
  const appName = appConfig.appName;
  const defaultStoreId = appConfig.defaultStoreId; // Default store ID from config
 
  // Payment modes - dynamic configuration
  const paymentModes = useMemo(() => [
    { value: "COD", label: "Cash on Delivery (COD)" },
    { value: "PICK_AT_STORE", label: "Pick at Store" },
    { value: "RAZORPAY", label: "Razorpay" },
    { value: "PHONEPE", label: "PhonePe" }
  ], []);
 
  // Countries list - dynamic configuration
  const countries = useMemo(() => [
    { value: "", label: "Select Country" },
    { value: "India", label: "India" },
    { value: "United States", label: "United States" },
    { value: "Canada", label: "Canada" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "Australia", label: "Australia" }
  ], []);
 
  // Transform cart item function - memoized to prevent re-renders
  const transformCartItem = useCallback((item: any) => ({
    id: item.productId || item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
    name: item.name || "Unknown Product",
    img: item.img || ["/static/images/placeholder.png"],
    cartItemCount: item.qty || 1,
    cartPurchaseOptionStr: item.purchaseOptionStr || "default",
    price: item.price || 0,
    discountPrice: item.discountPrice,
    taxType: item.taxType || "EXCLUSIVE",
    taxAmount: item.taxAmount || 0,
    active: true,
    isReturnable: item.isReturnable || false,
    categoryName: item.category || "General",
    categoryID: item.categoryId || "default"
  }), []);
 
  // Initialize cart from context - only once and only when items change
  useEffect(() => {
    const currentLength = contextCartItems?.length || 0;
   
    if (!initializationRef.current.cartInitialized &&
        currentLength > 0 &&
        currentLength !== initializationRef.current.contextItemsLength &&
        addItemToCart) {
     
      try {
        contextCartItems.forEach((item: any) => {
          addItemToCart(transformCartItem(item));
        });
        initializationRef.current.cartInitialized = true;
        initializationRef.current.contextItemsLength = currentLength;
      } catch (error) {
        console.error("Error initializing cart:", error);
        toast.error("Error loading cart items");
      }
    }
  }, [contextCartItems?.length]);
 
  // Memoized calculations with stable dependencies
  const cartCalculations = useMemo(() => {
    try {
      const cartAmount = calcCartAmount();
      const packageCost = getPackageCost(cartAmount);
      const deliveryCharges = getDeliveryCost(cartAmount);
      const discountAmount = getCartDiscount();
      const taxAmount = totalTaxAmount();
      const totalSavings = getCartSavings();
      const finalTotal = finalOrderAmount();
     
      return {
        cartAmount,
        packageCost,
        deliveryCharges,
        discountAmount,
        taxAmount,
        totalSavings,
        finalTotal
      };
    } catch (error) {
      console.error("Error calculating cart totals:", error);
      return {
        cartAmount: 0,
        packageCost: 0,
        deliveryCharges: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalSavings: 0,
        finalTotal: 0
      };
    }
  }, [cartItems.length, selectedPaymentMode]);
 
  const handleGstChange = useCallback((gst: string) => {
    setGstNumber(gst);
    setOrderGst(gst);
  }, [setOrderGst]);
 
  // Create delivery address model matching the expected database schema
  const createDeliveryAddressModel = useCallback((formData: formType) => {
    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      city: formData.city,
      pinCode: formData.pincode,
      phoneNumber: formData.phone,
      lat: 0,
      lng: 0,
      atStore: selectedPaymentMode === "PICK_AT_STORE" ? 1 : 0
    };
  }, [selectedPaymentMode]);
 
  // Create OrderModel class for API compatibility - matching the database schema
  const createOrderModel = useCallback((orderData: any) => {
    const deliveryAddressModel = createDeliveryAddressModel(orderData.billingDetails);
   
    // Convert order items to proper format
    const orderItemsArray = Array.isArray(orderData.items) ? orderData.items :
      (orderData.items && typeof orderData.items === 'object') ? Object.values(orderData.items) : [];
   
    // Convert tax_group to proper object format (not Map)
    const taxGroupObj: { [key: string]: number } = {};
   
    // Convert txn_details to proper object format (not Map)  
    const txnDetailsObj: { [key: string]: number } = {};
   
    // Get store ID and store name - prioritize from storeDetails, fallback to config
    const storeId = storeDetails?.id || defaultStoreId;
    const storeName = storeDetails?.name || appName || "Default Store";
   
    return {
      toJsonObj: () => ({
        // Core order fields matching OrderModel
        id: orderData.id,
        delivery_address: deliveryAddressModel,
        order_time: new Date().toISOString(),
        creation_time: new Date().toISOString(),
        payment_mode: orderData.paymentMethod,
        phone_number: orderData.billingDetails.phone,
        user_name: `${orderData.billingDetails.firstName} ${orderData.billingDetails.lastName}`,
        store: storeName,
        store_id: defaultStoreId, // Dynamic store ID from config or storeDetails
        device_token: undefined,
       
        // Financial calculations
        cart_total: orderData.totals.cartAmount,
        final_order_total: orderData.totals.finalTotal,
        final_order_total_without_delivery: orderData.totals.finalTotal - orderData.totals.deliveryCharges,
        coupon_code: "",
        coupon_amount: 0,
        discount_amount: orderData.totals.discountAmount,
        package_cost: orderData.totals.packageCost,
        delivery_cost: orderData.totals.deliveryCharges,
        total_savings: orderData.totals.totalSavings,
        tax_total: orderData.totals.taxAmount,
        tax_group: taxGroupObj, // Object instead of Map
       
        // Order items - convert to proper format expected by database
        order_items: Array.isArray(orderItemsArray) ? orderItemsArray : [],
       
        // Notification flags
        delivery_notification_sent: false,
        user_notification_sent: false,
       
        // Additional fields - img should be an array
        img: [],
        assigned_delivery: {
          id: "",
          deliveryBoyName: "",
          deliveryBoyPhone: "",
          status: "pending",
          assignedTime: "",
          estimatedDeliveryTime: ""
        },
        order_complete: false,
        invoice_series: "",
        order_accept_status: "PENDING",
        order_gst: orderData.gstNumber || "",
        is_subscription: false,
        txn_details: txnDetailsObj // Object instead of Map
      })
    };
  }, [createDeliveryAddressModel, storeDetails, defaultStoreId, appName]);
 
  // Generate order ID dynamically
  const generateOrderId = useCallback(() => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `ORDER-${timestamp}-${randomSuffix}`;
  }, []);
 
  // Generate database ID (numeric)
  const generateDatabaseId = useCallback(() => {
    return Date.now(); // Use timestamp as unique numeric ID
  }, []);
 
  // Get payment method display text
  const getPaymentMethodDisplayText = useCallback((paymentMode: string, isProcessing: boolean) => {
    if (isProcessing) return "Processing...";
   
    const paymentTexts: { [key: string]: string } = {
      "COD": "Place Order (COD)",
      "PICK_AT_STORE": "Place Order (Pick at Store)",
      "PHONEPE": "Pay with PhonePe",
      "RAZORPAY": "Pay with Razorpay"
    };
   
    return paymentTexts[paymentMode] || "Place Order";
  }, []);
  const [razorpayOrderData, setRazorpayOrderData] = useState<any>(null);
  const [razorpayOrderModel, setRazorpayOrderModel] = useState<any>(null);
  const [razorpayDeliveryAddress, setRazorpayDeliveryAddress] = useState<any>(null);

  // Form submission - using saveOrder API function
  const onSubmit = useCallback(async (data: formType) => {
    try {
      setIsProcessing(true);
 
      if (!selectedPaymentMode) {
        toast.error("Please select a payment method");
        return;
      }
 
      // Create delivery address model first
      const deliveryAddress = createDeliveryAddressModel(data);
      setDeliveryAddressModel(deliveryAddress);
      setRazorpayDeliveryAddress(deliveryAddress);

      // Prepare order data with proper structure
      const orderData = {
        id: generateDatabaseId(),
        orderId: generateOrderId(),
        items: getOrderItems(),
        billingDetails: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          country: data.country,
          state: data.state,
          city: data.city,
          address: data.address,
          pincode: data.pincode
        },
        paymentMethod: selectedPaymentMode,
        totals: {
          cartAmount: cartCalculations.cartAmount,
          discountAmount: cartCalculations.discountAmount,
          taxAmount: cartCalculations.taxAmount,
          packageCost: cartCalculations.packageCost,
          deliveryCharges: cartCalculations.deliveryCharges,
          totalSavings: cartCalculations.totalSavings,
          finalTotal: cartCalculations.finalTotal
        },
        gstNumber: gstNumber || undefined,
        storeDetails: storeDetails,
        orderDate: new Date().toISOString(),
        status: "pending"
      };
 
      // Create order model with proper database schema
      const orderModel = createOrderModel(orderData);
      
      setRazorpayOrderData(orderData);
      setRazorpayOrderModel(orderModel);

      console.log("Raw order items from getOrderItems():", getOrderItems());
      console.log("Store ID being used:", storeDetails?.id || defaultStoreId);
      console.log("Order payload being sent:", JSON.stringify(orderModel.toJsonObj(), null, 2));
 
      // Call saveOrder API function using singleton instance
      await API.saveOrder(orderModel);
 
      // Handle successful order creation
      const orderSuccessData = {
        ...orderData,
        deliveryAddress: deliveryAddress, // Include delivery address for success page
        apiResponse: { success: true }
      };
 
      sessionStorage.setItem("order-success-data", JSON.stringify(orderSuccessData));
     
      // Clear cart
      clearCart();
      emptyCart();
     
      toast.success("Order placed successfully!");
      router.push("/pages/order-success");
 
    } catch (error) {
      console.error("Order submission error:", error);
      // Error handling is already done in the saveOrder function via NotificationService
      // Just show a generic toast message
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedPaymentMode,
    cartCalculations,
    gstNumber,
    storeDetails,
    router,
    setDeliveryAddressModel,
    clearCart,
    emptyCart,
    getOrderItems,
    generateOrderId,
    generateDatabaseId,
    createOrderModel,
    createDeliveryAddressModel
  ]);
 
  // Early return for empty cart
  if (cartIsEmpty()) {
    return (
      <>
        <Breadcrumb title="checkout" parent="home" />
        <section className="checkout-container">
          <div className="container">
            <div className="empty-cart">
              <h3>Your cart is empty</h3>
              <button
                className="btn-primary"
                onClick={() => router.push("/shop")}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }
 
  return (
    <>
      <Breadcrumb title="checkout" parent="home" />
      <section className="checkout-container">
        <div className="container">
          {!storeDetails?.active && (
            <div className="alert alert-warning">
              <strong>Notice:</strong> Store is currently inactive. Orders may be delayed.
            </div>
          )}
 
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
                          {countries.map((country) => (
                            <option key={country.value} value={country.value}>
                              {country.label}
                            </option>
                          ))}
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
                   
                    <Col md="6">
                      <div className="form-group">
                        <label className="field-label">GST Number (Optional)</label>
                        <input
                          type="text"
                          placeholder="Enter GST number"
                          className="form-control"
                          value={gstNumber}
                          onChange={(e) => handleGstChange(e.target.value)}
                        />
                      </div>
                    </Col>
                  </Row>
                 
                  <h3 className="checkout-title">Payment Method</h3>
                  <div className="payment-methods">
                    {paymentModes.map((mode) => (
                      <div
                        key={mode.value}
                        className={`payment-option ${selectedPaymentMode === mode.value ? 'selected' : ''}`}
                        onClick={() => setSelectedPaymentMode(mode.value)}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={mode.value}
                          checked={selectedPaymentMode === mode.value}
                          onChange={(e) => setSelectedPaymentMode(e.target.value)}
                        />
                        <label>{mode.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
             
              <Col lg="5">
                <div className="order-summary">
                  <h3 className="checkout-title">Order Summary</h3>
                 
                  <div className="cart-items">
                    {cartItems.map((item, index) => (
                      <div key={`${item.id}_${item.cartPurchaseOptionStr}_${index}`} className="cart-item">
                        <img
                          src={item.img[0] || "/static/images/placeholder.png"}
                          alt={item.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/static/images/placeholder.png";
                          }}
                        />
                        <div className="item-details">
                          <div className="item-name">{item.name}</div>
                          <div className="item-price">
                            Qty: {item.cartItemCount} × {symbol}{item.price.toFixed(2)}
                          </div>
                          {item.discountPrice && item.discountPrice < item.price && (
                            <div className="item-discount">
                              Discount: {symbol}{((item.price - item.discountPrice) * item.cartItemCount).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="item-total">
                          {symbol}{((item.discountPrice || item.price) * item.cartItemCount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                 
                  <div className="order-totals">
                    <div className="total-row">
                      <span>Cart Total</span>
                      <span>{symbol}{cartCalculations.cartAmount.toFixed(2)}</span>
                    </div>
                   
                    {cartCalculations.discountAmount > 0 && (
                      <div className="total-row discount">
                        <span>Item Discount</span>
                        <span>-{symbol}{cartCalculations.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                   
                    {cartCalculations.taxAmount > 0 && (
                      <div className="total-row">
                        <span>Tax</span>
                        <span>{symbol}{cartCalculations.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                   
                    {cartCalculations.packageCost > 0 && (
                      <div className="total-row">
                        <span>Package Cost</span>
                        <span>{symbol}{cartCalculations.packageCost.toFixed(2)}</span>
                      </div>
                    )}
                   
                    {cartCalculations.deliveryCharges > 0 && (
                      <div className="total-row">
                        <span>Delivery Charges</span>
                        <span>{symbol}{cartCalculations.deliveryCharges.toFixed(2)}</span>
                      </div>
                    )}
                   
                    {cartCalculations.totalSavings > 0 && (
                      <div className="total-row savings">
                        <span>Total Savings</span>
                        <span>{symbol}{cartCalculations.totalSavings.toFixed(2)}</span>
                      </div>
                    )}
                   
                    <div className="total-row final">
                      <span>Final Total</span>
                      <span>{symbol}{cartCalculations.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                 
                  {selectedPaymentMode === "RAZORPAY" ? (
                    <RazorpayButton
                      orderData={razorpayOrderData}
                      orderModel={razorpayOrderModel}
                      deliveryAddress={razorpayDeliveryAddress}
                      finalTotal={cartCalculations.finalTotal}
                      onSuccess={() => {
                        clearCart();
                        emptyCart();
                        router.push("/pages/order-success");
                      }}
                    />
                  ) : (
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isProcessing || !selectedPaymentMode}
                    >
                      {getPaymentMethodDisplayText(selectedPaymentMode, isProcessing)}
                    </button>
                  )}                
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </section>
    </>
  );
};
 
export default CheckoutPage;