"use client";
import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Form, Row, Col } from "reactstrap";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import { CartContext } from "@/helpers/cart/cart.context";
import { useRouter } from "next/navigation";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { toast } from "react-toastify";
import { useCart } from "@/app/providers/cart_controller/cartController";
import { appConfig } from "../../../app/config/";
import { DeliveryAddressModel } from "@/app/models/delivery_address_model/delivery_address";
import { DeliveryAssign, OrderItemsModel, OrderModel } from "@/app/models/order/order";
import { API } from "@/app/globalProvider";
import  RazorpayButton  from "@/app/(MainBody)/pages/account/checkout/components/RazorpayButton";

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
 
// Debug component to show all current values (keeping from first code)
const DebugPanel: React.FC<{
  cartItems: any[],
  calculations: any,
  formData: any,
  selectedPaymentMode: string,
  deliveryAddressModel: any,
  storeDetails: any
}> = ({ cartItems, calculations, formData, selectedPaymentMode, deliveryAddressModel, storeDetails }) => {
  const [showDebug, setShowDebug] = useState(false);
 
  if (process.env.NODE_ENV === 'production') return null;
 
  return (
    <div className="debug-panel" style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f8f9fa',
      border: '1px solid #ddd',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <button
        type="button"
        onClick={() => setShowDebug(!showDebug)}
        style={{ marginBottom: '10px', fontSize: '10px' }}
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </button>
     
      {showDebug && (
        <div>
          <h6>Debug Information</h6>
          <div><strong>Cart Items:</strong> {cartItems?.length || 0}</div>
          <div><strong>Cart Amount:</strong> {calculations?.cartAmount || 0}</div>
          <div><strong>Final Total:</strong> {calculations?.finalTotal || 0}</div>
          <div><strong>Payment Mode:</strong> {selectedPaymentMode || 'None'}</div>
          <div><strong>Store ID:</strong> {storeDetails?.id || 'None'}</div>
          <div><strong>Delivery Address:</strong> {deliveryAddressModel ? 'Set' : 'None'}</div>
          <div><strong>Form Valid:</strong> {formData ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};
 
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
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [orderPreview, setOrderPreview] = useState<any>(null);
  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm<formType>();
  const [razorpayOrderData, setRazorpayOrderData] = useState<any>(null);
  const [razorpayOrderModel, setRazorpayOrderModel] = useState<any>(null);
  const [razorpayDeliveryAddress, setRazorpayDeliveryAddress] = useState<any>(null);

  // Watch all form fields for real-time validation display
  const watchedFields = watch();
 
  // Get app configuration values
  const appName = appConfig.appName;
  const defaultStoreId = appConfig.defaultStoreId;
 
  // Payment modes - dynamic configuration
  const paymentModes = useMemo(() => [
    { value: "COD", label: "Cash on Delivery (COD)" },
    { value: "PICK_AT_STORE", label: "Pick at Store" },
    { value: "RAZORPAY", label: "Razorpay" }
    // { value: "PHONEPE", label: "PhonePe" }
  ], []);
 
  // Countries list - dynamic configuration
  const countries = useMemo(() => [
    { value: "", label: "Select Country" },
    { value: "India", label: "India" },
    { value: "United States", label: "United States" },
  ], []);
 
  // Transform cart item function - memoized to prevent re-renders
  const transformCartItem = useCallback((item: any) => ({
    id: item.productId || item.id,
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
 
  // Validation function to check all data before order placement
  const validateOrderData = useCallback(() => {
    const validationErrors = [];
    const formData = getValues();
 
    // Check form data
    if (!formData.firstName?.trim()) validationErrors.push("First name is required");
    if (!formData.lastName?.trim()) validationErrors.push("Last name is required");
    if (!formData.phone?.trim()) validationErrors.push("Phone number is required");
    if (!formData.email?.trim()) validationErrors.push("Email is required");
    if (!formData.country?.trim()) validationErrors.push("Country is required");
    if (!formData.state?.trim()) validationErrors.push("State is required");
    if (!formData.city?.trim()) validationErrors.push("City is required");
    if (!formData.address?.trim()) validationErrors.push("Address is required");
    if (!formData.pincode?.trim()) validationErrors.push("PIN code is required");
 
    // Check payment mode
    if (!selectedPaymentMode) validationErrors.push("Payment method is required");
 
    // Check cart items
    if (!cartItems || cartItems.length === 0) validationErrors.push("Cart is empty");
   
    // Check calculations
    if (cartCalculations.finalTotal <= 0) validationErrors.push("Invalid order total");
    if (cartCalculations.cartAmount <= 0) validationErrors.push("Invalid cart amount");
 
    // Check store details
    if (!storeDetails?.id && !defaultStoreId) validationErrors.push("Store ID is missing");
 
    return validationErrors;
  }, [cartItems, selectedPaymentMode, cartCalculations, storeDetails, getValues, defaultStoreId]);
 
  // Create order preview for display
  const createOrderPreview = useCallback(() => {
    const formData = getValues();
    const validationErrors = validateOrderData();
 
    return {
      isValid: validationErrors.length === 0,
      validationErrors,
      formData,
      cartItems: cartItems || [],
      calculations: cartCalculations,
      paymentMode: selectedPaymentMode,
      gstNumber: gstNumber,
      storeInfo: {
        name: storeDetails?.name || appName || "Default Store",
        id: storeDetails?.id || defaultStoreId,
        active: storeDetails?.active
      },
      orderSummary: {
        itemCount: cartItems?.length || 0,
        totalAmount: cartCalculations.finalTotal,
        estimatedDelivery: selectedPaymentMode === 'PICK_AT_STORE' ? 'Pick up at store' : '2-3 business days'
      },
      billingDetails: {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        phone: formData.phone || '',
        email: formData.email || '',
        country: formData.country || '',
        state: formData.state || '',
        city: formData.city || '',
        address: formData.address || '',
        pincode: formData.pincode || ''
      },
      paymentMethods: paymentModes.map(mode => ({
        ...mode,
        selected: mode.value === selectedPaymentMode
      }))
    };
  }, [cartItems, cartCalculations, selectedPaymentMode, storeDetails, getValues, validateOrderData, appName, defaultStoreId, gstNumber, paymentModes]);
 
  const handleGstChange = useCallback((gst: string) => {
    setGstNumber(gst);
    setOrderGst(gst);
  }, [setOrderGst]);
 
  // Create delivery address model matching the expected database schema
  const createDeliveryAddressModel = useCallback((formData: formType) => {
    return new DeliveryAddressModel({
      id: Date.now(),
      atStore: selectedPaymentMode === 'PICK_AT_STORE' ? 1 : 0,
      firstName: formData.firstName,
      lastName: formData.lastName,
      pinCode: formData.pincode,
      city: formData.city,
      address: formData.address,
      phoneNumber: formData.phone,
      isChoosed: null,
      lat: 0,
      lng: 0,
    });
  }, [selectedPaymentMode]);
 
  // Generate order ID dynamically
  const generateOrderId = useCallback(() => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `ORDER-${timestamp}-${randomSuffix}`;
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

  // Create DeliveryAssign using the imported class
  const createDeliveryAssign = useCallback(() => {
    return new DeliveryAssign({
      name: 'Not Assigned',
      phone: ''
    });
  }, []);
 
  // Create OrderItemsModel array using the imported class
  const createOrderItems = useCallback(() => {
    const orderItems: OrderItemsModel[] = [];
   
    cartItems.forEach(item => {
      const basePrice = item.price * item.cartItemCount;
      const discountedPrice = item.discountPrice ?
        item.discountPrice * item.cartItemCount : basePrice;
      
      const orderItemData = {
        id: item.id,
        name: item.name,
        baseChoosedPrice: basePrice,
        choosedPrice: discountedPrice,
        collectedTax: item.taxAmount ? item.taxAmount * item.cartItemCount : 0,
        costPrice: item.price,
        saleQuantityStr: item.cartPurchaseOptionStr,
        saleQuantity: item.cartItemCount,
        isProduct: true,
        isReturnable: item.isReturnable || false,
        url: item.img[0] || '',
        rating: 0,
        categoryName: item.categoryName || '',
        categoryID: item.categoryID || '',
        cartItemCount: item.cartItemCount,
        orderKitItems: [],
        selfDocRef: undefined,
        active: item.active !== undefined ? item.active : true,
        taxType: item.taxType || "EXCLUSIVE",
        taxAmount: item.taxAmount || 0,
        selectedSubscription:{},
      };
    
      const orderItem = new OrderItemsModel(orderItemData);
 
      // Set status based on payment mode using the model's initialized status
      orderItem.status.process = selectedPaymentMode === 'PICK_AT_STORE' ? null : new Date().toISOString();
      orderItem.status.deliver = selectedPaymentMode === 'PICK_AT_STORE' ? new Date().toISOString() : null;
      orderItem.status.confirm = null;
      orderItem.status.package = null;
      orderItem.status.cancel = null;
      orderItem.status.transit = null;
    
      orderItems.push(orderItem);
    });
 
    return orderItems;
  }, [cartItems, selectedPaymentMode]);
  
  // Create complete order model using the imported OrderModel class
  const createOrderModel = useCallback((formData: formType) => {
    const orderId = generateOrderId();
    const currentTime = new Date().toISOString();
    const deliveryAddress = createDeliveryAddressModel(formData);
    const orderItems = createOrderItems();
    const deliveryAssign = createDeliveryAssign();
 
    // Create tax group from order items
    const taxGroup: Record<string, number> = {};
    orderItems.forEach(item => {
      const taxType = item.taxType || 'EXCLUSIVE';
      taxGroup[taxType] = (taxGroup[taxType] || 0) + item.collectedTax;
    });
   
    const orderData = {
      id: orderId,
      deliveryAddress: deliveryAddress,
      orderTime: currentTime,
      creationTime: currentTime,
      paymentMode: selectedPaymentMode,
      phoneNumber: formData.phone,
      userName: `${formData.firstName} ${formData.lastName}`,
      store: storeDetails?.name || appName || "Default Store",
      storeId: storeDetails?.id || defaultStoreId,
      cartTotal: cartCalculations.cartAmount,
      finalOrderTotal: cartCalculations.finalTotal,
      finalOrderTotalWithOutDelivery: cartCalculations.finalTotal - cartCalculations.deliveryCharges,
      couponCode: "",
      couponAmount: 0,
      discountAmount: cartCalculations.discountAmount,
      packageCost: cartCalculations.packageCost,
      deliveryCost: cartCalculations.deliveryCharges,
      totalSavings: cartCalculations.totalSavings,
      taxTotal: cartCalculations.taxAmount,
      taxGroup: taxGroup,
      orderItems: orderItems,
      img: orderItems.map(item => item.url).filter(url => url),
      assignedDelivery: deliveryAssign,
      orderComplete: false,
      orderAcceptStatus: "PENDING",
      deviceToken: undefined,
      txnDetails: {},
      deliveryNotificationSent: false,
      userNotificationSent: false,
      orderGst: gstNumber || undefined
    };
 
    return new OrderModel(orderData);
  }, [generateOrderId, createDeliveryAddressModel, createOrderItems, createDeliveryAssign, selectedPaymentMode, storeDetails, appName, defaultStoreId, cartCalculations, gstNumber]);
 // Add this new function to your CheckoutPage component
const prepareOrderData = useCallback((formData: formType) => {
  // Validate all order data
  const validationErrors = validateOrderData();
  if (validationErrors.length > 0) {
    validationErrors.forEach(error => toast.error(error));
    return null;
  }

  // Create delivery address model
  const deliveryAddress = createDeliveryAddressModel(formData);
  
  // Create complete order model
  const orderModel = createOrderModel(formData);
  
  const orderData = {
    billingDetails: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pincode: formData.pincode
    },
    amount: cartCalculations.finalTotal,
    currency: 'INR',
    orderId: orderModel.id
  };

  return { orderData, orderModel, deliveryAddress };
}, [validateOrderData, createDeliveryAddressModel, createOrderModel, cartCalculations]);

  // Handle form submission and order placement
  const onSubmit = useCallback(async (formData: formType) => {
    try {
      setIsProcessing(true);
      setShowValidationErrors(true);
      
      const preparedData = prepareOrderData(formData);
    if (!preparedData) return;

    const { orderData, orderModel, deliveryAddress } = preparedData;
    setRazorpayDeliveryAddress(deliveryAddress);
    setRazorpayOrderData(orderData);
    setRazorpayOrderModel(orderModel);
      // Validate all order data
      const validationErrors = validateOrderData();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }
 
      // Create delivery address model and set it
      // const deliveryAddress = createDeliveryAddressModel(formData);
      // setDeliveryAddressModel(deliveryAddress);
      // setRazorpayDeliveryAddress(deliveryAddress);
      // Create complete order model
      // const orderModel = createOrderModel(formData);
      // setRazorpayOrderData(orderData);
    //   const orderData = {
    //   billingDetails: {
    //     firstName: formData.firstName,
    //     lastName: formData.lastName,
    //     email: formData.email,
    //     phone: formData.phone,
    //     address: formData.address,
    //     city: formData.city,
    //     state: formData.state,
    //     country: formData.country,
    //     pincode: formData.pincode
    //   },
    //   amount: cartCalculations.finalTotal,
    //   currency: 'INR',
    //   orderId: orderModel.id
    // };
    
    if (selectedPaymentMode !== 'RAZORPAY') {
    
      await API.saveOrder(orderModel)
      
      // Create order preview for confirmation
      const preview = createOrderPreview();
      setOrderPreview(preview);
 
      console.log("Order Model Created:", orderModel.toJsonObj());
     
      // Here you would typically send the order to your backend API
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
    }else{
      

    }
      // Handle different payment modes
      switch (selectedPaymentMode) {
        case 'COD':
        case 'PICK_AT_STORE':
          toast.success("Order placed successfully!");
          clearCart();  
          emptyCart();
          break;
        case 'RAZORPAY':
          toast.info("Redirecting to payment gateway...");
        case 'PHONEPE':
          // Redirect to payment gateway
          toast.info("Redirecting to payment gateway...");
          // Here you would integrate with actual payment gateway
          break;
        default:
          toast.error("Invalid payment method selected");
      }
 
    } catch (error) {
      console.error("Order placement error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [prepareOrderData,  createOrderPreview, selectedPaymentMode, clearCart, emptyCart, router]);
//  validateOrderData, createDeliveryAddressModel, setDeliveryAddressModel, createOrderModel,
  // Update order preview when form changes
  useEffect(() => {
    if (Object.keys(watchedFields).length > 0) {
      const preview = createOrderPreview();
      setOrderPreview(preview);
    }
  }, [watchedFields, createOrderPreview]);
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
      <DebugPanel
        cartItems={cartItems}
        calculations={cartCalculations}
        formData={watchedFields}
        selectedPaymentMode={selectedPaymentMode}
        deliveryAddressModel={deliveryAddressModel}
        storeDetails={storeDetails}
      />
 
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
                          {...register("phone", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^[0-9]{10}$/,
                              message: "Please enter a valid 10-digit phone number"
                            }
                          })}
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
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Please enter a valid email address"
                            }
                          })}
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
                          {...register("pincode", {
                            required: "PIN code is required",
                            pattern: {
                              value: /^[0-9]{6}$/,
                              message: "Please enter a valid 6-digit PIN code"
                            }
                          })}
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
 
                  {/* Validation Errors */}
                  {showValidationErrors && orderPreview?.validationErrors?.length > 0 && (
                    <div className="alert alert-danger">
                      <h6>Please fix the following errors:</h6>
                      <ul className="mb-0">
                        {orderPreview.validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* <button
                    type="submit"
                    className="btn-primary"
                    disabled={isProcessing || !selectedPaymentMode}
                  >
                    {getPaymentMethodDisplayText(selectedPaymentMode, isProcessing)}
                  </button> */}
                  <div className="checkout-footer mt-4">
                    {selectedPaymentMode === "RAZORPAY" ? (
                      <RazorpayButton
                        formData={getValues()}
                        prepareOrderData={prepareOrderData}
                        // orderData={razorpayOrderData}
                        // orderModel={razorpayOrderModel}
                        // deliveryAddress={razorpayDeliveryAddress}
                        finalTotal={cartCalculations.finalTotal}
                        onSuccess={() => {
                          toast.success("Payment successful, order placed!");
                          clearCart();
                          emptyCart();
                          router.push("/pages/order-success");
                        }}
                      />  
                    ) : (
                  <button
                    type="submit"
                    className="btn btn-solid"
                    disabled={isProcessing}
                  >
                  {getPaymentMethodDisplayText(selectedPaymentMode, isProcessing)}
                    </button>
                )}
              </div>
                  {/* Order Info */}
                  <div className="mt-3">
                    <small className="text-muted">
                      {selectedPaymentMode === 'PICK_AT_STORE'
                        ? "You can pick up your order from the store"
                        : "Estimated delivery: 2-3 business days"
                      }
                    </small>
                  </div>
                </div>
 
                {/* Order Preview (for debugging/confirmation) */}
                {/* {orderPreview && process.env.NODE_ENV !== 'production' && (
                  <div className="card mt-3">
                    <div className="card-header">
                      <h6>Order Preview (Debug)</h6>
                    </div>
                    <div className="card-body">
                      <small>
                        <strong>Valid:</strong> {orderPreview.isValid ? 'Yes' : 'No'}<br />
                        <strong>Items:</strong> {orderPreview.orderSummary.itemCount}<br />
                        <strong>Total:</strong> {symbol}{orderPreview.orderSummary.totalAmount.toFixed(2)}<br />
                        <strong>Payment:</strong> {orderPreview.paymentMode}<br />
                        <strong>Store:</strong> {orderPreview.storeInfo.name}
                      </small>
                    </div>
                  </div>
                )} */}
              </Col>
            </Row>
          </Form>
        </div>
      </section>
    </>
  );
};
 
export default CheckoutPage;
 
