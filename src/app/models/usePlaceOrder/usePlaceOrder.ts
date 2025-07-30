import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

// Types
interface DeliveryAddressModel {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  pinCode: string;
  phoneNumber: string;
  lat: number;
  lng: number;
  atStore?: number;
}

interface OrderModel {
  id: string;
  deliveryAddress: DeliveryAddressModel;
  orderTime: string;
  creationTime: string;
  paymentMode: string;
  phoneNumber: string;
  userName: string;
  store: string;
  storeId: string;
  cartTotal: number;
  finalOrderTotal: number;
  finalOrderTotalWithOutDelivery: number;
  couponCode: string;
  couponAmount: number;
  discountAmount: number;
  packageCost: number;
  deliveryCost: number;
  totalSavings: number;
  taxTotal: number;
  taxGroup: Record<string, number>;
  orderItems: Record<string, any>;
  img: string[];
  assignedDelivery: {
    name: string;
    phone: string;
  };
  orderComplete: boolean;
  deviceToken: string;
  txnDetails: Record<string, any>;
  deliveryNotificationSent: boolean;
  userNotificationSent: boolean;
  orderGst?: string;
  orderAcceptStatus: string;
}

interface PlaceOrderObj {
  orderID: string;
  cartAmount: number;
  packageCost: number;
  deliveryCost: number;
  discountAmount: number;
  couponAmount: number;
  couponCode: string;
  finalWithoutDelivery: number;
  finalTotal: number;
}

interface CartController {
  calcCartAmount: () => number;
  getPackageCost: (cartAmount: number) => number;
  getDeliveryCost: (cartAmount: number) => number;
  getCartDiscount: () => number;
  appliedCouponAmount: (cartAmount: number) => number;
  totalTaxAmount: () => number;
  getCartSavings: () => number;
  getTaxGroup: () => Record<string, number>;
  getOrderItems: () => Record<string, any>;
  getSelectedCoupon: () => any;
  selectedPaymentMode: string;
  clearCart: () => void;
}

interface StoreDetails {
  id: string;
  name: string;
  active: boolean;
  minCartValue: number;
  address: string;
  phoneNumber: string;
  storeLocation: {
    latitude: number;
    longitude: number;
  };
}

// Constants
const AppStrings = {
  pickAtStore: 'Pick At Store',
  phonepe: 'PhonePe',
  razorPay: 'Razor Pay',
  cashOnDelivery: 'Cash On Delivery',
  qr: 'QR',
  addDeliveryAddress: 'Please add delivery address',
  orderPlacedSuccessfully: 'Order placed successfully',
  notAssigned: 'Not Assigned',
  negativeAmountMessage: (amount: string) => `Order amount cannot be negative: ${amount}`,
};

export const usePlaceOrder = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate unique order ID
  const generateOrderID = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORDER-${timestamp}-${random}`;
  }, []);

  // Get attempted order ID with unique suffix
  const getAttemptedOrderId = useCallback((orderId: string) => {
    const uniqueSuffix = Date.now() % 10000; // 4 digits
    return `${orderId}${uniqueSuffix}`;
  }, []);

  // Create place order object
  const getPlaceOrderObj = useCallback((
    deliveryAddressModel: DeliveryAddressModel,
    cartController: CartController,
    orderGst?: string
  ): PlaceOrderObj => {
    const orderID = generateOrderID();
    const cartAmount = cartController.calcCartAmount();
    const packageCost = cartController.getPackageCost(cartAmount);
    const deliveryCost = cartController.getDeliveryCost(cartAmount);
    const discountAmount = cartController.getCartDiscount();
    const couponAmount = cartController.appliedCouponAmount(cartAmount);
    const finalWithoutDelivery = cartAmount - (discountAmount + couponAmount) + cartController.totalTaxAmount();
    const finalTotal = finalWithoutDelivery + (packageCost + deliveryCost);
    const couponCode = cartController.getSelectedCoupon()?.couponCode || '';

    return {
      orderID,
      cartAmount,
      packageCost,
      deliveryCost,
      discountAmount,
      couponAmount,
      couponCode,
      finalWithoutDelivery,
      finalTotal,
    };
  }, [generateOrderID]);

  // Create order model
  const getOrderModel = useCallback(async (
    deliveryAddressModel: DeliveryAddressModel,
    cartController: CartController,
    placeOrderObj: PlaceOrderObj,
    orderGst?: string,
    userPhoneNumber?: string,
    storeDetails?: StoreDetails
  ): Promise<OrderModel> => {
    // Mock device token - in real app, get from Firebase
    const deviceToken = 'mock-device-token';
    
    // Default store details if not provided
    const defaultStore: StoreDetails = {
      id: 'store-1',
      name: 'Sample Store',
      active: true,
      minCartValue: 100,
      address: 'Store Address',
      phoneNumber: '1234567890',
      storeLocation: { latitude: 0, longitude: 0 }
    };

    const store = storeDetails || defaultStore;

    const order: OrderModel = {
      id: placeOrderObj.orderID,
      deliveryAddress: deliveryAddressModel,
      orderTime: new Date().toISOString(),
      creationTime: new Date().toISOString(),
      paymentMode: cartController.selectedPaymentMode,
      phoneNumber: userPhoneNumber || deliveryAddressModel.phoneNumber,
      userName: `${deliveryAddressModel.firstName}-${deliveryAddressModel.lastName}`,
      store: store.name,
      storeId: store.id,
      cartTotal: placeOrderObj.cartAmount,
      finalOrderTotal: placeOrderObj.finalTotal,
      finalOrderTotalWithOutDelivery: placeOrderObj.finalWithoutDelivery,
      couponCode: placeOrderObj.couponCode,
      couponAmount: placeOrderObj.couponAmount,
      discountAmount: placeOrderObj.discountAmount,
      packageCost: placeOrderObj.packageCost,
      deliveryCost: placeOrderObj.deliveryCost,
      totalSavings: cartController.getCartSavings(),
      taxTotal: cartController.totalTaxAmount(),
      taxGroup: cartController.getTaxGroup(),
      orderItems: cartController.getOrderItems(),
      img: [''],
      assignedDelivery: {
        name: AppStrings.notAssigned,
        phone: ''
      },
      orderComplete: false,
      deviceToken,
      txnDetails: {},
      deliveryNotificationSent: false,
      userNotificationSent: false,
      orderGst: orderGst || '',
      orderAcceptStatus: 'PENDING'
    };

    return order;
  }, []);

  // Mock payment services
  const handlePhonePePayment = useCallback(async (
    order: OrderModel,
    placeOrderObj: PlaceOrderObj,
    onSuccess: (payload: any) => void,
    onFailure: (error: string) => void
  ) => {
    try {
      // Mock PhonePe payment flow
      const attemptedOrderId = getAttemptedOrderId(placeOrderObj.orderID);
      
      // Simulate payment processing
      setTimeout(() => {
        const mockPayload = {
          orderId: attemptedOrderId,
          transactionId: `TXN-${Date.now()}`,
          amount: placeOrderObj.finalTotal * 100,
          status: 'SUCCESS'
        };
        
        order.txnDetails = mockPayload;
        onSuccess(mockPayload);
      }, 2000);
      
    } catch (error) {
      onFailure(`PhonePe payment failed: ${error}`);
    }
  }, [getAttemptedOrderId]);

  // Validate minimum cart value
  const validateMinCartValue = useCallback((cartAmount: number, minCartValue: number) => {
    if (cartAmount < minCartValue) {
      const difference = minCartValue - cartAmount;
      throw new Error(
        `Minimum order amount is ${minCartValue.toFixed(2)}. Please add items worth ${difference.toFixed(2)} more to proceed.`
      );
    }
  }, []);

  const handleRazorPayPayment = useCallback(async (
    order: OrderModel,
    placeOrderObj: PlaceOrderObj,
    deliveryAddressModel: DeliveryAddressModel,
    onSuccess: () => void,
    onFailure: () => void
  ) => {
    try {
      // Mock Razorpay payment flow
      setTimeout(() => {
        const mockPaymentData = {
          orderId: placeOrderObj.orderID,
          paymentId: `pay_${Date.now()}`,
          amount: placeOrderObj.finalTotal,
          status: 'captured'
        };
        
        order.txnDetails = mockPaymentData;
        onSuccess();
      }, 2000);
      
    } catch (error) {
      onFailure();
    }
  }, []);

  // Create order API call
  const createOrder = useCallback(async (
    order: OrderModel,
    cartController: CartController,
    onSuccess: () => void
  ) => {
    let orderSuccess = true;
    let orderErrorMessage = '';

    try {
      // Mock API call - replace with actual API
      console.log('Creating order:', order);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call success callback and clear cart
      onSuccess();
      cartController.clearCart();
      
    } catch (error) {
      console.error('Error while placing order:', error);
      orderSuccess = false;
      orderErrorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    if (orderSuccess) {
      toast.success(AppStrings.orderPlacedSuccessfully);
    } else {
      toast.error(orderErrorMessage);
    }
  }, []);

  // Main place order function
  const placeOrder = useCallback(async ({
    onSuccess,
    deliveryAddressModel,
    cartController,
    orderGst,
    userPhoneNumber,
    storeDetails
  }: {
    onSuccess: () => void;
    deliveryAddressModel?: DeliveryAddressModel;
    cartController: CartController;
    orderGst?: string;
    userPhoneNumber?: string;
    storeDetails?: StoreDetails;
  }) => {
    setIsProcessing(true);

    try {
      // Validate store is active
      const store = storeDetails || { active: true } as StoreDetails;
      if (!store.active) {
        toast.error("Store is currently inactive, please try again later.");
        return;
      }

      // Handle pick at store
      if (cartController.selectedPaymentMode === AppStrings.pickAtStore && storeDetails) {
        deliveryAddressModel = {
          id: parseInt(storeDetails.id) || 0,
          address: storeDetails.address,
          atStore: 0,
          city: '',
          firstName: storeDetails.name,
          lastName: '',
          pinCode: '',
          phoneNumber: storeDetails.phoneNumber,
          lat: storeDetails.storeLocation.latitude,
          lng: storeDetails.storeLocation.longitude,
        };
      }

      // Validate delivery address
      if (!deliveryAddressModel) {
        toast.error(AppStrings.addDeliveryAddress);
        return;
      }

      // Validate payment mode
      if (!cartController.selectedPaymentMode) {
        toast.error("Please select a payment mode");
        return;
      }

      // Create place order object
      const placeOrderObj = getPlaceOrderObj(deliveryAddressModel, cartController, orderGst);

      // Check if final total is negative
      if (placeOrderObj.finalTotal < 0) {
        toast.error(AppStrings.negativeAmountMessage(placeOrderObj.finalTotal.toString()));
        return;
      }

      // Validate minimum cart value
      try {
        validateMinCartValue(placeOrderObj.cartAmount, storeDetails?.minCartValue || 100);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Minimum cart value not met');
        return;
      }


      // Create order model
      const order = await getOrderModel(
        deliveryAddressModel,
        cartController,
        placeOrderObj,
        orderGst,
        userPhoneNumber,
        storeDetails
      );

      // Handle different payment methods
      if (placeOrderObj.finalTotal >= 0) {
        switch (cartController.selectedPaymentMode) {
          case AppStrings.phonepe:
            await handlePhonePePayment(
              order,
              placeOrderObj,
              async (payload) => {
                console.log("PhonePe Success Payload:", payload);
                order.txnDetails = payload;
                await createOrder(order, cartController, onSuccess);
              },
              (error) => {
                toast.error(`Payment Failed: ${error}`);
              }
            );
            break;

          case AppStrings.razorPay:
            await handleRazorPayPayment(
              order,
              placeOrderObj,
              deliveryAddressModel,
              async () => {
                await createOrder(order, cartController, onSuccess);
              },
              () => {
                toast.error("Payment failed, please try again.");
              }
            );
            break;

          case AppStrings.cashOnDelivery:
          case AppStrings.pickAtStore:
          case AppStrings.qr:
            await createOrder(order, cartController, onSuccess);
            break;

          default:
            toast.error("Unsupported payment method");
            break;
        }
      }

    } catch (error) {
      console.error('Place order error:', error);
      toast.error(error instanceof Error ? error.message : 'Error placing order');
    } finally {
      setIsProcessing(false);
    }
  }, [
    getPlaceOrderObj,
    getOrderModel,
    handlePhonePePayment,
    handleRazorPayPayment,
    createOrder
  ]);

  return {
    placeOrder,
    isProcessing,
    generateOrderID,
    getAttemptedOrderId,
    getPlaceOrderObj,
    getOrderModel,
    validateMinCartValue,
    AppStrings
  };
};