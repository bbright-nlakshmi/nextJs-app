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
import { API } from "@/app/globalProvider";
import { appConfig } from "../../../app/config/";
import RazorpayButton from "../../../app/(MainBody)/pages/account/checkout/components/RazorpayButton";
import { createOrderPayload, storeOrderSuccessData } from "../../../utils/orderPayloadUtils";

// Types and Interfaces
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

interface CartItem {
  id: string;
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

interface AuthContextType {
  user: { phone: string } | null;
}

// Mock contexts
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Coupon Model Class
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

// Constants
const VALIDATION_RULES = {
  firstName: { required: "First name is required" },
  lastName: { required: "Last name is required" },
  phone: {
    required: "Phone number is required",
    pattern: { value: /^[0-9]{10}$/, message: "Please enter a valid 10-digit phone number" }
  },
  email: {
    required: "Email is required",
    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Please enter a valid email address" }
  },
  country: { required: "Country is required" },
  state: { required: "State is required" },
  city: { required: "City is required" },
  address: { required: "Address is required" },
  pincode: {
    required: "PIN code is required",
    pattern: { value: /^[0-9]{6}$/, message: "Please enter a valid 6-digit PIN code" }
  }
};

const PAYMENT_TEXT_MAP = {
  "COD": "Place Order (COD)",
  "PICK_AT_STORE": "Place Order (Pick at Store)",
  "PHONEPE": "Pay with PhonePe",
  "RAZORPAY": "Pay with Razorpay"
};

// Custom Hooks
const useSessionStorage = (key: string) => {
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem(key);
      setValue(stored || "");
    }
  }, [key]);

  const setStoredValue = useCallback((newValue: string) => {
    setValue(newValue);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(key, newValue);
    }
  }, [key]);

  const removeStoredValue = useCallback(() => {
    setValue("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(key);
    }
  }, [key]);

  return { value, setStoredValue, removeStoredValue };
};

const useCheckoutMode = () => {
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'buyNow'>('cart');
  const [buyNowProduct, setBuyNowProduct] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isBuyNowMode = window.sessionStorage.getItem("checkoutMode") === "buyNow";
      const buyNowRaw = window.sessionStorage.getItem("buyNowProduct");
      
      setCheckoutMode(isBuyNowMode ? 'buyNow' : 'cart');
      
      if (buyNowRaw) {
        try {
          setBuyNowProduct(JSON.parse(buyNowRaw));
        } catch (e) {
          console.error("Error parsing buyNowProduct:", e);
          setBuyNowProduct(null);
        }
      }
    }
  }, []);

  return { checkoutMode, buyNowProduct };
};

// Utility Functions
const getItemPrice = (item: any) => item.sellingPrice || item.price || 0;
const getItemDiscountPrice = (item: any) => item.discountPrice;

const transformToCartItem = (item: any, index: number, isBuyNow = false): CartItem => ({
  id: item.id || `${isBuyNow ? 'buyNow' : 'cart'}-item-${index}`,
  name: item.name || "Unknown Product",
  img: Array.isArray(item.img) ? item.img : [item.img || "/static/images/placeholder.png"],
  cartItemCount: item.qty || item.cartItemCount || 1,
  cartPurchaseOptionStr: item.purchaseOptionStr || "default",
  price: getItemPrice(item),
  discountPrice: getItemDiscountPrice(item),
  taxType: item.taxType || "EXCLUSIVE",
  taxAmount: parseFloat(item.taxAmount) || 0,
  active: true,
  isReturnable: item.isReturnable || false,
  categoryName: item.categoryName || "General",
  categoryID: item.categoryID || "default"
});

// Components
const EmptyCartView: React.FC<{ onContinueShopping: () => void }> = ({ onContinueShopping }) => (
  <section className="checkout-container">
    <div className="container">
      <div className="empty-cart text-center py-5">
        <h3>Your cart is empty</h3>
        <p>Add some items to your cart to proceed with checkout.</p>
        <button className="btn btn-primary" onClick={onContinueShopping}>
          Continue Shopping
        </button>
      </div>
    </div>
  </section>
);

const CheckoutModeIndicator: React.FC<{ mode: 'cart' | 'buyNow' }> = ({ mode }) => (
  <div className="checkout-mode-indicator mb-3">
    {/* <div className="alert alert-info">
      <strong>
        {mode === 'buyNow' ? '🛒 Quick Checkout' : '🛍️ Cart Checkout'}
      </strong>
      {mode === 'buyNow' && <span className="ml-2">- Checking out selected item only</span>}
    </div> */}
  </div>
);

const CartItemCard: React.FC<{ item: CartItem; symbol: string }> = ({ item, symbol }) => (
  <div className="cart-item">
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
    <div className="item-total">
      {symbol}{((item.discountPrice || item.price) * item.cartItemCount).toFixed(2)}
    </div>
  </div>
);

const CouponSection: React.FC<{
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  phoneNumber: string;
  couponError: string;
  onSelectCoupon: (coupon: Coupon) => void;
}> = ({ coupons, appliedCoupon, phoneNumber, couponError, onSelectCoupon }) => (
  <div className="form-group mb-3">
    <label className="field-label coupon-label">Available Coupons</label>
    <div className="coupon-container">
      {coupons.length === 0 && (
        <span className="no-coupons">
          {phoneNumber ? "No coupons available" : "Enter phone number to view coupons"}
        </span>
      )}
      {coupons.map((coupon) => (
        <button
          key={coupon.couponCode}
          type="button"
          className={`btn ${appliedCoupon?.couponCode === coupon.couponCode ? 'active' : ''}`}
          onClick={() => onSelectCoupon(coupon)}
        >
          {coupon.couponCode} - {coupon.isCouponPercentage 
            ? `${coupon.couponAmount}% off` 
            : `₹${coupon.couponAmount} off`
          } {coupon.maxCouponAmount > 0 ? `(Max ₹${coupon.maxCouponAmount})` : ""}
        </button>
      ))}
    </div>
    {couponError && <div className="text-danger mt-1" style={{ fontSize: "12px" }}>{couponError}</div>}
    {appliedCoupon && (
      <div className="mt-1 coupon-discount">
        Coupon <strong>{appliedCoupon.couponCode}</strong> applied: {appliedCoupon.isCouponPercentage 
          ? `${appliedCoupon.couponAmount}% off` 
          : `₹${appliedCoupon.couponAmount} off`
        } {appliedCoupon.maxCouponAmount > 0 ? `(Max ₹${appliedCoupon.maxCouponAmount})` : ""}
      </div>
    )}
  </div>
);

const OrderTotals: React.FC<{ calculations: OrderCalculations; symbol: string }> = ({ calculations, symbol }) => (
  <div className="order-totals">
    <div className="total-row">
      <span>Cart Total</span>
      <span>{symbol}{calculations.cartAmount.toFixed(2)}</span>
    </div>
    {calculations.discountAmount > 0 && (
      <div className="total-row discount">
        <span>Item Discount</span>
        <span>-{symbol}{calculations.discountAmount.toFixed(2)}</span>
      </div>
    )}
    {calculations.couponDiscount > 0 && (
      <div className="total-row coupon">
        <span>Coupon Discount</span>
        <span>-{symbol}{calculations.couponDiscount.toFixed(2)}</span>
      </div>
    )}
    {calculations.taxAmount > 0 && (
      <div className="total-row">
        <span>Tax</span>
        <span>{symbol}{calculations.taxAmount.toFixed(2)}</span>
      </div>
    )}
    {calculations.packageCost > 0 && (
      <div className="total-row">
        <span>Package Cost</span>
        <span>{symbol}{calculations.packageCost.toFixed(2)}</span>
      </div>
    )}
    {calculations.deliveryCharges > 0 && (
      <div className="total-row">
        <span>Delivery Charges</span>
        <span>{symbol}{calculations.deliveryCharges.toFixed(2)}</span>
      </div>
    )}
    {calculations.totalSavings > 0 && (
      <div className="total-row savings">
        <span>Total Savings</span>
        <span>{symbol}{calculations.totalSavings.toFixed(2)}</span>
      </div>
    )}
    <hr />
    <div className="total-row final">
      <span>Final Total</span>
      <span>{symbol}{calculations.finalTotal.toFixed(2)}</span>
    </div>
  </div>
);

// Main Component
const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const currencyContext = useContext(CurrencyContext);
  const cartContext = useContext(CartContext);
  const authContext = useContext(AuthContext);

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("COD");
  const [gstNumber, setGstNumber] = useState<string>("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  // Custom hooks
  const { checkoutMode, buyNowProduct } = useCheckoutMode();
  
  // Form
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormType>();
  const phoneNumber = watch("phone") || "";

  // Memoized values
  const symbol = currencyContext?.selectedCurr?.symbol || "$";
  const contextCartItems = cartContext?.cartItems || [];
  const emptyCart = cartContext?.emptyCart || (() => {});
  const appName = appConfig?.appName || "MyApp";
  const defaultStoreId = appConfig?.defaultStoreId || "default";
  const paymentModes = useMemo(() => OrderPayloadService.getPaymentModes(), []);
  const countries = useMemo(() => OrderPayloadService.getCountries(), []);

  const apiConfig = {
    tenantId: appConfig.tenantId,
    storeId: appConfig.defaultStoreId,
  };

  // Set default phone number
  useEffect(() => {
    let defaultPhone = "";
    if (authContext?.user?.phone) {
      defaultPhone = authContext.user.phone;
    } else if (typeof window !== "undefined") {
      const addressDetails = window.sessionStorage.getItem("addressDetails");
      if (addressDetails) {
        try {
          const parsed = JSON.parse(addressDetails);
          defaultPhone = parsed.phone || "";
        } catch (e) {
          console.error("Error parsing address details:", e);
        }
      }
    }
    if (defaultPhone) {
      setValue("phone", defaultPhone, { shouldValidate: true });
    }
  }, [authContext, setValue]);

  // Set cart items based on mode
  useEffect(() => {
    if (checkoutMode === 'buyNow' && buyNowProduct) {
      const buyNowItem = transformToCartItem(buyNowProduct, 0, true);
      setCartItems([buyNowItem]);
    } else {
      const cartTransformed = contextCartItems.map((item: any, index: number) => 
        transformToCartItem(item, index, false)
      );
      setCartItems(cartTransformed);
    }
  }, [contextCartItems, checkoutMode, buyNowProduct]);

  // Fetch coupons
  const fetchCoupons = useCallback(async (userPhone: string) => {
    if (!userPhone) {
      setAvailableCoupons([]);
      return;
    }

    try {
      const response = await API.get<{ data: any[] }>(`${API.baseURL}/get-coupons`, {
        tenant_id: apiConfig.tenantId,
        store_id: apiConfig.storeId,
      });

      const now = new Date();
      const validCoupons: Coupon[] = response.data
        .map((couponData) => {
          try {
            const coupon = CouponModel.fromJson(couponData);
            const isNotExpired = !coupon.expireDate || new Date(coupon.expireDate) >= now;
            const isUserAllowed = !coupon.assignedUsers || 
                                coupon.assignedUsers.length === 0 || 
                                coupon.assignedUsers.some(user => user.phone_number === userPhone);
            
            return (isNotExpired && isUserAllowed) ? coupon : null;
          } catch (e) {
            console.error(`Error parsing coupon: ${JSON.stringify(couponData)}`);
            return null;
          }
        })
        .filter((coupon): coupon is Coupon => coupon !== null);

      setAvailableCoupons(validCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setAvailableCoupons([]);
    }
  }, [apiConfig.tenantId, apiConfig.storeId]);

  useEffect(() => {
    let userPhone = phoneNumber;
    if (!userPhone && typeof window !== "undefined") {
      const addressDetails = window.sessionStorage.getItem("addressDetails");
      if (addressDetails) {
        try {
          const parsed = JSON.parse(addressDetails);
          userPhone = parsed.phone || "";
        } catch (e) {
          console.error("Error parsing address details for coupons:", e);
        }
      }
    }
    fetchCoupons(userPhone);
  }, [phoneNumber, cartItems, fetchCoupons]);

  // Coupon handlers
  const handleSelectCoupon = useCallback((coupon: Coupon) => {
    setCouponError("");
    
    const now = new Date();
    if (coupon.expireDate && new Date(coupon.expireDate) < now) {
      setCouponError("Coupon has expired.");
      setAppliedCoupon(null);
      return;
    }
    
    const cartTotal = cartItems.reduce((sum, item) => 
      sum + ((item.discountPrice || item.price) * item.cartItemCount), 0);
    
    if (cartTotal < coupon.minimumCartValue) {
      setCouponError(`Minimum cart value for this coupon is ₹${coupon.minimumCartValue}`);
      setAppliedCoupon(null);
      return;
    }
    
    setAppliedCoupon(coupon);
  }, [cartItems]);

  // Order calculations
  const calculations = useMemo((): OrderCalculations => {
    let cartAmount = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    cartItems.forEach(item => {
      const itemPrice = item.discountPrice || item.price;
      const itemTotal = itemPrice * item.cartItemCount;
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

  // Order success handler
  const handleOrderSuccess = useCallback(async (orderModel: any, formData: FormType) => {
    toast.success("Order placed successfully!");
    
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("orderDetails", JSON.stringify(orderModel));
      window.sessionStorage.setItem("addressDetails", JSON.stringify(formData));
      window.sessionStorage.removeItem("buyNowProduct");
      window.sessionStorage.removeItem("checkoutMode");
    }
    
    setCartItems([]);
    
    if (checkoutMode === 'cart') {
      emptyCart();
    }
    
    setTimeout(() => router.push("/pages/order-success"), 1500);
  }, [router, emptyCart, checkoutMode]);

  // Prepare order data
  const prepareOrderData = useCallback((formData: FormType) => {
    try {
      const orderConfig = {
        formData,
        cartItems,
        selectedPaymentMode,
        cartCalculations: calculations,
        storeDetails: { id: defaultStoreId, name: appName, active: true },
        gstNumber,
        appName,
        defaultStoreId
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);
     
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
          pincode: formData.pincode
        }
      };

      const deliveryAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode
      };

      return { orderData, orderModel, deliveryAddress };
    } catch (error) {
      console.error("Error preparing order data:", error);
      toast.error("Failed to prepare order data");
      return null;
    }
  }, [cartItems, selectedPaymentMode, calculations, gstNumber, appName, defaultStoreId]);

  // Razorpay success handler
  const handleRazorpaySuccess = useCallback(async () => {
    try {
      const orderSuccessData = sessionStorage.getItem("order-success-data");
      if (orderSuccessData) {
        const orderData = JSON.parse(orderSuccessData);
       
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
            pincode: orderData.billingDetails.pincode
          },
          orderData.orderModel || {},
          cartItems,
          calculations,
          selectedPaymentMode,
          { id: defaultStoreId, name: appName },
          gstNumber
        );
       
        setCartItems([]);
        
        if (checkoutMode === 'cart') {
          emptyCart();
        }
        
        sessionStorage.removeItem("buyNowProduct");
        sessionStorage.removeItem("checkoutMode");
        sessionStorage.removeItem("order-success-data");
        
        setTimeout(() => router.push("/pages/order-success"), 1500);
      }
    } catch (error) {
      console.error("Error handling Razorpay success:", error);
      toast.error("Error processing payment success");
    }
  }, [cartItems, calculations, selectedPaymentMode, defaultStoreId, appName, gstNumber, emptyCart, router, checkoutMode]);

  // Form submission
  const onSubmit = useCallback(async (formData: FormType) => {
    console.log("Form submitted with data:", formData);
    console.log("Current checkout mode:", checkoutMode);
    console.log("Current cart items:", cartItems);
    
    setIsProcessing(true);
    setShowValidationErrors(true);

    if (!selectedPaymentMode || cartItems.length === 0) {
      toast.error(!selectedPaymentMode ? "Please select a payment method" : "Your cart is empty");
      setIsProcessing(false);
      return;
    }

    try {
      const orderConfig = {
        formData,
        cartItems,
        selectedPaymentMode,
        cartCalculations: calculations,
        storeDetails: { id: defaultStoreId, name: appName, active: true },
        gstNumber,
        appName,
        defaultStoreId
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);
      
      if (API && API.saveOrder) {
        await API.saveOrder(orderModel);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (selectedPaymentMode) {
        case "COD":
        case "PICK_AT_STORE":
          await handleOrderSuccess(orderModel, formData);
          break;
          
        case "RAZORPAY":
          toast.success("Order created successfully! Please complete the payment.");
          setIsProcessing(false);
          return;
          
        case "PHONEPE":
          toast.info("Redirecting to payment gateway...");
          setTimeout(async () => await handleOrderSuccess(orderModel, formData), 2000);
          break;
          
        default:
          toast.error("Invalid payment method");
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      if (selectedPaymentMode !== "RAZORPAY") {
        setIsProcessing(false);
      }
    }
  }, [selectedPaymentMode, cartItems, calculations, gstNumber, appName, defaultStoreId, handleOrderSuccess, checkoutMode]);

  // Payment button
  const getPaymentButton = useCallback(() => {
    const buttonText = isProcessing ? "Processing..." : PAYMENT_TEXT_MAP[selectedPaymentMode as keyof typeof PAYMENT_TEXT_MAP] || "Place Order";

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
      >
        {buttonText}
      </button>
    );
  }, [selectedPaymentMode, watch, prepareOrderData, calculations.finalTotal, handleRazorpaySuccess, isProcessing]);

  // Validation errors
  const validationErrors = useMemo(() => {
    if (!showValidationErrors) return [];
    return [
      ...(!selectedPaymentMode ? ["Payment method is required"] : []),
      ...(cartItems.length === 0 ? ["Cart is empty"] : []),
      ...(phoneNumber === "" ? ["Phone number is required to fetch coupons"] : [])
    ];
  }, [showValidationErrors, selectedPaymentMode, cartItems.length, phoneNumber]);

  // Early return for empty cart
  if (cartItems.length === 0) {
    return (
      <>
        <Breadcrumb title="checkout" parent="home" />
        <EmptyCartView onContinueShopping={() => router.push("/")} />
      </>
    );
  }

  return (
    <>
      <Breadcrumb title="checkout" parent="home" />
      <section className="checkout-container">
        <div className="container">
          <CheckoutModeIndicator mode={checkoutMode} />
          
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
                          {...register("firstName", VALIDATION_RULES.firstName)}
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
                          {...register("lastName", VALIDATION_RULES.lastName)}
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
                          {...register("phone", VALIDATION_RULES.phone)}
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
                          {...register("email", VALIDATION_RULES.email)}
                        />
                        {errors.email && <span className="error-message">{errors.email.message}</span>}
                      </div>
                    </Col>
                    <Col md="12">
                      <div className="form-group">
                        <label className="field-label">Country *</label>
                        <select
                          className={`form-control ${errors.country ? "error_border" : ""}`}
                          {...register("country", VALIDATION_RULES.country)}
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
                          {...register("state", VALIDATION_RULES.state)}
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
                          {...register("city", VALIDATION_RULES.city)}
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
                          {...register("address", VALIDATION_RULES.address)}
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
                          {...register("pincode", VALIDATION_RULES.pincode)}
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
                          onChange={(e) => setGstNumber(e.target.value)}
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
                        onClick={() => setSelectedPaymentMode(mode.value)}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={mode.value}
                          checked={selectedPaymentMode === mode.value}
                          onChange={(e) => setSelectedPaymentMode(e.target.value)}
                          className="payment-mode-radio"
                        />
                        <label className="payment-mode-label">
                          {mode.label}
                        </label>
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
                      <CartItemCard
                        key={`${item.id}_${index}`}
                        item={item}
                        symbol={symbol}
                      />
                    ))}
                  </div>
                  
                  <CouponSection
                    coupons={availableCoupons}
                    appliedCoupon={appliedCoupon}
                    phoneNumber={phoneNumber}
                    couponError={couponError}
                    onSelectCoupon={handleSelectCoupon}
                  />
                  
                  <OrderTotals calculations={calculations} symbol={symbol} />
                  
                  {validationErrors.length > 0 && (
                    <div className="alert alert-danger">
                      <h6>Please fix the following errors:</h6>
                      <ul className="mb-0">
                        {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                      </ul>
                    </div>
                  )}
                 
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