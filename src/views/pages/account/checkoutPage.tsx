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

interface AuthContextType {
  user: { phone: string } | null;
}

interface KitRaw {
  id: string;
  [key: string]: any;
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

// Product lookup function
const getProductById = (productId: string): any => {
  if (!productId) return null;

  try {
    // First try objCache
    const cachedProduct = objCache?.getProductById(productId);
    if (cachedProduct) return cachedProduct;

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
    // Error handled silently
  }

  return null;
};

// Get product variations (matching cart page implementation)
const getProductVariations = (item: CartItem): { sizes: string[], sizePrices: number[] } => {
  try {
    const product = getProductById(item.productId || item.id);
    
    if (product) {
      const uniqueSize = product?.sellingDisplayOptions || [];
      const sizePrices = product?.sellingPrices || [];
      
      return {
        sizes: Array.isArray(uniqueSize) ? uniqueSize : [],
        sizePrices: Array.isArray(sizePrices) ? sizePrices : []
      };
    }
    
    // Fallback to item's own variation data
    return {
      sizes: item?.sellingDisplayOptions || [],
      sizePrices: item?.sellingPrices || []
    };
  } catch (error) {
    return { sizes: [], sizePrices: [] };
  }
};

// Enhanced price calculation (matching cart page implementation)
const getPrice = (item: CartItem): number => {
  if (!item) return 0;

  try {
    const product = getProductById(item.productId || item.id);
    const { sizes, sizePrices } = getProductVariations(item);
    
    // If item has selected size and variations exist, calculate price based on variation
    if (item.selectedSize && sizes.length && sizePrices.length) {
      const sizeIndex = sizes.indexOf(item.selectedSize);
      if (sizeIndex >= 0 && sizeIndex < sizePrices.length) {
        const basePrice = product?.price || item.price || 0;
        return getProductFinalPrice({
          price: basePrice,
          discount: product?.discount || item.discount,
          sellingPrices: sizePrices,
          activeIndex: sizeIndex,
        });
      }
    }
    
    if (product) {
      if (product instanceof Kit && typeof product.getPrice === "function") {
        try {
          const price = product.getPrice({ cartQuantity: item.cartItemCount });
          if (typeof price === 'number' && !isNaN(price) && price > 0) {
            return price;
          }
        } catch (methodError) {
          // Method error handled silently
        }
      }
      
      if (product?.getPrice && typeof product.getPrice === "function") {
        try {
          const price = product.getPrice({
            cartQuantity: item.cartItemCount,
            purchaseOptionStr: item.cartPurchaseOptionStr || "",
          });
          if (typeof price === 'number' && !isNaN(price) && price > 0) {
            return price;
          }
        } catch (methodError) {
          // Method error handled silently
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

const transformToCartItem = (item: any, index: number, isBuyNow = false): CartItem => ({
  id: item.id || `${isBuyNow ? 'buyNow' : 'cart'}-item-${index}`,
  productId: item.productId || item.id,
  name: item.name || "Unknown Product",
  img: Array.isArray(item.img) ? item.img : [item.img || ""],
  cartItemCount: item.qty || item.cartItemCount || 1,
  cartPurchaseOptionStr: item.purchaseOptionStr || "default",
  price: getItemPrice(item),
  discountPrice: getItemDiscountPrice(item),
  taxType: item.taxType || "EXCLUSIVE",
  taxAmount: parseFloat(item.taxAmount) || 0,
  active: true,
  isReturnable: item.isReturnable || false,
  categoryName: item.categoryName || "General",
  categoryID: item.categoryID || "default",
  selectedSize: item.selectedSize,
  sellingDisplayOptions: item.sellingDisplayOptions,
  sellingPrices: item.sellingPrices,
  discount: item.discount,
  qty: item.qty || item.cartItemCount || 1,
  type: item.type
});

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
          // Using a more reliable reverse geocoding service
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
            // Fallback with coordinates only
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
          // Fallback with coordinates only
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
        maximumAge: 300000 // 5 minutes
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
    {/* Optional: Add mode indicator UI if needed */}
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
          className="btn btn-outline-primary btn-sm"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation || isLoading}
        >
          {isGettingLocation ? (
            <>
              <i className="fa fa-spinner fa-spin me-2"></i>
              Getting Location...
            </>
          ) : (
            <>
              <i className="fa fa-map-marker me-2"></i>
              Get Current Location
            </>
          )}
        </button>
      </div>
      <small className="form-text text-muted">
        Click to automatically fill address details using your current location
      </small>
    </div>
  );
};

const CartItemCard: React.FC<{ 
  item: CartItem; 
  symbol: string; 
  onVariationChange: (item: CartItem, newSize: string) => void;
  onImageClick: (productId: string) => void;
}> = ({ item, symbol, onVariationChange, onImageClick }) => {
  const { sizes, sizePrices } = getProductVariations(item);
  const price = getPrice(item);
  const finalPrice = item.discountPrice && item.discountPrice < price ? item.discountPrice : price;
  
  // Memoize image src to prevent multiple calls
  const imageSrc = useMemo(() => {
    if (item.img && item.img.length > 0 && item.img[0]) {
      return item.img[0];
    }
    return "/static/images/placeholder.png";
  }, [item.img]);

  return (
    <div className="cart-item-card mb-3 p-3" style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <div className="d-flex">
        {/* Product Image - Clickable with cached src */}
        <div 
          className="cart-item-image-container me-3" 
          style={{ cursor: 'pointer' }}
          onClick={() => onImageClick(item.productId || item.id)}
        >
          <img
            src={imageSrc}
            alt={item.name}
            className="cart-item-image"
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}
            onError={(e) => { 
              const target = e.target as HTMLImageElement;
              if (target.src !== "/static/images/placeholder.png") {
                target.src = "/static/images/placeholder.png";
              }
            }}
          />
        </div>
        
        {/* Item Details */}
        <div className="flex-grow-1">
          <div className="item-name fw-bold mb-1" style={{ fontSize: '14px' }}>
            {item.name}
          </div>
          
          {/* Price Information */}
          <div className="item-price-info mb-2">
            <div className="d-flex align-items-center">
              <span className="fw-bold me-2" style={{ color: '#28a745' }}>
                {symbol}{finalPrice.toFixed(2)}
              </span>
              {item.discountPrice && item.discountPrice < price && (
                <span className="text-muted text-decoration-line-through" style={{ fontSize: '12px' }}>
                  {symbol}{price.toFixed(2)}
                </span>
              )}
            </div>
            <small className="text-muted">Qty: {item.cartItemCount}</small>
          </div>
          
          {/* Size/Variation Selector - Improved UI */}
          {sizes.length > 0 && (
            <div className="variation-selector mb-2">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: '600' }}>
                Size/Option:
              </label>
              <div className="d-flex flex-wrap gap-1">
                {sizes.map((size, i) => {
                  const sizePrice = sizePrices[i];
                  const isSelected = item.selectedSize === size || (!item.selectedSize && i === 0);
                  
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => onVariationChange(item, size)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        minWidth: 'auto',
                        borderRadius: '4px'
                      }}
                    >
                      {getSizeLabel(size)}
                      {sizePrice ? ` (+${symbol}${sizePrice})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Discount Badge */}
          {item.discountPrice && item.discountPrice < price && (
            <div className="mt-1">
              <small className="badge bg-success">
                Save {symbol}{((price - item.discountPrice) * item.cartItemCount).toFixed(2)}
              </small>
            </div>
          )}
        </div>
        
        {/* Item Total */}
        <div className="text-end">
          <div className="item-total fw-bold" style={{ fontSize: '16px' }}>
            {symbol}{(finalPrice * item.cartItemCount).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

const CouponSection: React.FC<{
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  phoneNumber: string;
  couponError: string;
  onSelectCoupon: (coupon: Coupon) => void;
}> = ({ coupons, appliedCoupon, phoneNumber, couponError, onSelectCoupon }) => (
  <div className="form-group mb-3">
    <label className="field-label coupon-label">Available Coupons</label>
    <div className="coupon-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {coupons.length === 0 && (
        <div className="alert alert-info" style={{ fontSize: '12px' }}>
          {phoneNumber ? "No coupons available for your account" : "Enter phone number to view available coupons"}
        </div>
      )}
      {coupons.map((coupon) => (
        <div
          key={coupon.couponCode}
          className={`coupon-item p-2 mb-2 border rounded ${appliedCoupon?.couponCode === coupon.couponCode ? 'border-success bg-light' : 'border-secondary'}`}
          style={{ cursor: 'pointer' }}
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
      <div className="alert alert-danger mt-2" style={{ fontSize: '12px' }}>
        {couponError}
      </div>
    )}
    {appliedCoupon && (
      <div className="alert alert-success mt-2" style={{ fontSize: '12px' }}>
        <strong>{appliedCoupon.couponCode}</strong> applied successfully!
      </div>
    )}
  </div>
);

const OrderTotals: React.FC<{ calculations: OrderCalculations; symbol: string }> = ({ calculations, symbol }) => (
  <div className="order-totals">
    <div className="total-row d-flex justify-content-between py-2">
      <span>Cart Total</span>
      <span>{symbol}{calculations.cartAmount.toFixed(2)}</span>
    </div>
    {calculations.discountAmount > 0 && (
      <div className="total-row d-flex justify-content-between py-2 text-success">
        <span>Item Discount</span>
        <span>-{symbol}{calculations.discountAmount.toFixed(2)}</span>
      </div>
    )}
    {calculations.couponDiscount > 0 && (
      <div className="total-row d-flex justify-content-between py-2 text-success">
        <span>Coupon Discount</span>
        <span>-{symbol}{calculations.couponDiscount.toFixed(2)}</span>
      </div>
    )}
    {calculations.taxAmount > 0 && (
      <div className="total-row d-flex justify-content-between py-2">
        <span>Tax</span>
        <span>{symbol}{calculations.taxAmount.toFixed(2)}</span>
      </div>
    )}
    {calculations.packageCost > 0 && (
      <div className="total-row d-flex justify-content-between py-2">
        <span>Package Cost</span>
        <span>{symbol}{calculations.packageCost.toFixed(2)}</span>
      </div>
    )}
    {calculations.deliveryCharges > 0 && (
      <div className="total-row d-flex justify-content-between py-2">
        <span>Delivery Charges</span>
        <span>{symbol}{calculations.deliveryCharges.toFixed(2)}</span>
      </div>
    )}
    {calculations.totalSavings > 0 && (
      <div className="total-row d-flex justify-content-between py-2 text-success fw-bold">
        <span>Total Savings</span>
        <span>{symbol}{calculations.totalSavings.toFixed(2)}</span>
      </div>
    )}
    <hr />
    <div className="total-row d-flex justify-content-between py-2 fs-5 fw-bold">
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
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Custom hooks
  const { checkoutMode, buyNowProduct } = useCheckoutMode();
  
  // Form
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormType>();
  const phoneNumber = watch("phone") || "";

  // Memoized values
  const symbol = currencyContext?.selectedCurr?.symbol || "$";
  const contextCartItems = cartContext?.cartItems || [];
  const updateCartItemVariation = cartContext?.updateCartItemVariation;
  const emptyCart = cartContext?.emptyCart || (() => {});
  const appName = appConfig?.appName || "MyApp";
  const defaultStoreId = appConfig?.defaultStoreId || "default";
  const paymentModes = useMemo(() => OrderPayloadService.getPaymentModes(), []);
  const countries = useMemo(() => OrderPayloadService.getCountries(), []);

  const apiConfig = {
    tenantId: appConfig.tenantId,
    storeId: appConfig.defaultStoreId,
  };

  // Handle product image click - navigate to product details
  const handleImageClick = useCallback((productId: string) => {
    if (productId) {
      router.push(`/product/${productId}`);
    }
  }, [router]);

  // Handle variation change (matching cart page implementation)
  const handleVariationChange = useCallback((item: CartItem, newSize: string) => {
    if (!newSize) return;
    
    try {
      const { sizes, sizePrices } = getProductVariations(item);
      const sizeIndex = sizes.indexOf(newSize);
      
      if (sizeIndex >= 0) {
        const product = getProductById(item.productId || item.id);
        const basePrice = product?.price || item.price || 0;
        
        const newPrice = getProductFinalPrice({
          price: basePrice,
          discount: product?.discount || item.discount,
          sellingPrices: sizePrices,
          activeIndex: sizeIndex,
        });

        // Update cart item with new variation
        const updatedItem = {
          ...item,
          selectedSize: newSize,
          price: newPrice
        };

        // Update in local state
        setCartItems(prevItems => 
          prevItems.map(cartItem => 
            cartItem.id === item.id ? updatedItem : cartItem
          )
        );

        // Update in cart context if available
        if (updateCartItemVariation && typeof updateCartItemVariation === 'function') {
          updateCartItemVariation(item, updatedItem);
        }
      }
    } catch (error) {
      console.error('Error updating variation:', error);
    }
  }, [updateCartItemVariation]);

  // Handle location update with proper lat/long handling
  const handleLocationUpdate = useCallback((newLocationData: LocationData) => {
    setLocationData(newLocationData);
    
    // Auto-fill form fields if they're empty
    if (newLocationData.address && !watch("address")) setValue("address", newLocationData.address);
    if (newLocationData.city && !watch("city")) setValue("city", newLocationData.city);
    if (newLocationData.state && !watch("state")) setValue("state", newLocationData.state);
    if (newLocationData.country && !watch("country")) setValue("country", newLocationData.country);
    if (newLocationData.pincode && !watch("pincode")) setValue("pincode", newLocationData.pincode);
    
    // Store coordinates for order payload
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
    
    const cartTotal = cartItems.reduce((sum, item) => {
      const price = getPrice(item);
      return sum + ((item.discountPrice || price) * item.cartItemCount);
    }, 0);
    
    if (cartTotal < coupon.minimumCartValue) {
      setCouponError(`Minimum cart value for this coupon is ₹${coupon.minimumCartValue}`);
      setAppliedCoupon(null);
      return;
    }
    
    setAppliedCoupon(coupon);
  }, [cartItems]);

  // Order calculations with proper price calculation (matching cart page)
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
      
      if (itemDiscountPrice && itemDiscountPrice < itemPrice) {
        discountAmount += (itemPrice - itemDiscountPrice) * item.cartItemCount;
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
    
    if (checkoutMode === 'cart') {
      emptyCart();
    }
    
    setTimeout(() => router.push("/pages/order-success"), 1500);
  }, [router, emptyCart, checkoutMode, locationData]);

  // Enhanced order payload creation with proper lat/long handling
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

      // Ensure lat/lng are properly set in the order model
      if (orderModel.deliveryAddress) {
        orderModel.deliveryAddress.lat = enhancedFormData.latitude;
        orderModel.deliveryAddress.lng = enhancedFormData.longitude;
      }
     
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
  }, [cartItems, calculations, selectedPaymentMode, defaultStoreId, appName, gstNumber, emptyCart, router, checkoutMode, locationData]);

  // Form submission with enhanced location handling
  const onSubmit = useCallback(async (formData: FormType) => {
    console.log("Form submitted with data:", formData);
    console.log("Current checkout mode:", checkoutMode);
    console.log("Current cart items:", cartItems);
    console.log("Location data:", locationData);
    
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

      // Double-check that coordinates are properly set
      if (orderModel.deliveryAddress) {
        orderModel.deliveryAddress.lat = enhancedFormData.latitude;
        orderModel.deliveryAddress.lng = enhancedFormData.longitude;
      }
      
      // Log the final order payload to verify lat/long inclusion
      console.log("Final order payload with coordinates:", {
        deliveryAddress: orderModel.deliveryAddress,
        coordinates: {
          lat: enhancedFormData.latitude,
          lng: enhancedFormData.longitude
        }
      });
      
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
      if (selectedPaymentMode !== "RAZORPAY") {
        setIsProcessing(false);
      }
    }
  }, [selectedPaymentMode, cartItems, calculations, gstNumber, appName, defaultStoreId, handleOrderSuccess, checkoutMode, locationData]);

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
                  
                  <h3 className="checkout-title mt-4">Payment Method</h3>
                  <div className="payment-methods">
                    {paymentModes.map((mode) => (
                      <div
                        key={mode.value}
                        className={`payment-option p-3 mb-2 border rounded ${selectedPaymentMode === mode.value ? "border-primary bg-light" : "border-secondary"}`}
                        onClick={() => setSelectedPaymentMode(mode.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={mode.value}
                          checked={selectedPaymentMode === mode.value}
                          onChange={(e) => setSelectedPaymentMode(e.target.value)}
                          className="payment-mode-radio me-2"
                        />
                        <label className="payment-mode-label mb-0" style={{ cursor: 'pointer' }}>
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
                  
                  <div className="cart-items-container mb-3">
                    {cartItems.map((item, index) => (
                      <CartItemCard
                        key={`${item.id}_${index}`}
                        item={item}
                        symbol={symbol}
                        onVariationChange={handleVariationChange}
                        onImageClick={handleImageClick}
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
                    <div className="alert alert-danger mt-3">
                      <h6>Please fix the following errors:</h6>
                      <ul className="mb-0">
                        {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                      </ul>
                    </div>
                  )}
                 
                  <div className="mt-3">
                    {getPaymentButton()}
                  </div>
                 
                  <div className="mt-3">
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