import { DeliveryAddressModel } from "@/app/models/delivery_address_model/delivery_address";
import { DeliveryAssign, OrderItemsModel, OrderModel } from "@/app/models/order/order";
import { appConfig } from "@/app/config";

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
  taxType?: string;
  taxAmount?: number;
  active: boolean;
  isReturnable?: boolean;
  categoryName?: string;
  categoryID?: string;
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
}

interface CreateOrderPayloadParams {
  formData: FormType;
  cartItems: CartItem[];
  selectedPaymentMode: string;
  cartCalculations: CartCalculations;
  storeDetails?: StoreDetails;
  gstNumber?: string;
}

export const createOrderPayload = ({
  formData,
  cartItems,
  selectedPaymentMode,
  cartCalculations,
  storeDetails,
  gstNumber = ""
}: CreateOrderPayloadParams): OrderModel => {
  
  // Generate unique order ID
  const generateOrderId = (): string => {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const combined = timestamp + randomNum;
    return combined.slice(-10);
  };

  // Create delivery address model
  const createDeliveryAddressModel = (formData: FormType): DeliveryAddressModel => {
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
  };

  // Create delivery assign model
  const createDeliveryAssign = (): DeliveryAssign => {
    return new DeliveryAssign({
      name: 'Not Assigned',
      phone: ''
    });
  };

  // Create order items
  const createOrderItems = (): OrderItemsModel[] => {
    const orderItems: OrderItemsModel[] = [];
   
    cartItems.forEach(item => {
      const basePrice = item.price * item.cartItemCount;
      const discountedPrice = item.discountPrice ?
        item.discountPrice * item.cartItemCount : basePrice;
     
      const orderItemData = {
        id: item.id,
        name: item.name,
        baseChoosedPrice: basePrice,
        choosedPrice: discountedPrice,
        collectedTax: item.taxAmount ? item.taxAmount * item.cartItemCount : 0,
        costPrice: item.price,
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

      // Set status based on payment mode
      orderItem.status.process = selectedPaymentMode === 'PICK_AT_STORE' ? null : new Date().toISOString();
      orderItem.status.deliver = selectedPaymentMode === 'PICK_AT_STORE' ? new Date().toISOString() : null;
      orderItem.status.confirm = null;
      orderItem.status.package = null;
      orderItem.status.cancel = null;
      orderItem.status.transit = null;

      orderItems.push(orderItem);
    });

    return orderItems;
  };

  // Generate payload
  const orderId = generateOrderId();
  const currentTime = new Date().toISOString();
  const deliveryAddress = createDeliveryAddressModel(formData);
  const orderItems = createOrderItems();
  const deliveryAssign = createDeliveryAssign();

  // Create tax group
  const taxGroup: Record<string, number> = {};
  orderItems.forEach(item => {
    const taxType = item.taxType || 'EXCLUSIVE';
    taxGroup[taxType] = (taxGroup[taxType] || 0) + item.collectedTax;
  });

  // Create order data
  const orderData = {
    id: orderId,
    deliveryAddress: deliveryAddress,
    orderTime: currentTime,
    creationTime: currentTime,
    paymentMode: selectedPaymentMode,
    phoneNumber: formData.phone,
    userName: `${formData.firstName} ${formData.lastName}`,
    store: storeDetails?.name || appConfig.appName || "Default Store",
    storeId: storeDetails?.id || appConfig.defaultStoreId,
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

  return new OrderModel(orderData);
};

// Store order success data
export const storeOrderSuccessData = (
  formData: FormType,
  orderModel: OrderModel,
  cartItems: CartItem[],
  cartCalculations: CartCalculations,
  selectedPaymentMode: string,
  storeDetails?: StoreDetails,
  gstNumber?: string
): void => {
  try {
    const orderSuccessData = {
      orderId: orderModel.id,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        img: item.img,
        cartItemCount: item.cartItemCount,
        price: item.price,
        discountPrice: item.discountPrice,
        taxAmount: item.taxAmount,
        categoryName: item.categoryName
      })),
      cartTotal: cartCalculations.cartAmount,
      finalTotal: cartCalculations.finalTotal,
      discountAmount: cartCalculations.discountAmount,
      packageCost: cartCalculations.packageCost,
      deliveryCost: cartCalculations.deliveryCharges,
      taxTotal: cartCalculations.taxAmount,
      totalSavings: cartCalculations.totalSavings,
      billingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode
      },
      paymentMethod: selectedPaymentMode,
      orderDate: new Date().toISOString(),
      storeDetails: storeDetails,
      gstNumber: gstNumber
    };

    // Store in sessionStorage for immediate use
    sessionStorage.setItem("order-success-data", JSON.stringify(orderSuccessData));
    
    // Also store in localStorage as backup with order ID
    localStorage.setItem(`order-${orderModel.id}`, JSON.stringify(orderSuccessData));
    
    // Set expiry for localStorage (30 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    localStorage.setItem(`order-${orderModel.id}-expiry`, expiryDate.toISOString());
    
  } catch (error) {
    console.error("Error storing order success data:", error);
    // Don't throw error to prevent order placement failure
  }
};