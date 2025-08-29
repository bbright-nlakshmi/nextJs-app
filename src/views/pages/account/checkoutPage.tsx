"use client";
import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Form, Row, Col } from "reactstrap";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import { CartContext } from "@/helpers/cart/cart.context";
import { useRouter } from "next/navigation";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { toast } from "react-toastify";
import { usePlaceOrder, OrderPayloadService } from "../../../app/providers/usePlaceOrder/usePlaceOrder";
import { API, searchController, Kit } from "@/app/globalProvider";
import { appConfig } from "../../../app/config/";
import RazorpayButton from "../../../app/(MainBody)/pages/account/checkout/components/RazorpayButton";
import { storeOrderSuccessData } from "../../../utils/orderPayloadUtils";
import { getSizeLabel } from "@/utils/Labels";


// Types
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

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface AuthContextType {
  user: { phone: string } | null;
}

interface KitRaw {
  id: string;
  [key: string]: any;
}

interface CartItem {
  id: string;
  productId?: string;
  cartItemId?: string;
  key?: string;
  name?: string;
  img?: string[];
  qty: number;
  cartItemCount?: number;
  price?: number;
  discountPrice?: number;
  selectedSize?: string;
  purchaseOptionStr?: string;
  sellingDisplayOptions?: string[];
  sellingPrices?: number[];
  [key: string]: any;
}

// Mock contexts
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

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
  "RAZORPAY": "Pay with Razorpay"
};

// Enhanced pricing functions (copied from cart page)
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
    // Silent error handling
  }

  return null;
};

const getProductVariations = (item: CartItem): { sizes: string[], sizePrices: number[], uniqueSize: string[] } => {
  try {
    const product = getProductById(item.productId || item.id);
    
    if (product) {
      return {
        sizes: Array.isArray(product?.sellingDisplayOptions) ? product.sellingDisplayOptions : [],
        sizePrices: Array.isArray(product?.sellingPrices) ? product.sellingPrices : [],
        uniqueSize: Array.isArray(product?.sellingDisplayOption) ? product.sellingDisplayOption : []
      };
    }
    
    return {
      sizes: item?.sellingDisplayOptions || [],
      sizePrices: item?.sellingPrices || [],
      uniqueSize: item?.sellingDisplayOption || []
    };
  } catch (error) {
    return { sizes: [], sizePrices: [], uniqueSize: [] };
  }
};

// Enhanced getPrice function (exact copy from cart page)
const getPrice = (item: CartItem): number => {
  if (!item) return 0;

  try {
    const product = getProductById(item.productId || item.id);
   
    if (product) {
      if (product instanceof Kit && typeof product.getPrice === "function") {
        try {
          const price = product.getPrice({ cartQuantity: item.qty || item.cartItemCount || 1 });
          if (typeof price === 'number' && !isNaN(price) && price > 0) {
            return price;
          }
        } catch (methodError) {
          // Silent error handling
        }
      }
     
      if (product?.getPrice && typeof product.getPrice === "function") {
        try {
          const price = product.getPrice({
            cartQuantity: item.qty || item.cartItemCount || 1,
            purchaseOptionStr: item.purchaseOptionStr || "",
          });
          if (typeof price === 'number' && !isNaN(price) && price > 0) {
            return price;
          }
        } catch (methodError) {
          // Silent error handling
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
    return item.price || 0;
  }
};

// Size display function (copied from cart page)
const getProductSizeDisplay = (item: CartItem) => {
  const product = getProductById(item.productId || item.id);
  
  // Get the same data as cart page
  const { sizes, uniqueSize } = getProductVariations(item);
  const saleMode = product?.saleMode || item.saleMode;
  
  // Get the current selected size or fallback
  const currentSize = item.selectedSize || item.cartPurchaseOptionStr || sizes[0] || uniqueSize[0] || '';
  
  return {
    uniqueSizes: sizes,
    uniqueSize,
    saleMode,
    currentSize,
    displayLabel: getSizeLabel(currentSize) || currentSize || 'N/A'
  };
};

// Centralized calculation function
const calculateOrderTotals = (
  cartItems: CartItem[],
  value: number,
  calculations: any
) => {
  // Calculate base cart total using consistent pricing
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = getPrice(item);
    const quantity = item.qty || item.cartItemCount || 1;
    const finalPrice = item.discountPrice && item.discountPrice < price ? item.discountPrice : price;
    const itemTotal = finalPrice * quantity * value;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);

  // Calculate item-level discounts
  const discountAmount = cartItems.reduce((sum, item) => {
    if (item.discountPrice && item.discountPrice < getPrice(item)) {
      const quantity = item.qty || item.cartItemCount || 1;
      const discount = (getPrice(item) - item.discountPrice) * quantity * value;
      return sum + discount;
    }
    return sum;
  }, 0);

  // Use calculations from hook for other amounts
  const couponDiscount = calculations.couponDiscount || 0;
  const taxAmount = calculations.taxAmount || 0;
  const collectedTax = calculations.collectedTax || 0;
  const packageCost = calculations.packageCost || 0;
  const deliveryCharges = calculations.deliveryCharges || 0;

  // Calculate final total
  const finalTotal = cartTotal + taxAmount + collectedTax + packageCost + deliveryCharges - couponDiscount;
  
  // Calculate total savings
  const totalSavings = discountAmount + couponDiscount;

  return {
    cartTotal,
    discountAmount,
    couponDiscount,
    taxAmount,
    collectedTax,
    packageCost,
    deliveryCharges,
    totalSavings,
    finalTotal
  };
};

// Location utilities
const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            
            resolve({
              latitude,
              longitude,
              address: data.display_name || `${latitude}, ${longitude}`,
              city: address.city || address.town || address.village || "",
              state: address.state || "",
              country: address.country || "",
              pincode: address.postcode || ""
            });
          } else {
            resolve({
              latitude,
              longitude,
              address: `${latitude}, ${longitude}`,
              city: "",
              state: "",
              country: "",
              pincode: ""
            });
          }
        } catch (error) {
          resolve({
            latitude,
            longitude,
            address: `${latitude}, ${longitude}`,
            city: "",
            state: "",
            country: "",
            pincode: ""
          });
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
};

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
    {mode === 'buyNow' && (
      <div className="alert alert-info">
        <i className="fa fa-info-circle me-2"></i>
        Buy Now Mode - You are purchasing this item directly
      </div>
    )}
  </div>
);

const LocationSection: React.FC<{
  onLocationUpdate: (locationData: LocationData) => void;
  isLoading: boolean;
}> = ({ onLocationUpdate, isLoading }) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const locationData = await getCurrentLocation();
      onLocationUpdate(locationData);
      toast.success("Location detected successfully!");
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error("Failed to get current location. Please enter manually.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="form-group">
      <label className="field-label">Auto-fill Location</label>
      <div>
        <button
          type="button"
          className="btn get-location-button"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation || isLoading}
        >
          {isGettingLocation ? (
            <>
              <i className="fa fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
              Getting Location...
            </>
          ) : (
            <>
              <i className="fa fa-map-marker" style={{ marginRight: '8px' }}></i>
              Get Current Location
            </>
          )}
        </button>
      </div>
      <small className="form-text">
        Click to automatically fill address details using your current location
      </small>
    </div>
  );
};

const CartItemCard: React.FC<{ 
  item: CartItem; 
  symbol: string; 
  value: number;
  onImageClick: (productId: string) => void;
}> = ({ item, symbol, value, onImageClick }) => {
  const price = getPrice(item);
  const quantity = item.qty || item.cartItemCount || 1;
  const finalPrice = item.discountPrice && item.discountPrice < price ? item.discountPrice : price;
  const sizeDisplay = getProductSizeDisplay(item);
  
  const imageSrc = useMemo(() => {
    if (item.img && item.img.length > 0 && item.img[0]) {
      return item.img[0];
    }
    return "/static/images/placeholder.png";
  }, [item.img]);

  return (
    <div className="cart-item-card mb-3 p-3">
      <div className="d-flex">
        <div 
          className="cart-item-image-container me-3" 
          style={{ cursor: 'pointer' }}
          onClick={() => onImageClick(item.productId || item.id)}
        >
          <img
            src={imageSrc}
            alt={item.name}
            className="cart-item-image"
            onError={(e) => { 
              const target = e.target as HTMLImageElement;
              if (target.src !== "/static/images/placeholder.png") {
                target.src = "/static/images/placeholder.png";
              }
            }}
          />
        </div>
        
        <div className="flex-grow-1">
          <div className="item-name fw-bold mb-1">
            {item.name}
          </div>
          
          <div className="item-price-info mb-2">
            <div className="d-flex align-items-center">
              <span className="fw-bold me-2" style={{ color: '#00baf2' }}>
                {symbol}{(finalPrice * value).toFixed(2)}
              </span>
              {item.discountPrice && item.discountPrice < price && (
                <span className="text-muted text-decoration-line-through" style={{ fontSize: '12px' }}>
                  {symbol}{(price * value).toFixed(2)}
                </span>
              )}
            </div>
            <small className="text-muted">Qty: {quantity}</small>
          </div>
          
          {/* Enhanced Size/Variation Display - Same as Cart Page */}
          {(sizeDisplay.uniqueSizes.length > 0 || sizeDisplay.uniqueSize.length > 0) && (
            <div className="variation-display mb-2">
              <label className="form-label mb-1">
                Size/Option:
              </label>
              <div className="selected-variation">
                <span className="badge">
                  {sizeDisplay.displayLabel}
                </span>
              </div>
            </div>
          )}
          
          {item.discountPrice && item.discountPrice < price && (
            <div className="mt-1">
              <small className="badge bg-success">
                Save {symbol}{((price - item.discountPrice) * quantity * value).toFixed(2)}
              </small>
            </div>
          )}
        </div>
        
        <div className="text-end">
          <div className="item-total fw-bold">
            {symbol}{(finalPrice * quantity * value).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

const CouponSection: React.FC<{
  coupons: any[];
  appliedCoupon: any;
  phoneNumber: string;
  couponError: string;
  onSelectCoupon: (coupon: any) => void;
}> = ({ coupons, appliedCoupon, phoneNumber, couponError, onSelectCoupon }) => (
  <div className="form-group mb-3">
    <label className="field-label coupon-label">Available Coupons</label>
    <div className="coupon-container">
      {coupons.length === 0 && (
        <div className="alert alert-info">
          {phoneNumber ? "No coupons available for your account" : "Enter phone number to view available coupons"}
        </div>
      )}
      {coupons.map((coupon) => (
        <div
          key={coupon.couponCode}
          className={`coupon-item p-2 mb-2 border rounded ${appliedCoupon?.couponCode === coupon.couponCode ? 'border-success bg-light' : 'border-secondary'}`}
          onClick={() => onSelectCoupon(coupon)}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">{coupon.couponCode}</div>
              <small className="text-muted">
                {coupon.isCouponPercentage 
                  ? `${coupon.couponAmount}% off` 
                  : `₹${coupon.couponAmount} off`
                }
                {coupon.maxCouponAmount > 0 && ` (Max ₹${coupon.maxCouponAmount})`}
              </small>
              {coupon.minimumCartValue > 0 && (
                <div>
                  <small className="text-info">Min order: ₹{coupon.minimumCartValue}</small>
                </div>
              )}
            </div>
            <div>
              {appliedCoupon?.couponCode === coupon.couponCode && (
                <i className="fa fa-check-circle text-success"></i>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
    {couponError && (
      <div className="alert alert-danger mt-2">
        {couponError}
      </div>
    )}
    {appliedCoupon && (
      <div className="alert alert-success mt-2">
        <strong>{appliedCoupon.couponCode}</strong> applied successfully!
      </div>
    )}
  </div>
);

const OrderTotals: React.FC<{ 
  totals: any; 
  symbol: string; 
}> = ({ totals, symbol }) => {
  return (
    <div className="order-totals">
      <div className="total-row d-flex justify-content-between py-2">
        <span>Cart Total</span>
        <span>{symbol}{totals.cartTotal.toFixed(2)}</span>
      </div>
      {totals.discountAmount > 0 && (
        <div className="total-row d-flex justify-content-between py-2 text-success">
          <span>Item Discount</span>
          <span>-{symbol}{totals.discountAmount.toFixed(2)}</span>
        </div>
      )}
      {totals.couponDiscount > 0 && (
        <div className="total-row d-flex justify-content-between py-2 text-success">
          <span>Coupon Discount</span>
          <span>-{symbol}{totals.couponDiscount.toFixed(2)}</span>
        </div>
      )}
      {totals.collectedTax > 0 && (
        <div className="total-row d-flex justify-content-between py-2">
          <span>Tax (Collected)</span>
          <span>{symbol}{totals.collectedTax.toFixed(2)}</span>
        </div>
      )}
      {totals.taxAmount > 0 && (
        <div className="total-row d-flex justify-content-between py-2">
          <span>Additional Tax</span>
          <span>{symbol}{totals.taxAmount.toFixed(2)}</span>
        </div>
      )}
      {totals.packageCost > 0 && (
        <div className="total-row d-flex justify-content-between py-2">
          <span>Package Cost</span>
          <span>{symbol}{totals.packageCost.toFixed(2)}</span>
        </div>
      )}
      {totals.deliveryCharges > 0 && (
        <div className="total-row d-flex justify-content-between py-2">
          <span>Delivery Charges</span>
          <span>{symbol}{totals.deliveryCharges.toFixed(2)}</span>
        </div>
      )}
      {totals.totalSavings > 0 && (
        <div className="total-row d-flex justify-content-between py-2 text-success fw-bold">
          <span>Total Savings</span>
          <span>{symbol}{totals.totalSavings.toFixed(2)}</span>
        </div>
      )}
      <hr />
      <div className="total-row d-flex justify-content-between py-2 fs-5 fw-bold">
        <span>Final Total</span>
        <span>{symbol}{totals.finalTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Main Component
const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const currencyContext = useContext(CurrencyContext);
  const cartContext = useContext(CartContext);
  const authContext = useContext(AuthContext);

  // State
  const [gstNumber, setGstNumber] = useState<string>("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Use the optimized hook
  const {
    checkoutMode,
    cartItems,
    availableCoupons,
    appliedCoupon,
    couponError,
    selectedPaymentMode,
    isProcessing,
    storeDetails,
    calculations,
    setSelectedPaymentMode,
    setIsProcessing,
    fetchCoupons,
    handleSelectCoupon,
    paymentModes,
    countries,
    apiConfig
  } = usePlaceOrder(cartContext?.cartItems || [], authContext?.user);

  // Form
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormType>();
  const phoneNumber = watch("phone") || "";

  // Memoized values
  const symbol = currencyContext?.selectedCurr?.symbol || "$";
  const value = currencyContext?.selectedCurr?.value || 1;
  const emptyCart = cartContext?.emptyCart || (() => {});
  const appName = appConfig?.appName || "MyApp";
  const defaultStoreId = appConfig?.defaultStoreId || "default";

  // Centralized order totals calculation
  const orderTotals = useMemo(() => {
    return calculateOrderTotals(cartItems, value, calculations);
  }, [cartItems, value, calculations]);

  // Handle product image click
  const handleImageClick = useCallback((productId: string) => {
    if (productId) {
      router.push(`/product/${productId}`);
    }
  }, [router]);

  // Handle location update
  const handleLocationUpdate = useCallback((newLocationData: LocationData) => {
    setLocationData(newLocationData);
    
    if (newLocationData.address && !watch("address")) setValue("address", newLocationData.address);
    if (newLocationData.city && !watch("city")) setValue("city", newLocationData.city);
    if (newLocationData.state && !watch("state")) setValue("state", newLocationData.state);
    if (newLocationData.country && !watch("country")) setValue("country", newLocationData.country);
    if (newLocationData.pincode && !watch("pincode")) setValue("pincode", newLocationData.pincode);
    
    setValue("latitude", newLocationData.latitude);
    setValue("longitude", newLocationData.longitude);
  }, [setValue, watch]);

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

  // Fetch coupons when phone number changes
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

  // Order success handler
  const handleOrderSuccess = useCallback(async (orderModel: any, formData: FormType) => {
    toast.success("Order placed successfully!");
    
    if (typeof window !== "undefined") {
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
    
    if (checkoutMode === 'cart') {
      emptyCart();
    }
    
    setTimeout(() => router.push("/pages/order-success"), 1500);
  }, [router, emptyCart, checkoutMode, locationData]);

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
          orderTotals, // Use centralized totals
          selectedPaymentMode,
          { id: defaultStoreId, name: appName },
          gstNumber
        );
        
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
  }, [cartItems, orderTotals, selectedPaymentMode, defaultStoreId, appName, gstNumber, emptyCart, router, checkoutMode, locationData]);

  // Enhanced order payload creation with consistent pricing
  const prepareOrderData = useCallback((formData: FormType) => {
    try {
      const enhancedFormData = {
        ...formData,
        latitude: formData.latitude || locationData?.latitude || 0,
        longitude: formData.longitude || locationData?.longitude || 0
      };

      const orderConfig = {
        formData: enhancedFormData,
        cartItems,
        selectedPaymentMode,
        cartCalculations: orderTotals, // Use centralized totals
        storeDetails: { id: defaultStoreId, name: appName, active: true },
        gstNumber,
        appName,
        defaultStoreId
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);

      if (orderModel.deliveryAddress) {
        orderModel.deliveryAddress.lat = enhancedFormData.latitude;
        orderModel.deliveryAddress.lng = enhancedFormData.longitude;
      }

      // Update order items with correct pricing
      if (orderModel.orderItems) {
        orderModel.orderItems = orderModel.orderItems.map((orderItem: any) => {
          const cartItem = cartItems.find(item => (item.productId || item.id) === orderItem.productId);
          if (cartItem) {
            const correctPrice = getPrice(cartItem);
            const finalPrice = cartItem.discountPrice && cartItem.discountPrice < correctPrice ? cartItem.discountPrice : correctPrice;
            const quantity = cartItem.qty || cartItem.cartItemCount || 1;
            return {
              ...orderItem,
              price: finalPrice,
              totalPrice: finalPrice * quantity,
              unitPrice: finalPrice
            };
          }
          return orderItem;
        });
      }

      // Set consistent totals in order model
      orderModel.cartAmount = orderTotals.cartTotal;
      orderModel.finalTotal = orderTotals.finalTotal;
      orderModel.totalAmount = orderTotals.finalTotal;
      orderModel.taxAmount = orderTotals.taxAmount + orderTotals.collectedTax;
      orderModel.deliveryCharges = orderTotals.deliveryCharges;
      orderModel.packageCost = orderTotals.packageCost;
      orderModel.couponDiscount = orderTotals.couponDiscount;
     
      const orderData = {
        orderId: orderModel.id,
        amount: orderTotals.finalTotal, // Use consistent final total
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
        },
        orderModel: orderModel
      };

      return { orderData, orderModel };
    } catch (error) {
      console.error("Error preparing order data:", error);
      toast.error("Failed to prepare order data");
      return null;
    }
  }, [cartItems, selectedPaymentMode, orderTotals, gstNumber, appName, defaultStoreId, locationData]);

  // Form submission with enhanced pricing
  const onSubmit = useCallback(async (formData: FormType) => {
    setIsProcessing(true);
    setShowValidationErrors(true);

    if (!selectedPaymentMode || cartItems.length === 0) {
      toast.error(!selectedPaymentMode ? "Please select a payment method" : "Your cart is empty");
      setIsProcessing(false);
      return;
    }

    try {
      const enhancedFormData = {
        ...formData,
        latitude: formData.latitude || locationData?.latitude || 0,
        longitude: formData.longitude || locationData?.longitude || 0
      };

      const orderConfig = {
        formData: enhancedFormData,
        cartItems,
        selectedPaymentMode,
        cartCalculations: orderTotals, // Use centralized totals
        storeDetails: { id: defaultStoreId, name: appName, active: true },
        gstNumber,
        appName,
        defaultStoreId
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);

      if (orderModel.deliveryAddress) {
        orderModel.deliveryAddress.lat = enhancedFormData.latitude;
        orderModel.deliveryAddress.lng = enhancedFormData.longitude;
      }

      // Update order items with correct pricing from cart logic
      if (orderModel.orderItems) {
        orderModel.orderItems = orderModel.orderItems.map((orderItem: any) => {
          const cartItem = cartItems.find(item => (item.productId || item.id) === orderItem.productId);
          if (cartItem) {
            const correctPrice = getPrice(cartItem);
            const finalPrice = cartItem.discountPrice && cartItem.discountPrice < correctPrice ? cartItem.discountPrice : correctPrice;
            const quantity = cartItem.qty || cartItem.cartItemCount || 1;
            return {
              ...orderItem,
              price: finalPrice,
              totalPrice: finalPrice * quantity,
              unitPrice: finalPrice
            };
          }
          return orderItem;
        });
      }

      // Update total amounts in order model with centralized calculations
      orderModel.cartAmount = orderTotals.cartTotal;
      orderModel.finalTotal = orderTotals.finalTotal;
      orderModel.totalAmount = orderTotals.finalTotal;
      orderModel.taxAmount = orderTotals.taxAmount + orderTotals.collectedTax;
      orderModel.deliveryCharges = orderTotals.deliveryCharges;
      orderModel.packageCost = orderTotals.packageCost;
      orderModel.couponDiscount = orderTotals.couponDiscount;
      
      if (API && API.saveOrder) {
        await API.saveOrder(orderModel);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (selectedPaymentMode) {
        case "COD":
        case "PICK_AT_STORE":
          await handleOrderSuccess(orderModel, enhancedFormData);
          break;
          
        case "RAZORPAY":
          // Store order data for Razorpay success callback
          if (typeof window !== "undefined") {
            sessionStorage.setItem("order-success-data", JSON.stringify({
              orderModel,
              billingDetails: enhancedFormData
            }));
          }
          toast.success("Order created successfully! Please complete the payment.");
          setIsProcessing(false);
          return;
          
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
  }, [selectedPaymentMode, cartItems, orderTotals, gstNumber, appName, defaultStoreId, handleOrderSuccess, checkoutMode, locationData, setIsProcessing]);

  // Payment button
  const getPaymentButton = useCallback(() => {
    const buttonText = isProcessing ? "Processing..." : PAYMENT_TEXT_MAP[selectedPaymentMode as keyof typeof PAYMENT_TEXT_MAP] || "Place Order";

    if (selectedPaymentMode === "RAZORPAY") {
      return (
        <RazorpayButton
          formData={watch()}
          prepareOrderData={prepareOrderData}
          finalTotal={orderTotals.finalTotal} // Use centralized final total
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
  }, [selectedPaymentMode, watch, prepareOrderData, orderTotals.finalTotal, handleRazorpaySuccess, isProcessing]);

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
                </div>
              </Col>

              <Col lg="5">
                <div className="checkout-right-sidebar">
                  <div className="checkout-sidebar">
                    <div className="checkout-card">
                      <h4 className="checkout-subtitle">Order Summary</h4>
                      
                      {/* Cart Items with Fixed Height and Scroll */}
                      <div className="cart-items-section">
                        {cartItems.map((item: CartItem, index: number) => (
                          <CartItemCard
                            key={item.id || index}
                            item={item}
                            symbol={symbol}
                            value={value}
                            onImageClick={handleImageClick}
                          />
                        ))}
                      </div>

                      {/* Coupon Section */}
                      <CouponSection
                        coupons={availableCoupons}
                        appliedCoupon={appliedCoupon}
                        phoneNumber={phoneNumber}
                        couponError={couponError}
                        onSelectCoupon={handleSelectCoupon}
                      />

                      {/* Payment Methods */}
                      <div className="form-group">
                        <label className="field-label payment-label">Payment Method *</label>
                        <div className="payment-methods">
                          {paymentModes.map((mode) => (
                            <div key={mode.value} className="form-check payment-option">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="paymentMode"
                                id={`payment-${mode.value}`}
                                value={mode.value}
                                checked={selectedPaymentMode === mode.value}
                                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                              />
                              <label className="form-check-label" htmlFor={`payment-${mode.value}`}>
                                {mode.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        {!selectedPaymentMode && showValidationErrors && (
                          <span className="error-message">Please select a payment method</span>
                        )}
                      </div>

                      {/* Order Totals with Centralized Calculations */}
                      <OrderTotals 
                        totals={orderTotals} 
                        symbol={symbol} 
                      />

                      {/* Validation Errors */}
                      {validationErrors.length > 0 && (
                        <div className="alert alert-danger">
                          {validationErrors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}

                      {/* Payment Button */}
                      <div className="checkout-btn-section">
                        {getPaymentButton()}
                      </div>
                    </div>
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