"use client";
import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Form, Row, Col } from "reactstrap";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import { CartContext } from "@/helpers/cart/cart.context";
import { useRouter } from "next/navigation";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { toast } from "react-toastify";
import { useCart } from "../../../app/providers/useCart/useCart";
import { appConfig } from "../../../app/config/";
import { DeliveryAddressModel } from "@/app/models/delivery_address_model/delivery_address";
import { DeliveryAssign, OrderItemsModel, OrderModel } from "@/app/models/order/order";
import { API } from "@/app/globalProvider"; 
 
interface FormType {
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
 
  const symbol = currencyContext?.selectedCurr?.symbol || '$';
  const contextCartItems = cartContext?.cartItems || [];
  const emptyCart = cartContext?.emptyCart || (() => {});
 
  const initializationRef = useRef({
    cartInitialized: false,
    contextItemsLength: 0
  });
 
  const cartHook = useCart();
 
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
 
  const [gstNumber, setGstNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
 
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormType>();
  
  const appName = appConfig.appName;
  const defaultStoreId = appConfig.defaultStoreId;
 
  const paymentModes = useMemo(() => [
    { value: "COD", label: "Cash on Delivery (COD)" },
    { value: "PICK_AT_STORE", label: "Pick at Store" },
    { value: "RAZORPAY", label: "Razorpay" },
    { value: "PHONEPE", label: "PhonePe" }
  ], []);
 
  const countries = useMemo(() => [
    { value: "", label: "Select Country" },
    { value: "India", label: "India" },
    { value: "United States", label: "United States" },
  ], []);
 
  // Enhanced price extraction function
  const extractPrice = useCallback((item: any): number => {
    if (!item) return 0;
    
    try {
      // Check standard price fields first
      if (typeof item.price === 'number' && item.price > 0) {
        return item.price;
      }
      
      // Check for discount price (prioritize over original price)
      if (item.discountPrice && typeof item.discountPrice === 'number' && item.discountPrice > 0) {
        return item.discountPrice;
      }
      
      // Check for sale price
      if (item.salePrice && typeof item.salePrice === 'number' && item.salePrice > 0) {
        return item.salePrice;
      }
      
      // Check for finalPrice
      if (item.finalPrice && typeof item.finalPrice === 'number' && item.finalPrice > 0) {
        return item.finalPrice;
      }
      
      // Check for currentPrice
      if (item.currentPrice && typeof item.currentPrice === 'number' && item.currentPrice > 0) {
        return item.currentPrice;
      }
      
      // Check for sellingPrice
      if (item.sellingPrice && typeof item.sellingPrice === 'number' && item.sellingPrice > 0) {
        return item.sellingPrice;
      }
      
      // Check Kit-specific price fields
      if (item.kitPrice && typeof item.kitPrice === 'number' && item.kitPrice > 0) {
        return item.kitPrice;
      }
      
      // Try extracting from nested price objects
      const nestedPrice = item.pricing || item.priceInfo || item.cost || item.priceData;
      if (typeof nestedPrice === 'number' && nestedPrice > 0) {
        return nestedPrice;
      }
      if (typeof nestedPrice === 'object' && nestedPrice !== null) {
        const extractedPrice = nestedPrice.amount || nestedPrice.value || nestedPrice.price || nestedPrice.final || nestedPrice.current;
        if (typeof extractedPrice === 'number' && extractedPrice > 0) {
          return extractedPrice;
        }
      }
      
      // Try extracting from the product data
      if (item.product) {
        return extractPrice(item.product);
      }
      
      // Try extracting from nested productData
      if (item.productData) {
        return extractPrice(item.productData);
      }
      
      // Check for string prices that need parsing
      if (typeof item.price === 'string') {
        const parsed = parseFloat(item.price.replace(/[^\d.-]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
      
    } catch (error) {
      console.warn("Error extracting price for item:", error);
    }
    
    return 0;
  }, []);

  const transformCartItem = useCallback((item: any) => {
    const extractedPrice = extractPrice(item);
    const extractedDiscountPrice = item.discountPrice ? extractPrice({ price: item.discountPrice }) : undefined;
    
    return {
      id: item.productId || item.id,
      name: item.name || item.title || item.productName || "Unknown Product",
      img: item.img || item.image || item.images || ["/static/images/placeholder.png"],
      cartItemCount: item.qty || item.quantity || item.cartItemCount || 1,
      cartPurchaseOptionStr: item.purchaseOptionStr || item.variant || "default",
      price: extractedPrice,
      discountPrice: extractedDiscountPrice,
      taxType: item.taxType || "EXCLUSIVE",
      taxAmount: item.taxAmount || 0,
      active: true,
      isReturnable: item.isReturnable || false,
      categoryName: item.category || item.categoryName || "General",
      categoryID: item.categoryId || item.categoryID || "default"
    };
  }, [extractPrice]);
 
  useEffect(() => {
    const currentLength = contextCartItems?.length || 0;
   
    // Debug logging to help identify the issue
    if (contextCartItems && contextCartItems.length > 0) {
      console.log("Context Cart Items:", contextCartItems);
      contextCartItems.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          name: item.name,
          price: item.price,
          discountPrice: item.discountPrice,
          qty: item.qty,
          fullItem: item
        });
      });
    }
   
    if (!initializationRef.current.cartInitialized &&
        currentLength > 0 &&
        currentLength !== initializationRef.current.contextItemsLength &&
        addItemToCart) {
     
      try {
        contextCartItems.forEach((item: any) => {
          const transformedItem = transformCartItem(item);
          console.log("Transformed item:", transformedItem);
          addItemToCart(transformedItem);
        });
        initializationRef.current.cartInitialized = true;
        initializationRef.current.contextItemsLength = currentLength;
      } catch (error) {
        console.error("Error loading cart items:", error);
        toast.error("Error loading cart items");
      }
    }
  }, [contextCartItems?.length, addItemToCart, transformCartItem]);
 
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

  const validateOrderData = useCallback(() => {
    const validationErrors = [];
    const formData = getValues();

    if (!formData.firstName?.trim()) validationErrors.push("First name is required");
    if (!formData.lastName?.trim()) validationErrors.push("Last name is required");
    if (!formData.phone?.trim()) validationErrors.push("Phone number is required");
    if (!formData.email?.trim()) validationErrors.push("Email is required");
    if (!formData.country?.trim()) validationErrors.push("Country is required");
    if (!formData.state?.trim()) validationErrors.push("State is required");
    if (!formData.city?.trim()) validationErrors.push("City is required");
    if (!formData.address?.trim()) validationErrors.push("Address is required");
    if (!formData.pincode?.trim()) validationErrors.push("PIN code is required");

    if (!selectedPaymentMode) validationErrors.push("Payment method is required");
    if (!cartItems || cartItems.length === 0) validationErrors.push("Cart is empty");
    
    // Check if cart items have valid prices
    const hasValidPrices = cartItems.some(item => {
      const effectivePrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
      return effectivePrice > 0;
    });
    
    if (!hasValidPrices) {
      validationErrors.push("Cart items must have valid prices");
    }
    
    // Only validate cart amount if we have valid prices
    if (hasValidPrices && cartCalculations.cartAmount <= 0) {
      validationErrors.push("Invalid cart amount");
    }
    
    if (cartCalculations.finalTotal <= 0) validationErrors.push("Invalid order total");
    if (!storeDetails?.id && !defaultStoreId) validationErrors.push("Store ID is missing");

    return validationErrors;
  }, [cartItems, selectedPaymentMode, cartCalculations, storeDetails, getValues, defaultStoreId]);

  const handleGstChange = useCallback((gst: string) => {
    setGstNumber(gst);
    setOrderGst(gst);
  }, [setOrderGst]);
 
  const createDeliveryAddressModel = useCallback((formData: FormType) => {
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
 
  const generateOrderId = useCallback(() => {
    // Generate a unique 10-digit number
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const combined = timestamp + randomNum;
    
    // Take last 10 digits and add # prefix
    return `${combined.slice(-10)}`;
  }, []);

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

  const createDeliveryAssign = useCallback(() => {
    return new DeliveryAssign({
      name: 'Not Assigned',
      phone: ''
    });
  }, []);

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

  const createOrderModel = useCallback((formData: FormType) => {
    const orderId = generateOrderId();
    const currentTime = new Date().toISOString();
    const deliveryAddress = createDeliveryAddressModel(formData);
    const orderItems = createOrderItems();
    const deliveryAssign = createDeliveryAssign();

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
      txnDetails: undefined,
      deliveryNotificationSent: false,
      userNotificationSent: false,
      orderGst: gstNumber || undefined
    };

    return new OrderModel(orderData);
  }, [generateOrderId, createDeliveryAddressModel, createOrderItems, createDeliveryAssign, selectedPaymentMode, storeDetails, appName, defaultStoreId, cartCalculations, gstNumber]);

  const storeOrderSuccessData = useCallback((formData: FormType, orderModel: any) => {
    try {
      const orderSuccessData = {
        orderId: orderModel.id,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          img: item.img,
          cartItemCount: item.cartItemCount,
          price: item.price,
          discountPrice: item.discountPrice,
          taxAmount: item.taxAmount,
          categoryName: item.categoryName
        })),
        cartTotal: cartCalculations.cartAmount,
        finalTotal: cartCalculations.finalTotal,
        discountAmount: cartCalculations.discountAmount,
        packageCost: cartCalculations.packageCost,
        deliveryCost: cartCalculations.deliveryCharges,
        taxTotal: cartCalculations.taxAmount,
        totalSavings: cartCalculations.totalSavings,
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          address: formData.address,
          pincode: formData.pincode
        },
        paymentMethod: selectedPaymentMode,
        orderDate: new Date().toISOString(),
        storeDetails: storeDetails,
        gstNumber: gstNumber
      };

      // Store in sessionStorage for immediate use
      sessionStorage.setItem("order-success-data", JSON.stringify(orderSuccessData));
      
      // Also store in localStorage as backup with order ID
      localStorage.setItem(`order-${orderModel.id}`, JSON.stringify(orderSuccessData));
      
      // Set expiry for localStorage (30 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      localStorage.setItem(`order-${orderModel.id}-expiry`, expiryDate.toISOString());
      
    } catch (error) {
      console.error("Error storing order success data:", error);
      // Don't throw error to prevent order placement failure
    }
  }, [cartItems, cartCalculations, selectedPaymentMode, storeDetails, gstNumber]);

  const onSubmit = useCallback(async (formData: FormType) => {
    try {
      setIsProcessing(true);
      setShowValidationErrors(true);

      const validationErrors = validateOrderData();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }

      const deliveryAddress = createDeliveryAddressModel(formData);
      setDeliveryAddressModel(deliveryAddress);

      const orderModel = createOrderModel(formData);
      
      // Store order success data before API call
      storeOrderSuccessData(formData, orderModel);
      
      await API.saveOrder(orderModel);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (selectedPaymentMode) {
        case 'COD':
        case 'PICK_AT_STORE':
          toast.success("Order placed successfully!");
          clearCart();
          emptyCart();
          // Redirect to order success page with order ID
          router.push(`/pages/order-success?orderId=${orderModel.id}`);
          break;
        case 'RAZORPAY':
        case 'PHONEPE':
          toast.info("Redirecting to payment gateway...");
          // Store the order ID for payment gateway callback
          sessionStorage.setItem("pending-payment-order-id", orderModel.id);
          // After successful payment, you would also redirect to success page
          // This would typically be handled in the payment gateway callback
          // For now, redirect to success page (you can modify this based on your payment flow)
          router.push(`/pages/order-success?orderId=${orderModel.id}`);
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
  }, [validateOrderData, createDeliveryAddressModel, setDeliveryAddressModel, createOrderModel, storeOrderSuccessData, selectedPaymentMode, clearCart, emptyCart, router]);

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
                onClick={() => router.push("/")}
              >
                Go to Home
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
                    {cartItems.map((item, index) => {
                      const effectivePrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
                      const itemTotal = effectivePrice * item.cartItemCount;
                      
                      return (
                        <div key={`${item.id}_${item.cartPurchaseOptionStr}_${index}`} className="cart-item">
                          <img
                            src={Array.isArray(item.img) ? item.img[0] : item.img || "/static/images/placeholder.png"}
                            alt={item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/static/images/placeholder.png";
                            }}
                          />
                          <div className="item-details">
                            <div className="item-name">{item.name}</div>
                            <div className="item-price">
                              Qty: {item.cartItemCount} × {symbol}{effectivePrice.toFixed(2)}
                            </div>
                            {item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price && (
                              <div className="item-discount">
                                <small className="text-muted text-decoration-line-through">
                                  Original: {symbol}{item.price.toFixed(2)}
                                </small>
                                <br />
                                <small className="text-success">
                                  Discount: {symbol}{((item.price - item.discountPrice) * item.cartItemCount).toFixed(2)}
                                </small>
                              </div>
                            )}
                          </div>
                          <div className="item-total">
                            <strong>{symbol}{itemTotal.toFixed(2)}</strong>
                          </div>
                        </div>
                      );
                    })}
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

                  {showValidationErrors && (() => {
                    const validationErrors = validateOrderData();
                    return validationErrors.length > 0 && (
                      <div className="alert alert-danger">
                        <h6>Please fix the following errors:</h6>
                        <ul className="mb-0">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                 
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isProcessing || !selectedPaymentMode}
                  >
                    {getPaymentMethodDisplayText(selectedPaymentMode, isProcessing)}
                  </button>

                  <div className="mt-3">
                    <small className="text-muted">
                      {selectedPaymentMode === 'PICK_AT_STORE' && 
                        "You can collect your order from our store location."
                      }
                      {selectedPaymentMode === 'COD' && 
                        "Pay cash when your order is delivered to your address."
                      }
                      {(selectedPaymentMode === 'RAZORPAY' || selectedPaymentMode === 'PHONEPE') && 
                        "You will be redirected to the payment gateway to complete your payment."
                      }
                    </small>
                  </div>
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