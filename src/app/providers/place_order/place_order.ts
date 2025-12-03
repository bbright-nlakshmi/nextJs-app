// Next.js (React) equivalent of the Dart PlaceOrderController class

import axios from 'axios';
import { toast } from 'react-toastify';

export class PlaceOrderController {
  constructor(razorpayService, phonePeService, userController) {
    this.razorpayService = razorpayService;
    this.phonePeService = phonePeService;
    this.userController = userController;
  }

  async placeOrder({
    onSuccess,
    deliveryAddressModel,
    cartController,
    orderGst,
    context,
  }) {
    const store = AppBootStrap.getStoreBaseDetails();
    if (!store.active) {
      toast.info("Store is currently inactive, please try again later.");
      return;
    }

    if (!orderGst) orderGst = null;

    if (cartController.selectedPaymentMode === 'Pick At Store') {
      deliveryAddressModel = {
        id: parseInt(store.id, 10) || 0,
        address: store.address,
        atStore: 0,
        city: '',
        firstName: store.name,
        lastName: '',
        pinCode: '',
        phoneNumber: store.phoneNumber,
        lat: store.storeLocation.latitude,
        lng: store.storeLocation.longitude,
      };
    }

    if (!deliveryAddressModel) {
      toast.info("Please add delivery address");
      return;
    }

    if (!cartController.selectedPaymentMode) {
      toast.info("Please select a payment mode");
      return;
    }

    const placeOrderObj = this.getPlaceOrderObj({
      deliveryAddressModel,
      cartController,
      orderGst,
    });

    if (placeOrderObj.finalTotal < 0) {
      toast.info(`Order total cannot be negative: ₹${placeOrderObj.finalTotal.toFixed(2)}`);
      return;
    }

    if (placeOrderObj.cartAmount < store.minCartValue) {
      const diff = store.minCartValue - placeOrderObj.cartAmount;
      toast.info(`Minimum order amount is ₹${store.minCartValue.toFixed(2)}. Please add ₹${diff.toFixed(2)} more.`);
      return;
    }

    const order = await this.getOrderModel({
      deliveryAddressModel,
      cartController,
      placeOrderObj,
      orderGst,
    });

    switch (cartController.selectedPaymentMode) {
      case 'PhonePe':
        await this.handlePhonePePayments({
          context,
          order,
          placeOrderObj,
          deliveryAddressModel,
          cartController,
          onSuccess,
        });
        break;
      case 'RazorPay':
        await this.handleRazorPayPayment({
          context,
          order,
          placeOrderObj,
          deliveryAddressModel,
          cartController,
          onSuccess,
        });
        break;
      case 'Cash On Delivery':
      case 'Pick At Store':
      case 'QR':
        await this.handlePaymentMethods({
          order,
          cartController,
          onSuccess,
          context,
        });
        break;
      default:
        toast.info("Unsupported payment method");
        break;
    }
  }

  getAttemptedOrderId(orderId) {
    return `${orderId}${Date.now() % 10000}`;
  }

  async handlePhonePePayments({
    context,
    order,
    placeOrderObj,
    deliveryAddressModel,
    cartController,
    onSuccess,
  }) {
    const attemptedOrderId = this.getAttemptedOrderId(placeOrderObj.orderID);
    const phonePeData = await API.getPhonePeDetails();
    this.phonePeService.setPhonePeModel(phonePeData[0]);

    const token = await API.getPhonePeToken({
      clientId: phonePeData[0].clientId,
      clientSecret: phonePeData[0].clientSecret,
      orderId: attemptedOrderId,
      amount: placeOrderObj.finalTotal * 100,
    });

    await this.phonePeService.initSdk(attemptedOrderId);
    await this.phonePeService.startTransaction({
      token,
      orderId: attemptedOrderId,
      onSuccess: async (payload) => {
        order.txnDetails = payload;
        await this.createOrder(order, cartController, onSuccess);
      },
      onFailure: (error) => {
        toast.error(`Payment Failed: ${error}`);
        API.saveAppLogs(placeOrderObj.orderID, error);
      },
    });
  }

  async handleRazorPayPayment({
    context,
    order,
    placeOrderObj,
    deliveryAddressModel,
    cartController,
    onSuccess,
  }) {
    const razorpayData = await API.getRazorPayDetails();
    this.razorpayService.setRazorpayModel(razorpayData[0]);

    this.razorpayService.openPaymentDialog({
      context,
      orderId: placeOrderObj.orderID,
      amount: placeOrderObj.finalTotal,
      contactNumber: deliveryAddressModel.phoneNumber,
      onSuccess: async () => {
        await this.createOrder(order, cartController, onSuccess);
      },
      onFailure: () => {
        toast.info("Payment failed, please try again.");
      },
    });
  }

  async handlePaymentMethods({ order, cartController, onSuccess }) {
    await this.createOrder(order, cartController, onSuccess);
  }

  async createOrder(order, cartController, onSuccess) {
    try {
      await Orders.createOrder(order, cartController.getSelectedCoupon());
      onSuccess();
      cartController.clearCart();
      toast.success("Order placed successfully");
    } catch (error) {
      toast.error(`Error placing order: ${error.message}`);
    }
  }

  async getOrderModel({ deliveryAddressModel, cartController, placeOrderObj, orderGst }) {
    return {
      id: placeOrderObj.orderID,
      deliveryAddress: deliveryAddressModel,
      orderTime: new Date().toISOString(),
      creationTime: new Date().toISOString(),
      paymentMode: cartController.selectedPaymentMode,
      phoneNumber: this.userController.loggedInPhoneNumber,
      userName: `${deliveryAddressModel.firstName}-${deliveryAddressModel.lastName}`,
      store: AppBootStrap.getStoreBaseDetails().name,
      storeId: AppBootStrap.getStoreBaseDetails().id,
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
      assignedDelivery: { name: 'Not Assigned', phone: '' },
      orderComplete: false,
      deviceToken: await FirebaseMessaging.getToken(),
      txnDetails: {},
      deliveryNotificationSent: false,
      userNotificationSent: false,
      orderGst,
      orderAcceptStatus: 'PENDING',
    };
  }

  getPlaceOrderObj({ deliveryAddressModel, cartController }) {
    const orderID = generateOrderID();
    const cartAmount = cartController.calcCartAmount();
    const packageCost = cartController.getPackageCost(cartAmount);
    const deliveryCost = cartController.getDeliveryCost(cartAmount);
    const discountAmount = cartController.getCartDiscount();
    const couponAmount = cartController.appliedCouponAmount(cartAmount);
    const finalWithoutDelivery = cartAmount - discountAmount - couponAmount + cartController.totalTaxAmount();
    const finalTotal = finalWithoutDelivery + packageCost + deliveryCost;
    const couponCode = cartController.getSelectedCoupon()?.couponCode || "";

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
  }
}

// Note: You’ll also need to implement utility functions like generateOrderID, FirebaseMessaging.getToken, AppBootStrap.getStoreBaseDetails, Orders.createOrder, and API service methods.
