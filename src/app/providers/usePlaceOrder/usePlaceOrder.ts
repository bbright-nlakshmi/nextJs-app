import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCart } from '../useCart/useCart';
import { appConfig } from '@/app/config';
import { API, searchController, Kit, objCache } from "@/app/globalProvider";
import { DeliveryAddressModel } from "@/app/models/delivery_address_model/delivery_address";
import { DeliveryAssign, OrderItemsModel, OrderModel } from "@/app/models/order/order";
import { getSizeLabel } from "@/utils/Labels";

// Types and Interfaces
interface FormData {
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
  taxType?: string;
  taxAmount?: number;
  active?: boolean;
  isReturnable?: boolean;
  categoryName?: string;
  categoryID?: string;
  collectedTax?: number;
  discount?: number;
  type?: string;
  // Variation fields
  selectedVariation?: string;
  saleQuantityStr?: string;
  baseCHoosedPrice?: number;
  unitPrice?: number;
  cartPurchaseOptionStr?: string;
  [key: string]: any;
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

interface CheckoutCalculations {
  cartTotal: number;
  packageCost: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  totalSavings: number;
  finalTotal: number;
  couponDiscount: number;
  collectedTax: number;
}

interface KitRaw {
  id: string;
  [key: string]: any;
}

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

// Payment methods and countries
const PAYMENT_MODES = [
  { value: "COD", label: "Cash on Delivery (COD)" },
  { value: "PICK_AT_STORE", label: "Pick at Store" },
  { value: "RAZORPAY", label: "Razorpay" },
  // { value: "PHONEPE", label: "PhonePe" }
];

const COUNTRIES = [
  { value: "", label: "Select Country" },
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
];

// Product lookup utilities (exact copy from checkout page)
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
    // Error handled silently
  }

  return null;
};

const getProductVariations = (item: CartItem): { sizes: string[], sizePrices: number[] } => {
  try {
    const product = getProductById(item.productId || item.id);
    
    if (product) {
      return {
        sizes: Array.isArray(product?.sellingDisplayOptions) ? product.sellingDisplayOptions : [],
        sizePrices: Array.isArray(product?.sellingPrices) ? product.sellingPrices : []
      };
    }
    
    return {
      sizes: item?.sellingDisplayOptions || [],
      sizePrices: item?.sellingPrices || []
    };
  } catch (error) {
    return { sizes: [], sizePrices: [] };
  }
};

// Enhanced getPrice function (exact copy from checkout page)
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

// Transform cart item helper with variation support
const transformToCartItem = (item: any, index: number, isBuyNow = false): CartItem => {
  const cartItem: CartItem = {
    id: item.id || `${isBuyNow ? 'buyNow' : 'cart'}-item-${index}`,
    productId: item.productId || item.id,
    name: item.name || "Unknown Product",
    img: Array.isArray(item.img) ? item.img : [item.img || ""],
    qty: item.qty || item.cartItemCount || 1,
    cartItemCount: item.qty || item.cartItemCount || 1,
    price: item.price || 0,
    discountPrice: item.discountPrice,
    purchaseOptionStr: item.purchaseOptionStr || item.cartPurchaseOptionStr || "default",
    cartPurchaseOptionStr: item.cartPurchaseOptionStr || item.purchaseOptionStr || "default",
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
    type: item.type,
    collectedTax: item.collectedTax || 0,
    // Variation fields
    selectedVariation: item.selectedVariation || item.selectedSize,
    saleQuantityStr: item.saleQuantityStr || item.cartPurchaseOptionStr || item.purchaseOptionStr,
    baseCHoosedPrice: item.baseCHoosedPrice,
    unitPrice: item.unitPrice
  };

  return cartItem;
};

// Main Hook
export const usePlaceOrder = (contextCartItems: any[], authUser: any) => {
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'buyNow'>('cart');
  const [buyNowProduct, setBuyNowProduct] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("COD");
  const [isProcessing, setIsProcessing] = useState(false);

  const apiConfig = {
    tenantId: appConfig.tenantId,
    storeId: appConfig.defaultStoreId,
  };

  // Use cart hook for dynamic calculations
  const {
    storeDetails,
    getPackageCost,
    getDeliveryCost,
    calcCartAmount: getCartAmountFromHook,
    setSelectedPaymentMode: setCartPaymentMode,
    setDeliveryCost
  } = useCart();

  // Initialize checkout mode and products
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

  // Set cart items based on mode with variation support
  useEffect(() => {
    if (checkoutMode === 'buyNow' && buyNowProduct) {
      const buyNowItem = transformToCartItem(buyNowProduct, 0, true);
      const price = getPrice(buyNowItem);
      buyNowItem.collectedTax = (price * 0.18) || 0;
      
      // Ensure variation information is preserved
      const { sizes } = getProductVariations(buyNowItem);
      const selectedVariation = buyNowItem.selectedSize || buyNowItem.selectedVariation || (sizes.length > 0 ? sizes[0] : "");
      buyNowItem.selectedVariation = selectedVariation;
      buyNowItem.selectedSize = selectedVariation;
      buyNowItem.saleQuantityStr = buyNowItem.purchaseOptionStr || selectedVariation || "default";
      
      setCartItems([buyNowItem]);
    } else {
      const cartTransformed = contextCartItems.map((item: any, index: number) => {
        const transformedItem = transformToCartItem(item, index, false);
        const price = getPrice(transformedItem);
        transformedItem.collectedTax = (price * 0.18) || 0;
        
        // Ensure variation information is preserved
        const { sizes } = getProductVariations(transformedItem);
        const selectedVariation = transformedItem.selectedSize || transformedItem.selectedVariation || (sizes.length > 0 ? sizes[0] : "");
        transformedItem.selectedVariation = selectedVariation;
        transformedItem.selectedSize = selectedVariation;
        transformedItem.saleQuantityStr = transformedItem.purchaseOptionStr || transformedItem.cartPurchaseOptionStr || selectedVariation || "default";
        
        return transformedItem;
      });
      setCartItems(cartTransformed);
    }
  }, [contextCartItems, checkoutMode, buyNowProduct]);

  // Update cart payment mode when checkout payment mode changes
  useEffect(() => {
    setCartPaymentMode(selectedPaymentMode);
  }, [selectedPaymentMode, setCartPaymentMode]);

  // Set delivery cost based on location (can be enhanced with location-based calculation)
  useEffect(() => {
    const defaultDeliveryCost = selectedPaymentMode === "PICK_AT_STORE" ? 0 : 100;
    setDeliveryCost(defaultDeliveryCost);
  }, [selectedPaymentMode, setDeliveryCost]);

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

  // Coupon selection with exact pricing match
  const handleSelectCoupon = useCallback((coupon: Coupon) => {
    setCouponError("");
    
    const now = new Date();
    if (coupon.expireDate && new Date(coupon.expireDate) < now) {
      setCouponError("Coupon has expired.");
      setAppliedCoupon(null);
      return;
    }
    
    // Calculate cart total using the SAME logic as checkout
    const cartTotal = cartItems.reduce((sum, item) => {
      const price = getPrice(item);
      const finalPrice = item.discountPrice && item.discountPrice < price ? item.discountPrice : price;
      const quantity = item.qty || item.cartItemCount || 1;
      return sum + (finalPrice * quantity);
    }, 0);
    
    if (cartTotal < coupon.minimumCartValue) {
      setCouponError(`Minimum cart value for this coupon is ₹${coupon.minimumCartValue}`);
      setAppliedCoupon(null);
      return;
    }
    
    setAppliedCoupon(coupon);
  }, [cartItems]);

  // Calculate checkout totals using EXACT same logic as checkout page
  const calculations = useMemo((): CheckoutCalculations => {
    let cartTotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let collectedTax = 0;

    // Use EXACT same pricing logic as checkout page
    cartItems.forEach(item => {
      const price = getPrice(item);
      const quantity = item.qty || item.cartItemCount || 1;
      const finalPrice = item.discountPrice && item.discountPrice < price ? item.discountPrice : price;
      const itemTotal = finalPrice * quantity;
      
      cartTotal += itemTotal;
      
      // Item-level discounts (exact match with checkout)
      if (item.discountPrice && item.discountPrice < price) {
        discountAmount += (price - item.discountPrice) * quantity;
      }
      
      taxAmount += (item.taxAmount || 0) * quantity;
      collectedTax += (item.collectedTax || 0);
    });

    // Ensure cartTotal is never zero if we have items
    if (cartTotal <= 0 && cartItems.length > 0) {
      console.warn('Cart total calculated as zero despite having items, using fallback');
      cartTotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || item.cartItemCount || 1)), 0);
    }

    // Coupon discount calculation (exact match with checkout)
    let couponDiscount = 0;
    if (appliedCoupon && cartTotal > 0) {
      couponDiscount = appliedCoupon.isCouponPercentage
        ? Math.min((cartTotal * appliedCoupon.couponAmount) / 100, appliedCoupon.maxCouponAmount || Infinity)
        : Math.min(appliedCoupon.couponAmount, appliedCoupon.maxCouponAmount || Infinity);
    }

    // Use cart hook for dynamic package and delivery costs
    const packageCost = getPackageCost(cartTotal);
    const deliveryCharges = getDeliveryCost(cartTotal);
    const totalSavings = discountAmount + couponDiscount;
    const finalTotal = Math.max(0, cartTotal + taxAmount + collectedTax + packageCost + deliveryCharges - couponDiscount);

    // Validation logging
    console.log('Calculations validation (MATCHES CHECKOUT):', {
      cartTotal,
      cartItemsCount: cartItems.length,
      taxAmount,
      collectedTax,
      packageCost,
      deliveryCharges,
      couponDiscount,
      finalTotal,
      discountAmount,
      totalSavings,
      itemsWithVariations: cartItems.filter(item => item.selectedVariation || item.selectedSize).length,
      priceBreakdown: cartItems.map(item => ({
        name: item.name,
        originalPrice: getPrice(item),
        discountPrice: item.discountPrice,
        finalPrice: item.discountPrice && item.discountPrice < getPrice(item) ? item.discountPrice : getPrice(item),
        quantity: item.qty || item.cartItemCount || 1
      }))
    });

    return {
      cartTotal,
      packageCost,
      deliveryCharges,
      discountAmount,
      taxAmount,
      totalSavings,
      finalTotal,
      couponDiscount,
      collectedTax
    };
  }, [cartItems, selectedPaymentMode, appliedCoupon, getPackageCost, getDeliveryCost]);

  return {
    // State
    checkoutMode,
    cartItems,
    availableCoupons,
    appliedCoupon,
    couponError,
    selectedPaymentMode,
    isProcessing,
    storeDetails,
    calculations,
    
    // Actions
    setCartItems,
    setAppliedCoupon,
    setSelectedPaymentMode,
    setIsProcessing,
    fetchCoupons,
    handleSelectCoupon,
    
    // Utilities (same as checkout)
    getPrice,
    getProductVariations,
    transformToCartItem,
    
    // Constants
    paymentModes: PAYMENT_MODES,
    countries: COUNTRIES,
    
    // API Config
    apiConfig
  };
};

// Enhanced Order Payload Service with CORRECT pricing (same as checkout)
export class OrderPayloadService {
  static generateOrderId(): string {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const combined = timestamp + randomNum;
    return combined.slice(-10);
  }

  static validateCalculations(cartCalculations: any): CheckoutCalculations {
    // Ensure all required fields exist and are numbers
    const safeCalc: CheckoutCalculations = {
      cartTotal: Number(cartCalculations?.cartTotal || cartCalculations?.cartAmount) || 0,
      packageCost: Number(cartCalculations?.packageCost) || 0,
      deliveryCharges: Number(cartCalculations?.deliveryCharges) || 0,
      discountAmount: Number(cartCalculations?.discountAmount) || 0,
      taxAmount: Number(cartCalculations?.taxAmount) || 0,
      totalSavings: Number(cartCalculations?.totalSavings) || 0,
      finalTotal: Number(cartCalculations?.finalTotal) || 0,
      couponDiscount: Number(cartCalculations?.couponDiscount) || 0,
      collectedTax: Number(cartCalculations?.collectedTax) || 0
    };

    // Validate that finalTotal is not zero or negative
    if (safeCalc.finalTotal <= 0) {
      console.warn('Final total is zero or negative, recalculating...');
      safeCalc.finalTotal = safeCalc.cartTotal + safeCalc.taxAmount + safeCalc.collectedTax + 
                           safeCalc.packageCost + safeCalc.deliveryCharges - safeCalc.couponDiscount;
    }

    // Ensure cartTotal is not null/zero if we have items
    if (safeCalc.cartTotal <= 0) {
      console.warn('Cart total is zero or negative, this may cause database issues');
    }

    return safeCalc;
  }

  static createDeliveryAddress(formData: FormData, selectedPaymentMode: string): DeliveryAddressModel {
    return new DeliveryAddressModel({
      id: Date.now(),
      atStore: selectedPaymentMode === 'PICK_AT_STORE' ? 1 : 0,
      firstName: formData.firstName || 'Unknown',
      lastName: formData.lastName || 'User',
      pinCode: formData.pincode || '000000',
      city: formData.city || 'Unknown',
      address: formData.address || 'No address provided',
      phoneNumber: formData.phone || '0000000000',
      isChoosed: null,
      lat: formData.latitude || 0,
      lng: formData.longitude || 0,
    });
  }

  static createDeliveryAssign(): DeliveryAssign {
    return new DeliveryAssign({
      name: 'Not Assigned',
      phone: ''
    });
  }

  static createOrderPayload(config: any): OrderModel {
    const {
      formData,
      cartItems,
      selectedPaymentMode,
      cartCalculations,
      storeDetails,
      gstNumber,
      appName,
      defaultStoreId
    } = config;

    // Validate and sanitize calculations
    const safeCalculations = this.validateCalculations(cartCalculations);

    const orderId = this.generateOrderId();
    const currentTime = new Date().toISOString();
    const deliveryAddress = this.createDeliveryAddress(formData, selectedPaymentMode);
    const deliveryAssign = this.createDeliveryAssign();

    // Ensure we have valid cart items
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart items are required to create an order');
    }

    const orderItems: OrderItemsModel[] = cartItems.map((item: CartItem) => {
      // CRITICAL FIX: Get the exact prices shown in checkout using same logic
      const originalPrice = getPrice(item); // This gets the base price from product
      const quantity = item.qty || item.cartItemCount || 1;
      
      // Check if there's a discounted price being used in checkout (EXACT MATCH)
      let finalUnitPrice = originalPrice;
      if (item.discountPrice && item.discountPrice < originalPrice) {
        finalUnitPrice = item.discountPrice; // Use the discount price
      }
      
      // Calculate totals based on the ACTUAL price being charged (what checkout shows)
      const itemTotal = finalUnitPrice * quantity;
      const originalTotal = originalPrice * quantity;
      
      // Get variation information
      const { sizes } = getProductVariations(item);
      const selectedVariation = item.selectedSize || item.selectedVariation || (sizes.length > 0 ? sizes[0] : "");
      
      const orderItemData = {
        id: item.id,
        name: item.name || 'Unknown Product',
        
        // CRITICAL FIX: Store the EXACT prices from checkout display
        baseChoosedPrice: originalTotal, // Original total before any discount
        baseCHoosedPrice: originalPrice, // Original price per unit (for reference)
        choosedPrice: itemTotal, // ACTUAL total being charged (what customer sees and pays)
        unitPrice: finalUnitPrice, // ACTUAL price per unit being charged
        costPrice: finalUnitPrice, // Use the actual charged price
        
        collectedTax: item.collectedTax || (finalUnitPrice * 0.18 * quantity) || 0,
        saleQuantityStr: item.purchaseOptionStr || item.cartPurchaseOptionStr || selectedVariation || "default",
        saleQuantity: quantity,
        isProduct: true,
        isReturnable: item.isReturnable || false,
        url: (item.img && item.img[0]) || '',
        rating: 0,
        categoryName: item.categoryName || '',
        categoryID: item.categoryID || '',
        cartItemCount: quantity,
        orderKitItems: [],
        selfDocRef: undefined,
        active: item.active !== undefined ? item.active : true,
        taxType: item.taxType || "EXCLUSIVE",
        taxAmount: item.taxAmount || 0,
        selectedSubscription: {},
        
        // Enhanced variation fields
        selectedVariation: selectedVariation,
        selectedSize: selectedVariation,
        sellingDisplayOptions: item.sellingDisplayOptions || [],
        sellingPrices: item.sellingPrices || [],
        
        // Additional fields for order history compatibility
        purchaseOptionStr: item.purchaseOptionStr || item.cartPurchaseOptionStr || selectedVariation || "default",
        
        // Store both original and discounted prices for order success page
        originalPrice: originalPrice, // Store original price
        discountedPrice: finalUnitPrice !== originalPrice ? finalUnitPrice : null, // Store discount info
        savings: originalPrice !== finalUnitPrice ? (originalPrice - finalUnitPrice) * quantity : 0,
        
        // Add the actual prices for display consistency
        displayPrice: finalUnitPrice, // What's shown to customer
        displayTotal: itemTotal // Total shown to customer
      };

      const orderItem = new OrderItemsModel(orderItemData);
      
      if (selectedPaymentMode === 'PICK_AT_STORE') {
        orderItem.status.process = null;
        orderItem.status.deliver = currentTime;
      } else {
        orderItem.status.process = currentTime;
        orderItem.status.deliver = null;
      }

      return orderItem;
    });

    // Calculate tax group based on actual charged prices (not original prices)
    const taxGroup = orderItems.reduce((acc, item) => {
      const taxType = item.taxType || 'EXCLUSIVE';
      acc[taxType] = (acc[taxType] || 0) + (item.collectedTax || 0);
      return acc;
    }, {} as Record<string, number>);

    // Ensure all required fields have valid values
    const orderData = {
      id: orderId,
      deliveryAddress: deliveryAddress,
      orderTime: currentTime,
      creationTime: currentTime,
      paymentMode: selectedPaymentMode || 'COD',
      phoneNumber: formData?.phone || '0000000000',
      userName: `${formData?.firstName || 'Unknown'} ${formData?.lastName || 'User'}`,
      store: storeDetails?.name || appName || "Default Store",
      storeId: storeDetails?.id || defaultStoreId || 'default',
      
      // Use the validated calculations directly
      cartTotal: safeCalculations.cartTotal,
      finalOrderTotal: safeCalculations.finalTotal,
      finalOrderTotalWithOutDelivery: Math.max(0, safeCalculations.finalTotal - safeCalculations.deliveryCharges),
      
      couponCode: "",
      couponAmount: safeCalculations.couponDiscount,
      discountAmount: safeCalculations.discountAmount,
      packageCost: safeCalculations.packageCost,
      deliveryCost: safeCalculations.deliveryCharges,
      totalSavings: safeCalculations.totalSavings,
      taxTotal: safeCalculations.taxAmount + safeCalculations.collectedTax,
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
      orderGst: gstNumber || undefined,
      
      // Add additional fields for order success page compatibility
      cartAmount: safeCalculations.cartTotal, // Alternative field name
      finalTotal: safeCalculations.finalTotal, // Alternative field name
      deliveryCharges: safeCalculations.deliveryCharges, // Alternative field name
      taxAmount: safeCalculations.taxAmount, // Additional tax field
      collectedTax: safeCalculations.collectedTax, // Collected tax field
      couponDiscount: safeCalculations.couponDiscount // Coupon discount field
    };

    // Final validation
    if (!orderData.cartTotal || orderData.cartTotal <= 0) {
      console.error('Cart total is invalid:', orderData.cartTotal);
      // Recalculate from order items as fallback using actual charged prices
      orderData.cartTotal = orderItems.reduce((sum, item) => sum + (item.choosedPrice || 0), 0);
      orderData.cartAmount = orderData.cartTotal;
    }

    if (!orderData.finalOrderTotal || orderData.finalOrderTotal <= 0) {
      console.error('Final order total is invalid:', orderData.finalOrderTotal);
      orderData.finalOrderTotal = orderData.cartTotal + (orderData.taxTotal || 0) + 
                                  (orderData.packageCost || 0) + (orderData.deliveryCost || 0) - 
                                  (orderData.couponAmount || 0);
      orderData.finalTotal = orderData.finalOrderTotal;
    }

    console.log('Order payload validation (PRICES MATCH CHECKOUT):', {
      cartTotal: orderData.cartTotal,
      finalOrderTotal: orderData.finalOrderTotal,
      itemCount: orderItems.length,
      variationsIncluded: orderItems.filter(item => item.selectedVariation).length,
      priceValidation: orderItems.map(item => ({
        name: item.name,
        originalPrice: item.baseChoosedPrice, // Original unit price
        chargedPrice: item.unitPrice, // ACTUAL charged unit price (matches checkout)
        displayPrice: item.displayPrice, // What customer sees
        total: item.choosedPrice, // ACTUAL total charged (matches checkout)
        displayTotal: item.displayTotal, // Total shown to customer
        quantity: item.cartItemCount,
        savings: item.savings
      }))
    });

    return new OrderModel(orderData);
  }

  static getPaymentModes() {
    return PAYMENT_MODES;
  }

  static getCountries() {
    return COUNTRIES;
  }
}