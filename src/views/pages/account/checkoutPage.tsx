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
import { searchController, Kit } from "@/app/globalProvider";
import RazorpayButton from "../../../app/(MainBody)/pages/account/checkout/components/RazorpayButton";
import { createOrderPayload, storeOrderSuccessData } from "../../../utils/orderPayloadUtils";

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
  productId?: string;
  qty?: number;
  purchaseOptionStr?: string;
  cartItemId?: string;
  key?: string;
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

interface KitRaw {
  id: string;
  [key: string]: any;
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

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormType>();
  const phoneNumber = watch("phone") || "";

  const symbol = currencyContext?.selectedCurr?.symbol || "$";
  const currencyValue = currencyContext?.selectedCurr?.value || 1;
  const contextCartItems = cartContext?.cartItems || [];
  const emptyCart = cartContext?.emptyCart || (() => {});
  const appName = appConfig?.appName || "MyApp";
  const defaultStoreId = appConfig?.defaultStoreId || "default";

  const paymentModes = useMemo(() => OrderPayloadService.getPaymentModes(), []);
  const countries = useMemo(() => OrderPayloadService.getCountries(), []);

  // Use dynamic values from appConfig
  const tenantId = appConfig.tenantId;
  const storeId = appConfig.defaultStoreId;

  // Configuration for tenantId and storeId
  const apiConfig = {
    tenantId,
    storeId,
  };

  // CONSISTENT PRICE CALCULATION FUNCTION - Same as Cart Page
  const getProductById = useCallback((productId: string): any => {
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
          if (Kit.fromMap && typeof Kit.fromMap === "function") {
            return Kit.fromMap(kitRaw);
          }
        }
      }
    } catch (error) {
      console.error("Error finding product:", error);
    }

    return null;
  }, []);

  const getPrice = useCallback((item: CartItem): number => {
    if (!item) return 0;

    try {
      const product = getProductById(item.productId || item.id);
      
      if (product) {
        // Handle Kit products
        if (product instanceof Kit && typeof product.getPrice === "function") {
          try {
            const price = product.getPrice({ cartQuantity: item.cartItemCount || item.qty || 1 });
            if (typeof price === 'number' && !isNaN(price) && price > 0) {
              return price;
            }
          } catch (methodError) {
            console.warn("Kit getPrice method failed:", methodError);
          }
        }
        
        // Handle regular products
        if (product?.getPrice && typeof product.getPrice === "function") {
          try {
            const price = product.getPrice({
              cartQuantity: item.cartItemCount || item.qty || 1,
              purchaseOptionStr: item.cartPurchaseOptionStr || item.purchaseOptionStr || "",
            });
            if (typeof price === 'number' && !isNaN(price) && price > 0) {
              return price;
            }
          } catch (methodError) {
            console.warn("Product getPrice method failed:", methodError);
          }
        }
      }

      // Fallback price extraction
      const extractPriceFromObject = (obj: any): number => {
        if (!obj || typeof obj !== 'object') return 0;

        const priceFields = ['discountPrice', 'price', 'kitPrice', 'salePrice', 'finalPrice', 'currentPrice', 'sellingPrice'];
        
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

      // Final fallbacks
      if (item.discountPrice && typeof item.discountPrice === 'number' && item.discountPrice > 0) {
        return item.discountPrice;
      }
      if (typeof item.price === 'number' && item.price > 0) {
        return item.price;
      }

      return 0;
    } catch (err) {
      console.error("Price extraction error:", err);
      return item.discountPrice || item.price || 0;
    }
  }, [getProductById]);

  // Alternative price calculation using searchController.getDetails
  const getPriceUsingSearchController = useCallback((item: CartItem): number => {
    try {
      const productId = item.productId || item.id;
      if (searchController && searchController.getDetails) {
        const price = searchController.getDetails(productId, 'getPrice');
        if (typeof price === 'number' && !isNaN(price) && price > 0) {
          return price;
        }
      }
    } catch (error) {
      console.warn("SearchController getPrice failed, using fallback:", error);
    }
    
    return getPrice(item);
  }, [getPrice]);

  // Helper function to get unique identifier for item
  const getItemKey = useCallback((item: CartItem): string => {
    return item.cartItemId || item.key || item.id || item.productId || Math.random().toString();
  }, []);

  // Fetch and set default phone number from profile or sessionStorage
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
          console.error("Error parsing addressDetails:", e);
        }
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
            try {
              const parsed = JSON.parse(addressDetails);
              userPhone = parsed.phone || "";
            } catch (e) {
              console.error("Error parsing addressDetails for phone:", e);
            }
          }
        }

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

  const handleSelectCoupon = useCallback((coupon: Coupon) => {
    setCouponError("");
    const now = new Date();
    if (coupon.expireDate && new Date(coupon.expireDate) < now) {
      setCouponError("Coupon has expired.");
      setAppliedCoupon(null);
      return;
    }
    const cartTotal = cartItems.reduce((sum, item) => sum + (getPriceUsingSearchController(item) * (item.cartItemCount || item.qty || 1)), 0);
    if (cartTotal < coupon.minimumCartValue) {
      setCouponError(`Minimum cart value for this coupon is ₹${coupon.minimumCartValue}`);
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(coupon);
  }, [cartItems, getPriceUsingSearchController]);

  // Set cart items from context or buyNow mode
  useEffect(() => {
    let buyNowMode = false;
    let buyNowProduct = null;
    if (typeof window !== "undefined") {
      buyNowMode = window.sessionStorage.getItem("checkoutMode") === "buyNow";
      const buyNowRaw = window.sessionStorage.getItem("buyNowProduct");
      if (buyNowRaw) {
        try {
          buyNowProduct = JSON.parse(buyNowRaw);
        } catch (e) {
          console.error("Error parsing buyNowProduct:", e);
        }
      }
    }

    if (buyNowMode && buyNowProduct) {
      // For buyNow mode, show only the buyNow product
      const buyNowItem: CartItem = {
        id: buyNowProduct.id || `item-0`,
        name: buyNowProduct.name || "Unknown Product",
        img: Array.isArray(buyNowProduct.img) ? buyNowProduct.img : [buyNowProduct.img || "/static/images/placeholder.png"],
        cartItemCount: buyNowProduct.qty || 1,
        cartPurchaseOptionStr: buyNowProduct.purchaseOptionStr || "default",
        price: buyNowProduct.price || 0,
        discountPrice: buyNowProduct.discountPrice,
        taxType: buyNowProduct.taxType || "EXCLUSIVE",
        taxAmount: parseFloat(buyNowProduct.taxAmount) || 0,
        active: true,
        isReturnable: buyNowProduct.isReturnable || false,
        categoryName: buyNowProduct.categoryName || "General",
        categoryID: buyNowProduct.categoryID || "default",
        productId: buyNowProduct.productId || buyNowProduct.id,
        qty: buyNowProduct.qty || 1,
        purchaseOptionStr: buyNowProduct.purchaseOptionStr || "default"
      };
      setCartItems([buyNowItem]);
    } else {
      // For normal cart mode, show all cart items without merging duplicates
      const cartTransformed: CartItem[] = contextCartItems.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        name: item.name || "Unknown Product",
        img: Array.isArray(item.img) ? item.img : [item.img || "/static/images/placeholder.png"],
        cartItemCount: item.qty || 1,
        cartPurchaseOptionStr: item.purchaseOptionStr || "default",
        price: item.price || 0,
        discountPrice: item.discountPrice,
        taxType: item.taxType || "EXCLUSIVE",
        taxAmount: parseFloat(item.taxAmount) || 0,
        active: true,
        isReturnable: item.isReturnable || false,
        categoryName: item.categoryName || "General",
        categoryID: item.categoryID || "default",
        productId: item.productId || item.id,
        qty: item.qty || 1,
        purchaseOptionStr: item.purchaseOptionStr || "default",
        cartItemId: item.cartItemId,
        key: item.key
      }));
      
      setCartItems(cartTransformed);
    }
  }, [contextCartItems]);

  // Calculate order totals with consistent pricing
  const calculations = useMemo((): OrderCalculations => {
    let cartAmount = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    cartItems.forEach(item => {
      const currentPrice = getPriceUsingSearchController(item);
      const quantity = item.cartItemCount || item.qty || 1;
      const itemTotal = currentPrice * quantity;
      cartAmount += itemTotal;
      
      // Calculate discount only if there's a difference between original price and current price
      if (item.price && currentPrice < item.price) {
        discountAmount += (item.price - currentPrice) * quantity;
      }
      
      taxAmount += (item.taxAmount || 0) * quantity;
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
  }, [cartItems, selectedPaymentMode, appliedCoupon, getPriceUsingSearchController]);

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
      window.sessionStorage.setItem("orderDetails", JSON.stringify(orderModel));
      window.sessionStorage.setItem("addressDetails", JSON.stringify(formData));
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
          pincode: formData.pincode
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
        pincode: formData.pincode
      };

      return { orderData, orderModel, deliveryAddress };
    } catch (error) {
      console.error("Error preparing order data:", error);
      toast.error("Failed to prepare order data");
      return null;
    }
  }, [cartItems, selectedPaymentMode, calculations, gstNumber, appName, defaultStoreId]);

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
            pincode: orderData.billingDetails.pincode
          },
          orderData.orderModel || {},
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
      if (API && API.saveOrder) await API.saveOrder(orderModel);

      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (selectedPaymentMode) {
        case "COD":
        case "PICK_AT_STORE":
          await handleOrderSuccess(orderModel, formData);
          break;
        case "RAZORPAY":
          // For Razorpay, the payment is handled by the RazorpayButton component
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
        className="btn btn-primary btn-block"
        disabled={isProcessing || !selectedPaymentMode}
        style={{ width: "100%", marginTop: "20px", padding: "15px", fontSize: "16px", fontWeight: "bold" }}
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
              <img
                src="/static/images/icon-empty-cart.png"
                className="img-fluid mb-4 empty-cart-image"
                alt="empty cart"
                style={{ maxWidth: '200px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <h3 className="empty-cart-title mb-3">
                <strong>Your Cart is Empty</strong>
              </h3>
              <p className="empty-cart-subtitle text-muted mb-4">
                Add some items to your cart to proceed with checkout.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => router.push("/")}>
                <i className="fa fa-shopping-cart mr-2"></i>
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
                        style={{ 
                          padding: "15px", 
                          border: "2px solid", 
                          borderColor: selectedPaymentMode === mode.value ? "#00baf2" : "#ddd",
                          marginBottom: "10px", 
                          cursor: "pointer", 
                          backgroundColor: selectedPaymentMode === mode.value ? "#f0f8ff" : "#fff",
                          borderRadius: "8px",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={mode.value}
                          checked={selectedPaymentMode === mode.value}
                          onChange={(e) => handlePaymentModeChange(e.target.value)}
                          style={{ marginRight: "12px" }}
                        />
                        <label style={{ cursor: "pointer", fontWeight: selectedPaymentMode === mode.value ? "600" : "400" }}>
                          {mode.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
              <Col lg="5">
                <div className="order-summary" style={{ position: "sticky", top: "20px" }}>
                  <h3 className="checkout-title">Order Summary</h3>
                  <div className="cart-items" style={{ marginBottom: "20px", maxHeight: "400px", overflowY: "auto" }}>
                    {cartItems.map((item, index) => {
                      const currentPrice = getPriceUsingSearchController(item);
                      const quantity = item.cartItemCount || item.qty || 1;
                      const itemKey = getItemKey(item);
                      
                      return (
                        <div key={itemKey} className="cart-item" style={{ 
                          display: "flex", 
                          padding: "15px", 
                          borderBottom: "1px solid #eee", 
                          alignItems: "center",
                          backgroundColor: "#fff",
                          marginBottom: "8px",
                          borderRadius: "6px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                          <img
                            src={item.img[0] || "/static/images/placeholder.png"}
                            alt={item.name}
                            style={{ 
                              width: "60px", 
                              height: "60px", 
                              objectFit: "cover", 
                              marginRight: "15px",
                              borderRadius: "6px",
                              border: "1px solid #e0e0e0"
                            }}
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement;
                              target.src = "/static/images/placeholder.png"; 
                            }}
                          />
                          <div className="item-details" style={{ flex: 1 }}>
                            <div className="item-name" style={{ 
                              fontWeight: "600", 
                              marginBottom: "5px", 
                              fontSize: "14px",
                              lineHeight: "1.3"
                            }}>
                              {item.name}
                            </div>
                            <div className="item-price" style={{ fontSize: "13px", color: "#666" }}>
                              Qty: {quantity} × {symbol}{currentPrice.toFixed(2)}
                            </div>
                            {item.price && currentPrice < item.price && (
                              <div className="item-discount" style={{ fontSize: "12px", color: "#28a745", fontWeight: "500" }}>
                                Saved: {symbol}{((item.price - currentPrice) * quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="item-total" style={{ fontWeight: "700", color: "#333", fontSize: "15px" }}>
                            {symbol}{(currentPrice * quantity * currencyValue).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Section */}
                  <div className="coupon-section" style={{ marginBottom: "20px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                    <label className="field-label" style={{ color: "#00baf2", fontWeight: "600", marginBottom: "15px", display: "block" }}>
                      Available Coupons
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "15px" }}>
                      {availableCoupons.length === 0 && (
                        <span style={{ color: "#888", fontSize: "14px", fontStyle: "italic" }}>
                          {phoneNumber ? "No coupons available" : "Enter phone number to view coupons"}
                        </span>
                      )}
                      {availableCoupons.map((coupon) => (
                        <button
                          key={coupon.couponCode}
                          type="button"
                          className="btn btn-sm"
                          style={{
                            background: appliedCoupon?.couponCode === coupon.couponCode ? "#00baf2" : "#e6f7ff",
                            color: appliedCoupon?.couponCode === coupon.couponCode ? "#fff" : "#00baf2",
                            border: "1px solid #00baf2",
                            fontWeight: "500",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            transition: "all 0.3s ease"
                          }}
                          onClick={() => handleSelectCoupon(coupon)}
                          onMouseEnter={(e) => {
                            if (appliedCoupon?.couponCode !== coupon.couponCode) {
                              e.currentTarget.style.backgroundColor = "#d1ecf1";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (appliedCoupon?.couponCode !== coupon.couponCode) {
                              e.currentTarget.style.backgroundColor = "#e6f7ff";
                            }
                          }}
                        >
                          {coupon.couponCode} - {coupon.isCouponPercentage ? `${coupon.couponAmount}% off` : `₹${coupon.couponAmount} off`}
                          {coupon.maxCouponAmount > 0 && ` (Max ₹${coupon.maxCouponAmount})`}
                        </button>
                      ))}
                    </div>
                    {couponError && <div className="text-danger" style={{ fontSize: "13px", marginBottom: "10px" }}>{couponError}</div>}
                    {appliedCoupon && (
                      <div style={{ 
                        color: "#00baf2", 
                        fontWeight: "500", 
                        fontSize: "13px", 
                        padding: "8px", 
                        backgroundColor: "#e6f7ff", 
                        borderRadius: "4px", 
                        border: "1px solid #b3d9ff" 
                      }}>
                        ✓ Coupon <strong>{appliedCoupon.couponCode}</strong> applied: {appliedCoupon.isCouponPercentage ? `${appliedCoupon.couponAmount}% off` : `₹${appliedCoupon.couponAmount} off`}
                        {appliedCoupon.maxCouponAmount > 0 && ` (Max ₹${appliedCoupon.maxCouponAmount})`}
                      </div>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="order-totals" style={{ 
                    padding: "20px", 
                    backgroundColor: "#fff", 
                    border: "1px solid #e0e0e0", 
                    borderRadius: "8px" 
                  }}>
                    <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                      <span>Cart Total</span>
                      <span style={{ fontWeight: "500" }}>{symbol}{(calculations.cartAmount * currencyValue).toFixed(2)}</span>
                    </div>
                    {calculations.discountAmount > 0 && (
                      <div className="total-row discount" style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        marginBottom: "12px", 
                        color: "#28a745",
                        fontSize: "14px"
                      }}>
                        <span>Item Discount</span>
                        <span style={{ fontWeight: "500" }}>-{symbol}{(calculations.discountAmount * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.couponDiscount > 0 && (
                      <div className="total-row coupon" style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        marginBottom: "12px", 
                        color: "#00baf2",
                        fontSize: "14px"
                      }}>
                        <span>Coupon Discount</span>
                        <span style={{ fontWeight: "500" }}>-{symbol}{(calculations.couponDiscount * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.taxAmount > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                        <span>Tax</span>
                        <span style={{ fontWeight: "500" }}>{symbol}{(calculations.taxAmount * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.packageCost > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                        <span>Package Cost</span>
                        <span style={{ fontWeight: "500" }}>{symbol}{(calculations.packageCost * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.deliveryCharges > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                        <span>Delivery Charges</span>
                        <span style={{ fontWeight: "500" }}>{symbol}{(calculations.deliveryCharges * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.totalSavings > 0 && (
                      <div className="total-row savings" style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        marginBottom: "15px", 
                        color: "#28a745",
                        fontSize: "14px",
                        fontWeight: "600"
                      }}>
                        <span>Total Savings</span>
                        <span>{symbol}{(calculations.totalSavings * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    <hr style={{ margin: "15px 0", borderColor: "#e0e0e0" }} />
                    <div className="total-row final" style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      fontWeight: "700", 
                      fontSize: "18px",
                      color: "#000"
                    }}>
                      <span>Final Total</span>
                      <span style={{ color: "#00baf2" }}>{symbol}{(calculations.finalTotal * currencyValue).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="alert alert-danger" style={{ marginTop: "20px", padding: "15px", borderRadius: "6px" }}>
                      <h6 style={{ marginBottom: "10px", fontWeight: "600" }}>Please fix the following errors:</h6>
                      <ul className="mb-0" style={{ paddingLeft: "20px" }}>
                        {validationErrors.map((error, index) => (
                          <li key={index} style={{ marginBottom: "5px", fontSize: "14px" }}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Render payment button based on selected payment mode */}
                  {getPaymentButton()}
                  
                  <div style={{ marginTop: "15px", textAlign: "center" }}>
                    <small className="text-muted" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      {selectedPaymentMode === "PICK_AT_STORE" && "Order will be ready for pickup at store within 2-4 hours."}
                      {selectedPaymentMode === "COD" && "Payment will be collected upon delivery (Cash/Card)."}
                      {selectedPaymentMode === "RAZORPAY" && "Secure payment powered by Razorpay. All major cards accepted."}
                      {selectedPaymentMode === "PHONEPE" && "You will be redirected to PhonePe payment gateway."}
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