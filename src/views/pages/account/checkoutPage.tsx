"use client";
import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Form, Row, Col } from "reactstrap";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import { CartContext } from "@/helpers/cart/cart.context";
import { useRouter } from "next/navigation";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { toast } from "react-toastify";
import { OrderPayloadService } from "../../../app/providers/usePlaceOrder/usePlaceOrder";
import { API, searchController, Kit, objCache } from "@/app/globalProvider";
import { appConfig } from "../../../app/config/";
import RazorpayButton from "../../../app/(MainBody)/pages/account/checkout/components/RazorpayButton";
import { storeOrderSuccessData } from "../../../utils/orderPayloadUtils";
import { getProductFinalPrice } from "@/utils/price.helper";
import { getSizeLabel } from "@/utils/Labels";

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
  latitude?: number;
  longitude?: number;
}

interface CartItem {
  id: string;
  productId?: string;
  name: string;
  img: string[];
  cartItemCount: number;
  cartPurchaseOptionStr: string;
  price: number;
  discountPrice?: number;
  taxType: string;
  taxAmount: number;
  active: boolean;
  isReturnable: boolean;
  categoryName: string;
  categoryID: string;
  selectedSize?: string;
  sellingDisplayOptions?: string[];
  sellingPrices?: number[];
  discount?: number;
  qty?: number;
  type?: string;
}

interface Coupon {
  couponCode: string;
  couponAmount: number;
  isCouponPercentage: boolean;
  maxCouponAmount: number;
  expireDate?: string;
  minimumCartValue: number;
  assignedUsers?: { phone_number: string }[];
}

interface OrderCalculations {
  cartAmount: number;
  packageCost: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  totalSavings: number;
  finalTotal: number;
  couponDiscount: number;
}

// Mock AuthContext for user profile data
interface AuthContextType {
  user: { phone: string } | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Mock CouponModel for parsing coupon data
class CouponModel {
  couponCode: string;
  couponAmount: number;
  isCouponPercentage: boolean;
  maxCouponAmount: number;
  expireDate?: string;
  minimumCartValue: number;
  assignedUsers?: { phone_number: string }[];

  constructor(data: any) {
    this.couponCode = data.coupon_code || "";
    this.couponAmount = data.coupon_amount || 0;
    this.isCouponPercentage = data.is_coupon_percentage || false;
    this.maxCouponAmount = data.max_coupon_amount || 0;
    this.expireDate = data.expire_date;
    this.minimumCartValue = data.minimum_cart_value || 0;
    this.assignedUsers = data.assigned_users || [];
  }

  static fromJson(data: any): Coupon {
    return new CouponModel(data);
  }

  isCouponAllowedForUser(phoneNumber: string): boolean {
    if (!this.assignedUsers || this.assignedUsers.length === 0) return true;
    return this.assignedUsers.some((user) => user.phone_number === phoneNumber);
  }
}

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const currencyContext = useContext(CurrencyContext);
  const cartContext = useContext(CartContext);
  const authContext = useContext(AuthContext);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("COD");
  const [gstNumber, setGstNumber] = useState<string>("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormType>();
  const phoneNumber = watch("phone") || "";

  const symbol = currencyContext?.selectedCurr?.symbol || "$";
  const contextCartItems = cartContext?.cartItems || [];
  const updateCartItemVariation = cartContext?.updateCartItemVariation;
  const emptyCart = cartContext?.emptyCart || (() => {});
  const appName = appConfig?.appName || "MyApp";
  const defaultStoreId = appConfig?.defaultStoreId || "default";

  const paymentModes = useMemo(() => OrderPayloadService.getPaymentModes(), []);
  const countries = useMemo(() => OrderPayloadService.getCountries(), []);

  // Use dynamic values from appConfig
  const tenantId = appConfig.tenantId ;
  const storeId = appConfig.defaultStoreId ;

  // Configuration for tenantId and storeId
  const apiConfig = {
    tenantId,
    storeId,
  };

  // Fetch and set default phone number from profile or sessionStorage
  useEffect(() => {
    let defaultPhone = "";
    if (authContext?.user?.phone) {
      defaultPhone = authContext.user.phone;
    } else if (typeof window !== "undefined") {
      const addressDetails = window.sessionStorage.getItem("addressDetails");
      if (addressDetails) {
        const parsed = JSON.parse(addressDetails);
        defaultPhone = parsed.phone || "";
      }
    }
    if (defaultPhone) {
      setValue("phone", defaultPhone, { shouldValidate: true });
    }
  }, [authContext, setValue]);

  // Fetch coupons when phone number or cart items change
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        let userPhone = phoneNumber;
        if (!userPhone && typeof window !== "undefined") {
          const addressDetails = window.sessionStorage.getItem("addressDetails");
          if (addressDetails) {
            const parsed = JSON.parse(addressDetails);
            userPhone = parsed.phone || "";
          }
        }

        // Skip fetching if no valid phone number is available
        if (!userPhone) {
          setAvailableCoupons([]);
          return;
        }

        const response = await API.get<{ data: any[] }>(`${API.baseURL}/get-coupons`, {
          tenant_id: apiConfig.tenantId,
          store_id: apiConfig.storeId,
        });

        const now = new Date();
        const coupons: Coupon[] = response.data
          .map((couponData) => {
            try {
              const coupon = CouponModel.fromJson(couponData);
              if (
                (!coupon.expireDate || new Date(coupon.expireDate) >= now) &&
                (!coupon.assignedUsers || coupon.assignedUsers.length === 0 || coupon.assignedUsers.some(user => user.phone_number === userPhone))
              ) {
                return coupon;
              }
              return null;
            } catch (e) {
              console.error(`Error parsing coupon: ${JSON.stringify(couponData)}`);
              return null;
            }
          })
          .filter((coupon): coupon is Coupon => coupon !== null);

        setAvailableCoupons(coupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        setAvailableCoupons([]);
      }
    };

    fetchCoupons();
  }, [phoneNumber, cartItems, apiConfig.tenantId, apiConfig.storeId]);

  const handleSelectCoupon = (coupon: Coupon) => {
    setCouponError("");
    const now = new Date();
    if (coupon.expireDate && new Date(coupon.expireDate) < now) {
      setCouponError("Coupon has expired.");
      setAppliedCoupon(null);
      return;
    }
    const cartTotal = cartItems.reduce((sum, item) => sum + ((item.discountPrice || item.price) * item.cartItemCount), 0);
    if (cartTotal < coupon.minimumCartValue) {
      setCouponError(`Minimum cart value for this coupon is ₹${coupon.minimumCartValue}`);
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(coupon);
  };

  useEffect(() => {
    let buyNowMode = false;
    let buyNowProduct = null;
    if (typeof window !== "undefined") {
      buyNowMode = window.sessionStorage.getItem("checkoutMode") === "buyNow";
      const buyNowRaw = window.sessionStorage.getItem("buyNowProduct");
      if (buyNowRaw) buyNowProduct = JSON.parse(buyNowRaw);
    }

    const getPrice = (item: any) => item.sellingPrice || item.price || 0;
    const getDiscountPrice = (item: any) => item.discountPrice;

    const buyNowItem: CartItem | null = buyNowMode && buyNowProduct ? {
      id: buyNowProduct.id || `item-0`,
      name: buyNowProduct.name || "Unknown Product",
      img: Array.isArray(buyNowProduct.img) ? buyNowProduct.img : [buyNowProduct.img || "/static/images/placeholder.png"],
      cartItemCount: buyNowProduct.qty || 1,
      cartPurchaseOptionStr: buyNowProduct.purchaseOptionStr || "default",
      price: getPrice(buyNowProduct),
      discountPrice: getDiscountPrice(buyNowProduct),
      taxType: buyNowProduct.taxType || "EXCLUSIVE",
      taxAmount: parseFloat(buyNowProduct.taxAmount) || 0,
      active: true,
      isReturnable: buyNowProduct.isReturnable || false,
      categoryName: buyNowProduct.categoryName || "General",
      categoryID: buyNowProduct.categoryID || "default"
    } : null;

    const cartTransformed: CartItem[] = contextCartItems.map((item: any, index: number) => ({
      id: item.id || `item-${index}`,
      name: item.name || "Unknown Product",
      img: Array.isArray(item.img) ? item.img : [item.img || "/static/images/placeholder.png"],
      cartItemCount: item.qty || 1,
      cartPurchaseOptionStr: item.purchaseOptionStr || "default",
      price: getPrice(item),
      discountPrice: getDiscountPrice(item),
      taxType: item.taxType || "EXCLUSIVE",
      taxAmount: parseFloat(item.taxAmount) || 0,
      active: true,
      isReturnable: item.isReturnable || false,
      categoryName: item.categoryName || "General",
      categoryID: item.categoryID || "default"
    }));

    const merged: { [key: string]: CartItem } = {};
    const getKey = (item: any) => item.id;
    if (buyNowItem) merged[getKey(buyNowItem)] = buyNowItem;
    cartTransformed.forEach(item => {
      const key = getKey(item);
      if (merged[key]) {
        merged[key].cartItemCount += item.cartItemCount;
      } else {
        merged[key] = item;
      }
    });
    setCartItems(Object.values(merged));
  }, [contextCartItems]);

  const calculations = useMemo((): OrderCalculations => {
    let cartAmount = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    cartItems.forEach(item => {
      const itemPrice = getPrice(item);
      const itemDiscountPrice = item.discountPrice;
      const finalItemPrice = itemDiscountPrice && itemDiscountPrice < itemPrice ? itemDiscountPrice : itemPrice;
      const itemTotal = finalItemPrice * item.cartItemCount;
      cartAmount += itemTotal;
      if (item.discountPrice && item.discountPrice < item.price) {
        discountAmount += (item.price - item.discountPrice) * item.cartItemCount;
      }
      taxAmount += item.taxAmount * item.cartItemCount;
    });

    let couponDiscount = 0;
    if (appliedCoupon) {
      couponDiscount = appliedCoupon.isCouponPercentage
        ? Math.min((cartAmount * appliedCoupon.couponAmount) / 100, appliedCoupon.maxCouponAmount || Infinity)
        : Math.min(appliedCoupon.couponAmount, appliedCoupon.maxCouponAmount || Infinity);
    }

    const packageCost = cartAmount > 500 ? 0 : 50;
    const deliveryCharges = selectedPaymentMode === "PICK_AT_STORE" ? 0 : cartAmount > 1000 ? 0 : 100;
    const totalSavings = discountAmount + couponDiscount;
    const finalTotal = cartAmount + taxAmount + packageCost + deliveryCharges - couponDiscount;

    return {
      cartAmount,
      packageCost,
      deliveryCharges,
      discountAmount,
      taxAmount,
      totalSavings,
      finalTotal,
      couponDiscount
    };
  }, [cartItems, selectedPaymentMode, appliedCoupon]);

  const handlePaymentModeChange = useCallback((mode: string) => setSelectedPaymentMode(mode), []);
  const handleGstChange = useCallback((value: string) => setGstNumber(value), []);

  const getPaymentButtonText = useCallback(() => {
    if (isProcessing) return "Processing...";
    
    const paymentTexts: { [key: string]: string } = {
      "COD": "Place Order (COD)",
      "PICK_AT_STORE": "Place Order (Pick at Store)",
      "PHONEPE": "Pay with PhonePe",
      "RAZORPAY": "Pay with Razorpay"
    };

    return paymentTexts[selectedPaymentMode] || "Place Order";
  }, [isProcessing, selectedPaymentMode]);

  const handleOrderSuccess = useCallback(async (orderModel: any, formData: FormType) => {
    toast.success("Order placed successfully!");
    if (typeof window !== "undefined") {
      // Include location data in order details with proper lat/long
      const orderDetailsWithLocation = {
        ...orderModel,
        deliveryLocation: locationData,
        deliveryAddress: {
          ...orderModel.deliveryAddress,
          lat: formData.latitude || locationData?.latitude || 0,
          lng: formData.longitude || locationData?.longitude || 0,
        }
      };
      
      window.sessionStorage.setItem("orderDetails", JSON.stringify(orderDetailsWithLocation));
      window.sessionStorage.setItem("addressDetails", JSON.stringify({
        ...formData,
        latitude: formData.latitude || locationData?.latitude,
        longitude: formData.longitude || locationData?.longitude
      }));
      window.sessionStorage.removeItem("buyNowProduct");
      window.sessionStorage.removeItem("checkoutMode");
    }
    setCartItems([]);
    emptyCart();
    setTimeout(() => router.push("/pages/order-success"), 1500);
  }, [router, emptyCart]);

  // Function to prepare order data for Razorpay
  const prepareOrderData = useCallback((formData: FormType) => {
    try {
      // Enhanced form data with location coordinates - ensure they're included
      const enhancedFormData = {
        ...formData,
        latitude: formData.latitude || locationData?.latitude || 0,
        longitude: formData.longitude || locationData?.longitude || 0
      };

      const orderConfig = {
        formData: enhancedFormData,
        cartItems,
        selectedPaymentMode,
        cartCalculations: calculations,
        storeDetails: { id: defaultStoreId, name: appName, active: true },
        gstNumber,
        appName,
        defaultStoreId
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);
      
      // Create order data for Razorpay
      const orderData = {
        orderId: orderModel.id,
        amount: calculations.finalTotal,
        billingDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          address: formData.address,
          pincode: formData.pincode,
          latitude: enhancedFormData.latitude,
          longitude: enhancedFormData.longitude
        }
      };

      // Create delivery address
      const deliveryAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode,
        latitude: enhancedFormData.latitude,
        longitude: enhancedFormData.longitude
      };

      console.log("Order payload with coordinates:", {
        orderModel: orderModel,
        deliveryAddress: deliveryAddress,
        coordinates: {
          lat: enhancedFormData.latitude,
          lng: enhancedFormData.longitude
        }
      });

      return { orderData, orderModel, deliveryAddress };
    } catch (error) {
      console.error("Error preparing order data:", error);
      toast.error("Failed to prepare order data");
      return null;
    }
  }, [cartItems, selectedPaymentMode, calculations, gstNumber, appName, defaultStoreId, locationData]);

  // Handle Razorpay success
  const handleRazorpaySuccess = useCallback(async () => {
    try {
      // Get order data from session storage
      const orderSuccessData = sessionStorage.getItem("order-success-data");
      if (orderSuccessData) {
        const orderData = JSON.parse(orderSuccessData);
        
        // Store complete order success data
        storeOrderSuccessData(
          {
            firstName: orderData.billingDetails.firstName,
            lastName: orderData.billingDetails.lastName,
            phone: orderData.billingDetails.phone,
            email: orderData.billingDetails.email,
            country: orderData.billingDetails.country,
            state: orderData.billingDetails.state,
            city: orderData.billingDetails.city,
            address: orderData.billingDetails.address,
            pincode: orderData.billingDetails.pincode,
            latitude: orderData.billingDetails.latitude || 0,
            longitude: orderData.billingDetails.longitude || 0
          },
          {
            ...orderData.orderModel,
            deliveryLocation: locationData,
            deliveryAddress: {
              ...orderData.orderModel.deliveryAddress,
              lat: orderData.billingDetails.latitude || 0,
              lng: orderData.billingDetails.longitude || 0,
            }
          },
          cartItems,
          calculations,
          selectedPaymentMode,
          { id: defaultStoreId, name: appName },
          gstNumber
        );
        
        // Clear cart and redirect
        setCartItems([]);
        emptyCart();
        setTimeout(() => router.push("/pages/order-success"), 1500);
      }
    } catch (error) {
      console.error("Error handling Razorpay success:", error);
      toast.error("Error processing payment success");
    }
  }, [cartItems, calculations, selectedPaymentMode, defaultStoreId, appName, gstNumber, emptyCart, router]);

  const onSubmit = useCallback(async (formData: FormType) => {
    setIsProcessing(true);
    setShowValidationErrors(true);

    if (!selectedPaymentMode || cartItems.length === 0) {
      toast.error(!selectedPaymentMode ? "Please select a payment method" : "Your cart is empty");
      setIsProcessing(false);
      return;
    }

    try {
      // Enhanced form data with coordinates - ensure they are properly included
      const enhancedFormData = {
        ...formData,
        latitude: formData.latitude || locationData?.latitude || 0,
        longitude: formData.longitude || locationData?.longitude || 0
      };

      console.log("Enhanced form data with coordinates:", enhancedFormData);

      const orderConfig = {
        formData: enhancedFormData,
        cartItems,
        selectedPaymentMode,
        cartCalculations: calculations,
        storeDetails: { id: defaultStoreId, name: appName, active: true },
        gstNumber,
        appName,
        defaultStoreId
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);
      if (API && API.saveOrder) await API.saveOrder(orderModel);

      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (selectedPaymentMode) {
        case "COD":
        case "PICK_AT_STORE":
          await handleOrderSuccess(orderModel, enhancedFormData);
          break;
        case "RAZORPAY":
          // For Razorpay, the payment is handled by the RazorpayButton component
          // The order is already saved, so we just need to show success message
          toast.success("Order created successfully! Please complete the payment.");
          setIsProcessing(false);
          return;
        case "PHONEPE":
          toast.info("Redirecting to payment gateway...");
          setTimeout(async () => await handleOrderSuccess(orderModel, enhancedFormData), 2000);
          break;
        default:
          toast.error("Invalid payment method");
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPaymentMode, cartItems, calculations, gstNumber, appName, defaultStoreId, handleOrderSuccess]);

  const validationErrors = useMemo(() => {
    if (!showValidationErrors) return [];
    return [
      ...(!selectedPaymentMode ? ["Payment method is required"] : []),
      ...(cartItems.length === 0 ? ["Cart is empty"] : []),
      ...(phoneNumber === "" ? ["Phone number is required to fetch coupons"] : [])
    ];
  }, [showValidationErrors, selectedPaymentMode, cartItems.length, phoneNumber]);

  // Get payment button based on selected payment mode
  const getPaymentButton = useCallback(() => {
    if (selectedPaymentMode === "RAZORPAY") {
      return (
        <RazorpayButton
          formData={watch()}
          prepareOrderData={prepareOrderData}
          finalTotal={calculations.finalTotal}
          onSuccess={handleRazorpaySuccess}
        />
      );
    }

    return (
      <button
        type="submit"
        className="btn btn-primary btn-block checkout-button"
        disabled={isProcessing || !selectedPaymentMode}
        // style={{ width: "100%", marginTop: "20px", padding: "15px", fontSize: "16px", fontWeight: "bold" }}
      >
        {getPaymentButtonText()}
      </button>
    );
  }, [selectedPaymentMode, watch, prepareOrderData, calculations.finalTotal, handleRazorpaySuccess, isProcessing, getPaymentButtonText]);

  if (cartItems.length === 0) {
    return (
      <>
        <Breadcrumb title="checkout" parent="home" />
        <section className="checkout-container">
          <div className="container">
            <div className="empty-cart text-center py-5">
              <h3>Your cart is empty</h3>
              <p>Add some items to your cart to proceed with checkout.</p>
              <button className="btn btn-primary" onClick={() => router.push("/")}>
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
                        {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}
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
                        {errors.lastName && <span className="error-message">{errors.lastName.message}</span>}
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
                            pattern: { value: /^[0-9]{10}$/, message: "Please enter a valid 10-digit phone number" }
                          })}
                        />
                        {errors.phone && <span className="error-message">{errors.phone.message}</span>}
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
                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Please enter a valid email address" }
                          })}
                        />
                        {errors.email && <span className="error-message">{errors.email.message}</span>}
                      </div>
                    </Col>
                    <Col md="12">
                      <LocationSection
                        onLocationUpdate={handleLocationUpdate}
                        isLoading={isProcessing}
                      />
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
                        {errors.country && <span className="error-message">{errors.country.message}</span>}
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
                        {errors.state && <span className="error-message">{errors.state.message}</span>}
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
                        {errors.city && <span className="error-message">{errors.city.message}</span>}
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
                        {errors.address && <span className="error-message">{errors.address.message}</span>}
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
                            pattern: { value: /^[0-9]{6}$/, message: "Please enter a valid 6-digit PIN code" }
                          })}
                        />
                        {errors.pincode && <span className="error-message">{errors.pincode.message}</span>}
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
                        className={`payment-option ${selectedPaymentMode === mode.value ? "selected" : ""}`}
                        onClick={() => handlePaymentModeChange(mode.value)}
                        style={{ padding: "15px", border: "1px solid #ddd", marginBottom: "10px", cursor: "pointer", backgroundColor: selectedPaymentMode === mode.value ? "#f0f8ff" : "#fff" }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={mode.value}
                          checked={selectedPaymentMode === mode.value}
                          onChange={(e) => handlePaymentModeChange(e.target.value)}
                          // style={{ marginRight: "10px" }}
                          className="payment-mode-radio"
                        />
                        <label className="payment-mode-label">{mode.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
              <Col lg="5">
                <div className="order-summary">
                  <h3 className="checkout-title">Order Summary</h3>
                  <div className="cart-items-container">
                    {cartItems.map((item, index) => (
                      <div key={`${item.id}_${index}`} className="cart-item">
                        <img
                          src={item.img[0] || "/static/images/placeholder.png"}
                          alt={item.name}
                          className="cart-item-image"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/static/images/placeholder.png"; }}
                        />
                        <div className="item-details">
                          <div className="item-name">{item.name}</div>
                          <div className="item-price">Qty: {item.cartItemCount} × {symbol}{item.price.toFixed(2)}</div>
                          {item.discountPrice && item.discountPrice < item.price && (
                            <div className="item-discount">
                              Discount: {symbol}{((item.price - item.discountPrice) * item.cartItemCount).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="item-total">{symbol}{((item.discountPrice || item.price) * item.cartItemCount).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="order-totals">
                    <div className="form-group mb-3" style={{ marginTop: "20px" }}>
                      <label className="field-label coupon-label">Available Coupons</label>
                      <div className="coupon-container">
                        {availableCoupons.length === 0 && <span className="no-coupons">{phoneNumber ? "No coupons available" : "Enter phone number to view coupons"}</span>}
                        {availableCoupons.map((coupon) => (
                          <button
                            key={coupon.couponCode}
                            type="button"
                            className="btn"
                            style={{
                              background: appliedCoupon?.couponCode === coupon.couponCode ? "#00baf2" : "#e6f7ff",
                              color: appliedCoupon?.couponCode === coupon.couponCode ? "#fff" : "#00baf2",
                              border: "1px solid #00baf2",
                              fontWeight: 500,
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                            onClick={() => handleSelectCoupon(coupon)}
                          >
                            {coupon.couponCode} - {coupon.isCouponPercentage ? `${coupon.couponAmount}% off` : `₹${coupon.couponAmount} off`} {coupon.maxCouponAmount > 0 ? `(Max ₹${coupon.maxCouponAmount})` : ""}
                          </button>
                        ))}
                      </div>
                      {couponError && <div className="text-danger mt-1">{couponError}</div>}
                      {appliedCoupon && (
                        <div className="mt-1 coupon-discount">
                          Coupon <strong>{appliedCoupon.couponCode}</strong> applied: {appliedCoupon.isCouponPercentage ? `${appliedCoupon.couponAmount}% off` : `₹${appliedCoupon.couponAmount} off`} {appliedCoupon.maxCouponAmount > 0 ? `(Max ₹${appliedCoupon.maxCouponAmount})` : ""}
                        </div>
                      )}
                    </div>
                    <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span>Cart Total</span>
                      <span>{symbol}{calculations.cartAmount.toFixed(2)}</span>
                    </div>
                    {calculations.discountAmount > 0 && (
                      <div className="total-row discount" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#28a745" }}>
                        <span>Item Discount</span>
                        <span>-{symbol}{calculations.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.couponDiscount > 0 && (
                      <div className="total-row coupon" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#00baf2" }}>
                        <span>Coupon Discount</span>
                        <span>-{symbol}{calculations.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.taxAmount > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Tax</span>
                        <span>{symbol}{calculations.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.packageCost > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Package Cost</span>
                        <span>{symbol}{calculations.packageCost.toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.deliveryCharges > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Delivery Charges</span>
                        <span>{symbol}{calculations.deliveryCharges.toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.totalSavings > 0 && (
                      <div className="total-row savings" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#28a745" }}>
                        <span>Total Savings</span>
                        <span>{symbol}{calculations.totalSavings.toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="total-row final" style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px" }}>
                      <span>Final Total</span>
                      <span>{symbol}{calculations.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="alert alert-danger" style={{ marginTop: "20px" }}>
                      <h6>Please fix the following errors:</h6>
                      <ul className="mb-0">
                        {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  {/* Render payment button based on selected payment mode */}
                  {getPaymentButton()}
                  
                  <div style={{ marginTop: "15px" }}>
                    <small className="text-muted">
                      {selectedPaymentMode === "PICK_AT_STORE" && "Order will be ready for pickup at store."}
                      {selectedPaymentMode === "COD" && "Payment will be collected upon delivery."}
                      {selectedPaymentMode === "RAZORPAY" && "Secure payment powered by Razorpay."}
                      {selectedPaymentMode === "PHONEPE" && "You will be redirected to payment gateway."}
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
