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
import { API, searchController, Kit, DeliveryAddressModel } from "@/app/globalProvider";
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
  sellingDisplayOption?: string[];
  sellingPrices?: number[];
  [key: string]: any;
}

// Mock contexts
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Constants - Updated phone validation
const VALIDATION_RULES = {
  firstName: { required: "First name is required" },
  lastName: { required: "Last name is required" },
  phone: {
    required: "Phone number is required",
    pattern: { 
      value: /^[0-9]{10}$/, 
      message: "Phone number must be exactly 10 digits" 
    },
    minLength: {
      value: 10,
      message: "Phone number must be exactly 10 digits"
    },
    maxLength: {
      value: 10,
      message: "Phone number must be exactly 10 digits"
    },
    validate: (value: string) => {
      if (!value) return "Phone number is required";
      if (value.length !== 10) return "Phone number must be exactly 10 digits";
      if (!/^[0-9]+$/.test(value)) return "Phone number must contain only digits";
      return true;
    }
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
  const currentSize = item.selectedSize || item.cartPurchaseOptionStr || sizes[0] || uniqueSize || '';
  return {
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

// Coupon management utilities
const getUsedCoupons = (phoneNumber: string): string[] => {
  if (!phoneNumber || typeof window === "undefined") return [];
  
  try {
    const storedUsedCoupons = localStorage.getItem(`usedCoupons_${phoneNumber}`);
    return storedUsedCoupons ? JSON.parse(storedUsedCoupons) : [];
  } catch (error) {
    console.error("Error getting used coupons:", error);
    return [];
  }
};

const markCouponAsUsed = async (phoneNumber: string, couponCode: string): Promise<void> => {
  if (!phoneNumber || !couponCode) return;

  try {
    // Option 1: Try API call first if available
    if (API && API.markCouponAsUsed && typeof API.markCouponAsUsed === 'function') {
      await API.markCouponAsUsed(phoneNumber, couponCode);
    }
    
    // Option 2: Always update localStorage as backup
    if (typeof window !== "undefined") {
      const existingUsedCoupons = getUsedCoupons(phoneNumber);
      if (!existingUsedCoupons.includes(couponCode)) {
        existingUsedCoupons.push(couponCode);
        localStorage.setItem(`usedCoupons_${phoneNumber}`, JSON.stringify(existingUsedCoupons));
      }
    }
  } catch (error) {
    console.error("Error marking coupon as used:", error);
    // Still update localStorage even if API fails
    if (typeof window !== "undefined") {
      const existingUsedCoupons = getUsedCoupons(phoneNumber);
      if (!existingUsedCoupons.includes(couponCode)) {
        existingUsedCoupons.push(couponCode);
        localStorage.setItem(`usedCoupons_${phoneNumber}`, JSON.stringify(existingUsedCoupons));
      }
    }
  }
};

// Phone input handler to restrict to 10 digits only
const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
  if (value.length <= 10) {
    e.target.value = value;
  } else {
    e.target.value = value.slice(0, 10); // Keep only first 10 digits
  }
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
    // return "/static/images/placeholder.png";
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
          {(sizeDisplay.currentSize.length > 0 || sizeDisplay.displayLabel.length > 0) && (
            <div className="variation-display mb-2">
              <span className="form-label mb-1">
                Size/Option:
              </span>
                <span className="theme-color">
                  {sizeDisplay.displayLabel}
                </span>
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

// FIXED: Updated CouponSection with proper onClick handlers
const CouponSection: React.FC<{
  coupons: any[];
  appliedCoupon: any;
  phoneNumber: string;
  couponError: string;
  usedCoupons: string[];
  onSelectCoupon: (coupon: any) => void;
}> = ({ coupons, appliedCoupon, phoneNumber, couponError, usedCoupons, onSelectCoupon }) => {
  // Filter out already applied and used coupons from available coupons list
  const availableCoupons = useMemo(() => {
    let filtered = coupons;
    
    // Remove applied coupon
    if (appliedCoupon) {
      filtered = filtered.filter(coupon => coupon.couponCode !== appliedCoupon.couponCode);
    }
    
    // Remove used coupons
    filtered = filtered.filter(coupon => !usedCoupons.includes(coupon.couponCode));
    
    return filtered;
  }, [coupons, appliedCoupon, usedCoupons]);

  // FIXED: Proper remove coupon handler
  const handleRemoveCoupon = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectCoupon(null);
    toast.info("Coupon removed successfully");
  }, [onSelectCoupon]);

  // FIXED: Proper apply coupon handler
  const handleApplyCoupon = useCallback((coupon: any) => {
    onSelectCoupon(coupon);
    toast.success(`Coupon ${coupon.couponCode} applied successfully!`);
  }, [onSelectCoupon]);

  return (
    <div className="form-group mb-3">
      <label className="field-label coupon-label">
        {appliedCoupon ? "Applied Coupon" : "Available Coupons"}
      </label>
      <div className="coupon-container">
        {/* Show applied coupon first if exists */}
        {appliedCoupon && (
          <div className="applied-coupon-section mb-3">
            <div className="coupon-item p-2 mb-2 border rounded border-success bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold text-success">
                    <i className="fa fa-check-circle me-2"></i>
                    {appliedCoupon.couponCode}
                  </div>
                  <small className="text-muted">
                    {appliedCoupon.isCouponPercentage 
                      ? `${appliedCoupon.couponAmount}% off` 
                      : `₹${appliedCoupon.couponAmount} off`
                    }
                    {appliedCoupon.maxCouponAmount > 0 && ` (Max ₹${appliedCoupon.maxCouponAmount})`}
                  </small>
                  <div>
                    <small className="badge bg-success">Applied Successfully!</small>
                  </div>
                </div>
                {/* FIXED: Proper remove button with explicit handlers */}
                <button 
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleRemoveCoupon}
                  onMouseDown={(e) => e.preventDefault()} // Prevent form submission
                  title="Remove Coupon"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show available coupons only if no coupon is applied */}
        {!appliedCoupon && (
          <>
            {availableCoupons.length === 0 && (
              <div className="alert alert-info">
                {!phoneNumber 
                  ? "Enter phone number to view available coupons"
                  : usedCoupons.length > 0 
                    ? "All available coupons have been used" 
                    : "No coupons available for your account"
                }
              </div>
            )}
            {availableCoupons.map((coupon) => (
              <div
                key={coupon.couponCode}
                className="coupon-item p-2 mb-2 border rounded border-secondary"
                style={{ cursor: 'pointer' }}
                onClick={() => handleApplyCoupon(coupon)} // FIXED: Use proper handler
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
                    <i className="fa fa-plus-circle text-primary"></i>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        
        {/* Show used coupons section for reference */}
        {usedCoupons.length > 0 && !appliedCoupon && phoneNumber && (
          <div className="used-coupons-section mt-3">
            <small className="text-muted mb-2 d-block">Previously Used Coupons:</small>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {usedCoupons.map((couponCode) => (
                <div key={couponCode} className="used-coupon-item p-2 mb-1 border rounded bg-light">
                  <small className="text-muted d-flex align-items-center">
                    <i className="fa fa-check text-success me-2"></i>
                    {couponCode} - Already Used
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {couponError && (
        <div className="alert alert-danger mt-2">
          {couponError}
        </div>
      )}
    </div>
  );
};

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
  const [addresses, setAddresses] = useState<DeliveryAddressModel[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddressModel | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const handleSelectAddress = (addr: DeliveryAddressModel) => {
    setSelectedAddress(addr);
    setSelectedAddressId(addr.id || null);

    setValue("firstName", addr.firstName || "");
    setValue("lastName", addr.lastName || "");
    setValue("phone", addr.phoneNumber || "");
    // setValue("country", addr.country || "");
    // setValue("state", addr.state || "");
    setValue("city", addr.city || "");
    setValue("address", addr.address || "");
    setValue("pincode", addr.pinCode || "");
  };
  // State
  const [gstNumber, setGstNumber] = useState<string>("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [usedCoupons, setUsedCoupons] = useState<string[]>([]);

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

  // Form with real-time validation enabled
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormType>({
    mode: "onChange", // Enable real-time validation
    reValidateMode: "onChange" // Re-validate on every change
  });
  useEffect(() => {
  const fetchAddresses = async () => {
    try {
      // Adjust this based on your actual cartContext structure
      const userPhone = "7093119692";
      const resp = await API.getAddresses(userPhone);
      if (resp) setAddresses(resp);
    } catch (err) {
      console.error("Error loading addresses:", err);
    }
  };
  fetchAddresses();
}, []);
  const phoneNumber = watch("phone") || "";

  // Memoized values
  const symbol = currencyContext?.selectedCurr?.symbol || "$";
  const value = currencyContext?.selectedCurr?.value || 1;
  const emptyCart = cartContext?.emptyCart || (() => {});
  const appName = appConfig?.appName || "MyApp";
  const defaultStoreId = appConfig?.defaultStoreId || "default";

  // Filter available coupons to exclude used ones
  const availableCouponsFiltered = useMemo(() => {
    return availableCoupons.filter(coupon => !usedCoupons.includes(coupon.couponCode));
  }, [availableCoupons, usedCoupons]);

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

  // Fetch coupons and used coupons when phone number changes
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
    
    // Fetch available coupons
    fetchCoupons(userPhone);
    
    // Fetch used coupons from localStorage
    if (userPhone) {
      const userUsedCoupons = getUsedCoupons(userPhone);
      setUsedCoupons(userUsedCoupons);
    } else {
      setUsedCoupons([]);
    }
  }, [phoneNumber, cartItems, fetchCoupons]);

  // Order success handler with coupon tracking
  const handleOrderSuccess = useCallback(async (orderModel: any, formData: FormType) => {
    toast.success("Order placed successfully!");
    
    // Mark applied coupon as used if exists
    if (appliedCoupon && (formData.phone || phoneNumber)) {
      const phone = formData.phone || phoneNumber;
      await markCouponAsUsed(phone, appliedCoupon.couponCode);
      // Update local state immediately
      setUsedCoupons(prev => [...new Set([...prev, appliedCoupon.couponCode])]);
    }
    
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
  }, [router, emptyCart, checkoutMode, locationData, appliedCoupon, phoneNumber]);

  // Razorpay success handler with coupon tracking
    // In CheckoutPage component
const handleRazorpaySuccess = useCallback(async (successData?: any) => {
  try {
    let orderData = successData;
    
    if (!orderData) {
      const storedData = sessionStorage.getItem("razorpay-success-data") || 
                        sessionStorage.getItem("order-success-data");
      if (storedData) {
        orderData = JSON.parse(storedData);
      }
    }
    
    if (!orderData) {
      throw new Error("No order data found for Razorpay success");
    }

    // Extract payment mode from the order data, default to "RAZORPAY"
    const paymentMode = orderData.paymentMode || 
                       (orderData.orderModel && orderData.orderModel.paymentMode) || 
                       "RAZORPAY";

    // Store data for success page
    storeOrderSuccessData(
      {
        firstName: orderData.billingDetails?.firstName || "",
        lastName: orderData.billingDetails?.lastName || "",
        phone: orderData.billingDetails?.phone || "",
        email: orderData.billingDetails?.email || "",
        country: orderData.billingDetails?.country || "",
        state: orderData.billingDetails?.state || "",
        city: orderData.billingDetails?.city || "",
        address: orderData.billingDetails?.address || "",
        pincode: orderData.billingDetails?.pincode || "",
        latitude: orderData.billingDetails?.latitude || locationData?.latitude || 0,
        longitude: orderData.billingDetails?.longitude || locationData?.longitude || 0
      },
      orderData.orderModel,
      cartItems,
      orderTotals,
      paymentMode, // Use the extracted payment mode
      { id: defaultStoreId, name: appName, active: true },
      gstNumber,
      appliedCoupon
    );

    if (checkoutMode === 'cart') {
      emptyCart();
    }
    
    // Clean up session storage
    sessionStorage.removeItem("buyNowProduct");
    sessionStorage.removeItem("checkoutMode");
    sessionStorage.removeItem("order-success-data");
    sessionStorage.removeItem("razorpay-success-data");
    
    // Navigate to success page
    setTimeout(() => router.push("/pages/order-success"), 1500);
  } catch (error) {
    console.error("Error handling Razorpay success:", error);
    toast.error("Error processing payment. Please contact support.");
  }
}, [cartItems, orderTotals, defaultStoreId, appName, gstNumber, emptyCart, router, checkoutMode, locationData, appliedCoupon]); // Enhanced order payload creation with consistent pricing and COUPON DATA
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
        defaultStoreId,
        // FIXED: Include coupon data in order configuration
        appliedCoupon: appliedCoupon
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);

      if (orderModel.deliveryAddress) {
        orderModel.deliveryAddress.lat = enhancedFormData.latitude;
        orderModel.deliveryAddress.lng = enhancedFormData.longitude;
      }

      // FIXED: Add coupon information to order model
      if (appliedCoupon) {
        orderModel.couponCode = appliedCoupon.couponCode;
        orderModel.couponAmount = orderTotals.couponDiscount;
        orderModel.appliedCoupon = {
          couponCode: appliedCoupon.couponCode,
          couponAmount: appliedCoupon.couponAmount,
          isCouponPercentage: appliedCoupon.isCouponPercentage,
          maxCouponAmount: appliedCoupon.maxCouponAmount,
          minimumCartValue: appliedCoupon.minimumCartValue,
          discountApplied: orderTotals.couponDiscount
        };
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
        orderModel: orderModel,
        // FIXED: Include coupon data in order data
        appliedCoupon: appliedCoupon
      };

      return { orderData, orderModel };
    } catch (error) {
      console.error("Error preparing order data:", error);
      toast.error("Failed to prepare order data");
      return null;
    }
  }, [cartItems, selectedPaymentMode, orderTotals, gstNumber, appName, defaultStoreId, locationData, appliedCoupon]);

  // Form submission with enhanced pricing and coupon data
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
        defaultStoreId,
        // FIXED: Include coupon data in order creation
        appliedCoupon: appliedCoupon
      };

      const orderModel = OrderPayloadService.createOrderPayload(orderConfig);

      if (orderModel.deliveryAddress) {
        orderModel.deliveryAddress.lat = enhancedFormData.latitude;
        orderModel.deliveryAddress.lng = enhancedFormData.longitude;
      }

      // FIXED: Add coupon information to order model
      if (appliedCoupon) {
        orderModel.couponCode = appliedCoupon.couponCode;
        orderModel.couponAmount = orderTotals.couponDiscount;
        orderModel.appliedCoupon = {
          couponCode: appliedCoupon.couponCode,
          couponAmount: appliedCoupon.couponAmount,
          isCouponPercentage: appliedCoupon.isCouponPercentage,
          maxCouponAmount: appliedCoupon.maxCouponAmount,
          minimumCartValue: appliedCoupon.minimumCartValue,
          discountApplied: orderTotals.couponDiscount
        };
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
          // Store order data for Razorpay success callback with coupon data
          if (typeof window !== "undefined") {
            sessionStorage.setItem("order-success-data", JSON.stringify({
              orderModel,
              billingDetails: enhancedFormData,
              appliedCoupon: appliedCoupon // FIXED: Include coupon in session storage
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
  }, [selectedPaymentMode, cartItems, orderTotals, gstNumber, appName, defaultStoreId, handleOrderSuccess, checkoutMode, locationData, setIsProcessing, appliedCoupon]);

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
                {/* 👇 New Address Section */}
              <div className="checkout-form mb-4">
                <h3 className="checkout-title">Select Delivery Address</h3>
                {addresses.length > 0 ? (
                  <div>
                    <div className="address-list"  style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`address-item p-3 mb-2 border rounded ${
                            selectedAddressId === address.id ? 'border-primary bg-light' : 'border-secondary'
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSelectAddress(address)}
                        >
                          <div className="d-flex align-items-start">
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={selectedAddressId === address.id}
                              onChange={() => handleSelectAddress(address)}
                              className="me-3 mt-1"
                            />
                            <div className="flex-grow-1">
                              <div className="fw-bold">
                                {address.firstName} {address.lastName}
                              </div>
                              <div>{address.address}</div>
                              <div>
                                {address.city}, {address.pinCode}
                              </div>
                              <div>Phone: {address.phoneNumber}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>                    
                    {selectedAddress && (
                      <div className="alert alert-success mt-3">
                        <strong>Selected Address:</strong><br />
                        {selectedAddress.firstName} {selectedAddress.lastName}<br />
                        {selectedAddress.address}, {selectedAddress.city} - {selectedAddress.pinCode}<br />
                        Phone: {selectedAddress.phoneNumber}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-info mt-3">
                    No saved addresses found. Please add a new address.
                  </div>
                )}
              </div>

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
                          placeholder="Enter 10-digit phone number"
                          className={`form-control ${errors.phone ? "error_border" : ""}`}
                          {...register("phone", VALIDATION_RULES.phone)}
                          onInput={handlePhoneInput}
                          maxLength={10}
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

                      {/* Updated Coupon Section with Used Coupons Tracking */}
                      <CouponSection
                        coupons={availableCouponsFiltered}
                        appliedCoupon={appliedCoupon}
                        phoneNumber={phoneNumber}
                        couponError={couponError}
                        usedCoupons={usedCoupons}
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