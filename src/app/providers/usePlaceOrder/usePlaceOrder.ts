import { DeliveryAddressModel } from "@/app/models/delivery_address_model/delivery_address";
import { DeliveryAssign, OrderItemsModel, OrderModel } from "@/app/models/order/order";

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

interface CartCalculations {
  cartAmount: number;
  packageCost: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  totalSavings: number;
  finalTotal: number;
}

interface StoreDetails {
  id?: string;
  name?: string;
  active?: boolean;
}

interface OrderPayloadConfig {
  formData: FormData;
  cartItems: CartItem[];
  selectedPaymentMode: string;
  cartCalculations: CartCalculations;
  storeDetails?: StoreDetails;
  gstNumber?: string;
  appName: string;
  defaultStoreId: string;
}

export class OrderPayloadService {
  
  /**
   * Generate a unique 10-digit order ID
   */
  static generateOrderId(): string {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const combined = timestamp + randomNum;
    
    return combined.slice(-10);
  }

  /**
   * Create delivery address model from form data
   */
  static createDeliveryAddress(formData: FormData, selectedPaymentMode: string): DeliveryAddressModel {
    return new DeliveryAddressModel({
      id: Date.now(),
      atStore: selectedPaymentMode === 'PICK_AT_STORE' ? 1 : 0,
      firstName: formData.firstName,
      lastName: formData.lastName,
      pinCode: formData.pincode,
      city: formData.city,
      address: formData.address,
      phoneNumber: formData.phone,
      isChoosed: null,
      lat: 0,
      lng: 0,
    });
  }

  /**
   * Create delivery assignment (placeholder for unassigned delivery)
   */
  static createDeliveryAssign(): DeliveryAssign {
    return new DeliveryAssign({
      name: 'Not Assigned',
      phone: ''
    });
  }

  /**
   * Set order item status based on payment mode
   */
  private static setOrderItemStatus(orderItem: OrderItemsModel, selectedPaymentMode: string): void {
    const currentTime = new Date().toISOString();
    
    if (selectedPaymentMode === 'PICK_AT_STORE') {
      orderItem.status.process = null;
      orderItem.status.deliver = currentTime;
    } else {
      orderItem.status.process = currentTime;
      orderItem.status.deliver = null;
    }
    
    orderItem.status.confirm = null;
    orderItem.status.package = null;
    orderItem.status.cancel = null;
    orderItem.status.transit = null;
  }

  /**
   * Create order items from cart items
   */
  static createOrderItems(cartItems: CartItem[], selectedPaymentMode: string): OrderItemsModel[] {
    const orderItems: OrderItemsModel[] = [];

    cartItems.forEach(item => {
      // Use the actual price from the cart item (which should already be calculated correctly)
      // The checkout page calculates the correct price using getPrice() function
      // and stores it in the item.price field
      const actualPrice = item.price; // This should be the correctly calculated price
      const basePrice = actualPrice * item.cartItemCount;
      
      // Use discountPrice if it exists and is lower than the actual price
      const discountedPrice = item.discountPrice && item.discountPrice < actualPrice
        ? item.discountPrice * item.cartItemCount 
        : basePrice;

      const orderItemData = {
        id: item.id,
        name: item.name,
        baseChoosedPrice: basePrice,
        choosedPrice: discountedPrice,
        collectedTax: item.taxAmount ? item.taxAmount * item.cartItemCount : 0,
        costPrice: actualPrice, // Use the actual calculated price
        saleQuantityStr: item.cartPurchaseOptionStr,
        saleQuantity: item.cartItemCount,
        isProduct: true,
        isReturnable: item.isReturnable || false,
        url: item.img[0] || '',
        rating: 0,
        categoryName: item.categoryName || '',
        categoryID: item.categoryID || '',
        cartItemCount: item.cartItemCount,
        orderKitItems: [],
        selfDocRef: undefined,
        active: item.active !== undefined ? item.active : true,
        taxType: item.taxType || "EXCLUSIVE",
        taxAmount: item.taxAmount || 0,
        selectedSubscription: {},
      };

      const orderItem = new OrderItemsModel(orderItemData);
      this.setOrderItemStatus(orderItem, selectedPaymentMode);
      orderItems.push(orderItem);
    });

    return orderItems;
  }

  /**
   * Create tax group from order items
   */
  static createTaxGroup(orderItems: OrderItemsModel[]): Record<string, number> {
    const taxGroup: Record<string, number> = {};
    
    orderItems.forEach(item => {
      const taxType = item.taxType || 'EXCLUSIVE';
      taxGroup[taxType] = (taxGroup[taxType] || 0) + item.collectedTax;
    });

    return taxGroup;
  }

  /**
   * Validate order data before creating payload
   */
  static validateOrderData(config: OrderPayloadConfig): string[] {
    const { formData, cartItems, selectedPaymentMode, cartCalculations, storeDetails, defaultStoreId } = config;
    const validationErrors: string[] = [];

    // Form validation
    if (!formData.firstName?.trim()) validationErrors.push("First name is required");
    if (!formData.lastName?.trim()) validationErrors.push("Last name is required");
    if (!formData.phone?.trim()) validationErrors.push("Phone number is required");
    if (!formData.email?.trim()) validationErrors.push("Email is required");
    if (!formData.country?.trim()) validationErrors.push("Country is required");
    if (!formData.state?.trim()) validationErrors.push("State is required");
    if (!formData.city?.trim()) validationErrors.push("City is required");
    if (!formData.address?.trim()) validationErrors.push("Address is required");
    if (!formData.pincode?.trim()) validationErrors.push("PIN code is required");

    // Order validation
    if (!selectedPaymentMode) validationErrors.push("Payment method is required");
    if (!cartItems || cartItems.length === 0) validationErrors.push("Cart is empty");
    if (cartCalculations.finalTotal <= 0) validationErrors.push("Invalid order total");
    if (cartCalculations.cartAmount <= 0) validationErrors.push("Invalid cart amount");
    if (!storeDetails?.id && !defaultStoreId) validationErrors.push("Store ID is missing");

    // Phone validation
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      validationErrors.push("Please enter a valid 10-digit phone number");
    }

    // Email validation
    if (formData.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      validationErrors.push("Please enter a valid email address");
    }

    // PIN code validation
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      validationErrors.push("Please enter a valid 6-digit PIN code");
    }

    return validationErrors;
  }

  /**
   * Create complete order payload
   */
  static createOrderPayload(config: OrderPayloadConfig): OrderModel {
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

    // Validate data first
    const validationErrors = this.validateOrderData(config);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const orderId = this.generateOrderId();
    const currentTime = new Date().toISOString();
    const deliveryAddress = this.createDeliveryAddress(formData, selectedPaymentMode);
    const orderItems = this.createOrderItems(cartItems, selectedPaymentMode);
    const deliveryAssign = this.createDeliveryAssign();
    const taxGroup = this.createTaxGroup(orderItems);

    const orderData = {
      id: orderId,
      deliveryAddress: deliveryAddress,
      orderTime: currentTime,
      creationTime: currentTime,
      paymentMode: selectedPaymentMode,
      phoneNumber: formData.phone,
      userName: `${formData.firstName} ${formData.lastName}`,
      store: storeDetails?.name || appName || "Default Store",
      storeId: storeDetails?.id || defaultStoreId,
      cartTotal: cartCalculations.cartAmount,
      finalOrderTotal: cartCalculations.finalTotal,
      finalOrderTotalWithOutDelivery: cartCalculations.finalTotal - cartCalculations.deliveryCharges,
      couponCode: "",
      couponAmount: 0,
      discountAmount: cartCalculations.discountAmount,
      packageCost: cartCalculations.packageCost,
      deliveryCost: cartCalculations.deliveryCharges,
      totalSavings: cartCalculations.totalSavings,
      taxTotal: cartCalculations.taxAmount,
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
      orderGst: gstNumber || undefined
    };

    // Store order and address in session storage for success page
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem("orderDetails", JSON.stringify(orderData));
        window.sessionStorage.setItem("addressDetails", JSON.stringify(formData));
      } catch (e) {
        // Fail silently if sessionStorage is not available
      }
    }

    return new OrderModel(orderData);
  }

  /**
   * Get payment method display text
   */
  static getPaymentMethodDisplayText(paymentMode: string, isProcessing: boolean = false): string {
    if (isProcessing) return "Processing...";

    const paymentTexts: { [key: string]: string } = {
      "COD": "Place Order (COD)",
      "PICK_AT_STORE": "Place Order (Pick at Store)",
      "PHONEPE": "Pay with PhonePe",
      "RAZORPAY": "Pay with Razorpay"
    };

    return paymentTexts[paymentMode] || "Place Order";
  }

  /**
   * Get supported payment modes
   */
  static getPaymentModes() {
    return [
      { value: "COD", label: "Cash on Delivery (COD)" },
      { value: "PICK_AT_STORE", label: "Pick at Store" },
      { value: "RAZORPAY", label: "Razorpay" },
      { value: "PHONEPE", label: "PhonePe" }
    ];
  }

  /**
   * Get supported countries
   */
  static getCountries() {
    return [
      { value: "", label: "Select Country" },
      { value: "India", label: "India" },
      { value: "United States", label: "United States" },
    ];
  }
}