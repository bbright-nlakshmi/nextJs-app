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
import { searchController, Kit } from "@/app/globalProvider"; // Import searchController and Kit

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
  // Additional properties that might exist
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
          if (Kit.fromMap && typeof Kit.fromMap === "function") {
            return Kit.fromMap(kitRaw);
          }
        }
      }
    } catch (error) {
      console.error("Error finding product:", error);
    }

    return null;
  };

  const getPrice = (item: CartItem): number => {
    if (!item) return 0;

    try {
      const product = getProductById(item.productId || item.id);
      
      if (product) {
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

      // Fallback to item.discountPrice || item.price
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
    const cartTotal = cartItems.reduce((sum, item) => sum + (getPrice(item) * (item.cartItemCount || item.qty || 1)), 0);
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

    const buyNowItem: CartItem | null = buyNowMode && buyNowProduct ? {
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
    } : null;

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
      purchaseOptionStr: item.purchaseOptionStr || "default"
    }));

    const merged: { [key: string]: CartItem } = {};
    const getKey = (item: any) => item.id;
    if (buyNowItem) merged[getKey(buyNowItem)] = buyNowItem;
    cartTransformed.forEach(item => {
      const key = getKey(item);
      if (merged[key]) {
        merged[key].cartItemCount += item.cartItemCount;
        if (merged[key].qty) merged[key].qty! += (item.qty || 1);
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
      const currentPrice = getPrice(item); // Use consistent price calculation
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
  }, [cartItems, selectedPaymentMode, appliedCoupon]);

  const handlePaymentModeChange = useCallback((mode: string) => setSelectedPaymentMode(mode), []);
  const handleGstChange = useCallback((value: string) => setGstNumber(value), []);

  const getPaymentButtonText = useCallback(() => {
    return isProcessing ? "Processing..." : "Place Order";
  }, [isProcessing]);

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
                          style={{ marginRight: "10px" }}
                        />
                        <label style={{ cursor: "pointer" }}>{mode.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
              <Col lg="5">
                <div className="order-summary">
                  <h3 className="checkout-title">Order Summary</h3>
                  <div className="cart-items" style={{ marginBottom: "20px" }}>
                    {cartItems.map((item, index) => {
                      const currentPrice = getPrice(item); // Use consistent price calculation
                      const quantity = item.cartItemCount || item.qty || 1;
                      
                      return (
                        <div key={`${item.id}_${index}`} className="cart-item" style={{ display: "flex", padding: "15px", borderBottom: "1px solid #eee", alignItems: "center" }}>
                          <img
                            src={item.img[0] || "/static/images/placeholder.png"}
                            alt={item.name}
                            style={{ width: "60px", height: "60px", objectFit: "cover", marginRight: "15px" }}
                            onError={(e) => { (e.target as HTMLImageElement).src = "/static/images/placeholder.png"; }}
                          />
                          <div className="item-details" style={{ flex: 1 }}>
                            <div className="item-name" style={{ fontWeight: "bold", marginBottom: "5px" }}>{item.name}</div>
                            <div className="item-price" style={{ fontSize: "14px", color: "#666" }}>
                              Qty: {quantity} × {symbol}{currentPrice.toFixed(2)}
                            </div>
                            {item.price && currentPrice < item.price && (
                              <div className="item-discount" style={{ fontSize: "12px", color: "#28a745" }}>
                                Discount: {symbol}{((item.price - currentPrice) * quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="item-total" style={{ fontWeight: "bold" }}>
                            {symbol}{(currentPrice * quantity * currencyValue).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="order-totals" style={{ padding: "20px", backgroundColor: "#f8f9fa" }}>
                    <div className="form-group mb-3" style={{ marginTop: "20px" }}>
                      <label className="field-label" style={{ color: "#00baf2", fontWeight: 600 }}>Available Coupons</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                        {availableCoupons.length === 0 && <span style={{ color: "#888" }}>{phoneNumber ? "No coupons available" : "Enter phone number to view coupons"}</span>}
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
                        <div className="mt-1" style={{ color: "#00baf2", fontWeight: 500 }}>
                          Coupon <strong>{appliedCoupon.couponCode}</strong> applied: {appliedCoupon.isCouponPercentage ? `${appliedCoupon.couponAmount}% off` : `₹${appliedCoupon.couponAmount} off`} {appliedCoupon.maxCouponAmount > 0 ? `(Max ₹${appliedCoupon.maxCouponAmount})` : ""}
                        </div>
                      )}
                    </div>
                    <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span>Cart Total</span>
                      <span>{symbol}{(calculations.cartAmount * currencyValue).toFixed(2)}</span>
                    </div>
                    {calculations.discountAmount > 0 && (
                      <div className="total-row discount" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#28a745" }}>
                        <span>Item Discount</span>
                        <span>-{symbol}{(calculations.discountAmount * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.couponDiscount > 0 && (
                      <div className="total-row coupon" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#00baf2" }}>
                        <span>Coupon Discount</span>
                        <span>-{symbol}{(calculations.couponDiscount * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.taxAmount > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Tax</span>
                        <span>{symbol}{(calculations.taxAmount * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.packageCost > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Package Cost</span>
                        <span>{symbol}{(calculations.packageCost * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.deliveryCharges > 0 && (
                      <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Delivery Charges</span>
                        <span>{symbol}{(calculations.deliveryCharges * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.totalSavings > 0 && (
                      <div className="total-row savings" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#28a745" }}>
                        <span>Total Savings</span>
                        <span>{symbol}{(calculations.totalSavings * currencyValue).toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="total-row final" style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px" }}>
                      <span>Final Total</span>
                      <span>{symbol}{(calculations.finalTotal * currencyValue).toFixed(2)}</span>
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
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={isProcessing || !selectedPaymentMode}
                    style={{ width: "100%", marginTop: "20px", padding: "15px", fontSize: "16px", fontWeight: "bold" }}
                  >
                    {getPaymentButtonText()}
                  </button>
                  <div style={{ marginTop: "15px" }}>
                    <small className="text-muted">
                      {selectedPaymentMode === "PICK_AT_STORE" && "Order will be ready for pickup at store."}
                      {selectedPaymentMode === "COD" && "Payment will be collected upon delivery."}
                      {(selectedPaymentMode === "RAZORPAY" || selectedPaymentMode === "PHONEPE") && "You will be redirected to payment gateway."}
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