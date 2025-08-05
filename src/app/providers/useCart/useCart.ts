import { constants } from 'crypto';
import { useState, useEffect, useCallback } from 'react';
import { appConfig } from '@/app/config';
import { DeliveryAddressModel } from '../../models/delivery_address_model/delivery_address';

// Types based on your Dart models
interface CartItem {
  id: string;
  name: string;
  img: string[];
  cartItemCount: number;
  cartPurchaseOptionStr: string;
  price: number;
  discountPrice?: number;
  taxType?: string;
  taxAmount?: number;
  active: boolean;
  saleMode?: string;
  isReturnable?: boolean;
  categoryName?: string;
  categoryID?: string;
}

interface CouponModel {
  couponCode: string;
  couponAmount: number;
  isCouponPercentage: boolean;
  maxCouponAmount: number;
  minimumCartValue: number;
  maxGlobalApply: number;
  appliedCount: number;
  applyAll: boolean;
}

// interface DeliveryAddressModel {
//   id: number;
//   firstName: string;
//   lastName: string;
//   address: string;
//   city: string;
//   pinCode: string;
//   phoneNumber: string;
//   lat: number;
//   lng: number;
//   atStore?: number;
// }

interface StoreDetails {
  qrPaymentEnabled: any;
  paypalEnabled: any;
  razorpayEnabled: any;
  phonepeEnabled: any;
  id: string;
  name: string;
  active: boolean;
  minCartValue: number;
  freePackageDeliveryCost: number;
  packageCost: number;
  address: string;
  phoneNumber: string;
  storeLocation: {
    latitude: number;
    longitude: number;
  };
}

// Constants
const SALE_MODE_RANGE = 'RANGE';
const SALE_MODE_CUSTOM = 'CUSTOM';
const SALE_MODE_FLEXIBLE = 'FLEXIBLE';
const EXCLUSIVE_TAX = 'EXCLUSIVE';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponModel | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [deliveryAddressModel, setDeliveryAddressModel] = useState<DeliveryAddressModel | null>(null);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [orderGst, setOrderGst] = useState<string>('');
  const [couponSavings, setCouponSavings] = useState<number>(0);

  // Mock store details - replace with actual store data
  const storeDetails: StoreDetails = {
    id: appConfig.defaultStoreId,
    name: 'Sample Store',
    active: true,
    minCartValue: 100,
    freePackageDeliveryCost: 500,
    packageCost: 25,
    address: 'Store Address',
    phoneNumber: '1234567890',
    storeLocation: {
      latitude: 0,
      longitude: 0
    },
    qrPaymentEnabled: undefined,
    paypalEnabled: undefined,
    razorpayEnabled: undefined,
    phonepeEnabled: undefined
  };

  // Add item to cart
  const addItemToCart = useCallback((item: CartItem) => {
    if (!storeDetails.active) {
      throw new Error("Store is currently inactive, please try again later.");
    }

    setCartItems(prevItems => {
      // Remove existing item if it exists
      const filteredItems = prevItems.filter(
        existingItem => !(existingItem.id === item.id && 
                         existingItem.cartPurchaseOptionStr === item.cartPurchaseOptionStr)
      );
      
      // Add new item
      return [...filteredItems, { ...item }];
    });
  }, [storeDetails.active]);

  // Remove item from cart
  const removeItemFromCart = useCallback((id: string, cartPurchaseOptionStr: string) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        !(item.id === id && item.cartPurchaseOptionStr === cartPurchaseOptionStr)
      )
    );
    
    // Auto remove coupon if cart doesn't meet minimum requirements
    if (selectedCoupon && !minCartAmount(selectedCoupon)) {
      setSelectedCoupon(null);
    }
    
    // Clear payment mode if cart is empty
    setCartItems(current => {
      if (current.length === 0) {
        setSelectedPaymentMode('');
      }
      return current;
    });
  }, [selectedCoupon]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedCoupon(null);
    setSelectedPaymentMode('');
    setOrderGst('');
  }, []);

  // Calculate cart amount
  const calcCartAmount = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.cartItemCount);
    }, 0);
  }, [cartItems]);

  // Calculate cart discount
  const getCartDiscount = useCallback(() => {
    return cartItems.reduce((discount, item) => {
      if (item.discountPrice && item.discountPrice < item.price) {
        const itemDiscount = (item.price - item.discountPrice) * item.cartItemCount;
        return discount + itemDiscount;
      }
      return discount;
    }, 0);
  }, [cartItems]);

  // Calculate package cost
  const getPackageCost = useCallback((cartAmount: number) => {
    if (selectedPaymentMode === 'Pick At Store') {
      return 0;
    }
    return cartAmount < storeDetails.freePackageDeliveryCost ? storeDetails.packageCost : 0;
  }, [selectedPaymentMode, storeDetails]);

  // Calculate delivery cost
  const getDeliveryCost = useCallback((cartAmount: number) => {
    if (selectedPaymentMode === 'Pick At Store') {
      return 0;
    }
    return cartAmount < storeDetails.freePackageDeliveryCost ? deliveryCost : 0;
  }, [selectedPaymentMode, storeDetails, deliveryCost]);

  // Calculate total tax amount
  const totalTaxAmount = useCallback(() => {
    return cartItems.reduce((totalTax, item) => {
      if (item.taxType === EXCLUSIVE_TAX && item.taxAmount) {
        const discountedPrice = item.discountPrice || item.price;
        return totalTax + (item.taxAmount * item.cartItemCount);
      }
      return totalTax;
    }, 0);
  }, [cartItems]);

  // Coupon validation functions
  const globalApplyLimitReached = useCallback((coupon: CouponModel) => {
    return coupon.applyAll && coupon.appliedCount >= coupon.maxGlobalApply;
  }, []);

  const minCartAmount = useCallback((coupon: CouponModel) => {
    const cartBeforeDiscount = calcCartAmount();
    return cartBeforeDiscount >= coupon.minimumCartValue;
  }, [calcCartAmount]);

  const userAlreadyApplied = useCallback((coupon: CouponModel) => {
    // Implement user-specific coupon tracking logic
    return false; // Placeholder
  }, []);

  // Apply coupon
  const selectCoupon = useCallback((coupon: CouponModel | null) => {
    if (!coupon) {
      setSelectedCoupon(null);
      return;
    }

    if (globalApplyLimitReached(coupon)) {
      throw new Error(`Global apply limit ${coupon.maxGlobalApply} reached for coupon ${coupon.couponCode}`);
    }

    if (!minCartAmount(coupon)) {
      throw new Error(`Minimum cart value required is ${coupon.minimumCartValue}`);
    }

    if (userAlreadyApplied(coupon)) {
      throw new Error('Coupon already applied');
    }

    setSelectedCoupon(coupon);
  }, [globalApplyLimitReached, minCartAmount, userAlreadyApplied]);

  // Calculate applied coupon amount
  const appliedCouponAmount = useCallback((cartAmount: number) => {
    if (!selectedCoupon) {
      setCouponSavings(0);
      return 0;
    }

    let savings = 0;
    if (selectedCoupon.isCouponPercentage) {
      savings = (selectedCoupon.couponAmount / 100) * cartAmount;
      if (savings > selectedCoupon.maxCouponAmount) {
        savings = selectedCoupon.maxCouponAmount;
      }
    } else {
      savings = selectedCoupon.couponAmount;
    }

    setCouponSavings(savings);
    return savings;
  }, [selectedCoupon]);

  // Calculate total savings
  const getCartSavings = useCallback(() => {
    const cartAmount = calcCartAmount();
    return getCartDiscount() + appliedCouponAmount(cartAmount);
  }, [calcCartAmount, getCartDiscount, appliedCouponAmount]);

  // Calculate final order amount
  const finalOrderAmount = useCallback(() => {
    const cartAmount = calcCartAmount();
    const packageCost = getPackageCost(cartAmount);
    const deliveryCostAmount = getDeliveryCost(cartAmount);
    const taxAmount = totalTaxAmount();
    const savings = getCartSavings();

    return cartAmount + taxAmount + packageCost + deliveryCostAmount - savings;
  }, [calcCartAmount, getPackageCost, getDeliveryCost, totalTaxAmount, getCartSavings]);

  // Generate order items for API
  const getOrderItems = useCallback(() => {
    const orderItems: Record<string, any> = {};
    
    cartItems.forEach(item => {
      const itemId = `${item.id}_${item.cartPurchaseOptionStr}`;
      const basePrice = item.price * item.cartItemCount;
      const discountedPrice = item.discountPrice ? 
        item.discountPrice * item.cartItemCount : basePrice;
      
      orderItems[itemId] = {
        id: item.id,
        baseChoosedPrice: basePrice,
        choosedPrice: discountedPrice,
        collectedTax: item.taxAmount ? item.taxAmount * item.cartItemCount : 0,
        costPrice: item.price, // Assuming cost price same as selling price for now
        saleQuantityStr: item.cartPurchaseOptionStr,
        saleQuantity: item.cartItemCount.toString(),
        isProduct: true,
        isReturnable: item.isReturnable || false,
        name: item.name,
        url: item.img[0] || '',
        rating: 0,
        orderKitItems: [],
        categoryName: item.categoryName || '',
        categoryID: item.categoryID || '',
        status: {
          process: new Date().toISOString(),
        },
        cartItemCount: item.cartItemCount,
      };
    });

    return orderItems;
  }, [cartItems]);

  // Validate minimum cart value
  const validateMinCartValue = useCallback(() => {
    const cartAmount = calcCartAmount();
    if (cartAmount < storeDetails.minCartValue) {
      const difference = storeDetails.minCartValue - cartAmount;
      throw new Error(
        `Minimum order amount is ${storeDetails.minCartValue.toFixed(2)}. Please add items worth ${difference.toFixed(2)} more to proceed.`
      );
    }
  }, [calcCartAmount, storeDetails.minCartValue]);

  return {
    // State
    cartItems,
    selectedCoupon,
    selectedPaymentMode,
    deliveryAddressModel,
    deliveryCost,
    orderGst,
    couponSavings,
    storeDetails,

    // Actions
    addItemToCart,
    removeItemFromCart,
    clearCart,
    setSelectedPaymentMode,
    setDeliveryAddressModel,
    setDeliveryCost,
    setOrderGst,
    selectCoupon,

    // Calculations
    calcCartAmount,
    getCartDiscount,
    getPackageCost,
    getDeliveryCost,
    totalTaxAmount,
    appliedCouponAmount,
    getCartSavings,
    finalOrderAmount,
    getOrderItems,
    validateMinCartValue,

    // Utilities
    countCartItems: () => cartItems.length,
    cartIsEmpty: () => cartItems.length === 0,
    getSelectedCoupon: () => selectedCoupon,
    isCouponSelected: (couponCode: string) => 
      selectedCoupon?.couponCode === couponCode,
  };
};