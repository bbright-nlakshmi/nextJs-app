// Fixed Order Models - order.ts
import { DeliveryAddressModel } from '../delivery_address_model/delivery_address';

export class DeliveryAssign {
  name: string;
  phone: string;

  constructor(params: { name: string; phone: string }) {
    this.name = params.name;
    this.phone = params.phone;
  }
 
  toJsonObj() {
    return {
      name: this.name,
      phone: this.phone,
    };
  }
 
  static fromMap(data: any): DeliveryAssign {
    return new DeliveryAssign({
      name: data.name ?? '',
      phone: data.phone ?? ''
    });
  }
}
export class OrderItemsModel {
  id: string;
  name: string;
  baseChoosedPrice: number;
  choosedPrice: number;
  collectedTax: number;
  costPrice: number;
  saleQuantityStr: string;
  saleQuantity: number;
  isProduct: boolean;
  isReturnable: boolean;
  url: string;
  rating: number;
  categoryName: string;
  categoryID: string;
  cartItemCount: number;
  orderKitItems: any[];
  selfDocRef?: any;
  active: boolean;
  taxType: string;
  taxAmount: number;
  status: {
    process: string | null;
    deliver: string | null;
    confirm: string | null;
    package: string | null;
    cancel: string | null;
    transit: string | null;
  };
  
  selectedSubscription: {};

  constructor(params: {
    id: string;
    name: string;
    baseChoosedPrice: number;
    choosedPrice: number;
    collectedTax: number;
    costPrice: number;
    saleQuantityStr: string;
    saleQuantity: number;
    isProduct: boolean;
    isReturnable: boolean;
    url: string;
    rating: number;
    categoryName: string;
    categoryID: string;
    cartItemCount: number;
    orderKitItems: any[];
    selfDocRef?: any;
    active?: boolean;
    taxType?: string;
    taxAmount?: number;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.baseChoosedPrice = params.baseChoosedPrice;
    this.choosedPrice = params.choosedPrice;
    this.collectedTax = params.collectedTax;
    this.costPrice = params.costPrice;
    this.saleQuantityStr = params.saleQuantityStr;
    this.saleQuantity = params.saleQuantity;
    this.isProduct = params.isProduct;
    this.isReturnable = params.isReturnable;
    this.url = params.url;
    this.rating = params.rating;
    this.categoryName = params.categoryName;
    this.categoryID = params.categoryID;
    this.cartItemCount = params.cartItemCount;
    this.orderKitItems = params.orderKitItems;
    this.selfDocRef = params.selfDocRef;
    this.active = params.active ?? true;
    this.taxType = params.taxType ?? "EXCLUSIVE";
    this.taxAmount = params.taxAmount ?? 0;
    // Initialize status
    this.status = {
      process: null,
      deliver: null,
      confirm: null,
      package: null,
      cancel: null,
      transit: null,
    };

    // Initialize subscription
    this.selectedSubscription = {
      
    };
  }

  static fromMap(data: any): OrderItemsModel {
    return new OrderItemsModel({
      id: data.id,
      name: data.name,
      baseChoosedPrice: data.base_choosed_price ?? 0,
      choosedPrice: data.choosed_price ?? 0,
      collectedTax: data.collected_tax ?? 0,
      costPrice: data.cost_price ?? 0,
      saleQuantityStr: data.sale_quantity_str ?? '',
      saleQuantity: data.sale_quantity ?? 0,
      isProduct: data.is_product ?? true,
      isReturnable: data.is_returnable ?? false,
      url: data.url ?? '',
      rating: data.rating ?? 0,
      categoryName: data.category_name ?? '',
      categoryID: data.category_id ?? '',
      cartItemCount: data.cart_item_count ?? 0,
      orderKitItems: data.order_kit_items ?? [],
      selfDocRef: data.self_doc_ref,
      active: data.active ?? true,
      taxType: data.tax_type ?? "EXCLUSIVE",
      taxAmount: data.tax_amount ?? 0,
    });
  }
  toJsonObj(): any {
    return {
      id: this.id,
      name: this.name,
      base_choosed_price: this.baseChoosedPrice,
      choosed_price: this.choosedPrice,
      collected_tax: this.collectedTax,
      cost_price: this.costPrice,
      sale_quantity_str: this.saleQuantityStr,
      sale_quantity: this.saleQuantity,
      is_product: this.isProduct,
      is_returnable: this.isReturnable,
      url: this.url,
      rating: this.rating,
      category_name: this.categoryName,
      category_id: this.categoryID,
      cart_item_count: this.cartItemCount,
      order_kit_items: this.orderKitItems,
      self_doc_ref: this.selfDocRef,
      active: this.active,
      tax_type: this.taxType,
      tax_amount: this.taxAmount,
      status: this.status,
      selected_subscription: this.selectedSubscription,
    };
  }
}
export class OrderModel {
  id: string;
  deliveryAddress: DeliveryAddressModel;
  orderTime: string;
  creationTime: string;
  paymentMode: string;
  phoneNumber: string;
  userName: string;
  store: string;
  storeId: string;
  deviceToken?: string;
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
  orderItems: OrderItemsModel[];
  txnDetails?: Record<string, number>;
  deliveryNotificationSent: boolean;
  img: string[];
  assignedDelivery: DeliveryAssign;
  orderComplete: boolean;
  userNotificationSent: boolean;
  orderAcceptStatus: string;
  orderGst?: string;
 
  constructor(params: {
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
    orderItems: OrderItemsModel[];
    img: string[];
    assignedDelivery: DeliveryAssign;
    orderComplete: boolean;
    orderAcceptStatus: string;
    deviceToken?: string;
    txnDetails?: Record<string, number>;
    deliveryNotificationSent?: boolean;
    userNotificationSent?: boolean;
    orderGst?: string;
  }) {
    this.id = params.id;
    this.deliveryAddress = params.deliveryAddress;
    this.orderTime = params.orderTime;
    this.creationTime = params.creationTime;
    this.paymentMode = params.paymentMode;
    this.phoneNumber = params.phoneNumber;
    this.userName = params.userName;
    this.store = params.store;
    this.storeId = params.storeId;
    this.cartTotal = params.cartTotal;
    this.finalOrderTotal = params.finalOrderTotal;
    this.finalOrderTotalWithOutDelivery = params.finalOrderTotalWithOutDelivery;
    this.couponCode = params.couponCode;
    this.couponAmount = params.couponAmount;
    this.discountAmount = params.discountAmount;
    this.packageCost = params.packageCost;
    this.deliveryCost = params.deliveryCost;
    this.totalSavings = params.totalSavings;
    this.taxTotal = params.taxTotal;
    this.taxGroup = params.taxGroup;
    this.orderItems = params.orderItems;
    this.img = params.img;
    this.assignedDelivery = params.assignedDelivery;
    this.orderComplete = params.orderComplete;
    this.orderAcceptStatus = params.orderAcceptStatus;
    this.deviceToken = params.deviceToken;
    this.txnDetails = params.txnDetails;
    this.deliveryNotificationSent = params.deliveryNotificationSent ?? false;
    this.userNotificationSent = params.userNotificationSent ?? false;
    this.orderGst = params.orderGst;
  }
 
  static fromMap(data: any): OrderModel {
    const orderItems: OrderItemsModel[] = [];
    if (Array.isArray(data.order_items)) {
      data.order_items.forEach((item: any) => {
        orderItems.push(OrderItemsModel.fromMap(item));
      });
    }
    return new OrderModel({
      id: data.id,
      deliveryAddress: DeliveryAddressModel.fromMap(data.delivery_address),
      orderTime: data.order_time,
      creationTime: data.creation_time,
      paymentMode: data.payment_mode,
      phoneNumber: data.phone_number,
      userName: data.user_name,
      store: data.store,
      storeId: data.store_id,
      cartTotal: data.cart_total,
      finalOrderTotal: data.final_order_total,
      finalOrderTotalWithOutDelivery: data.final_order_total_without_delivery,
      couponCode: data.coupon_code,
      couponAmount: data.coupon_amount,
      discountAmount: data.discount_amount,
      packageCost: data.package_cost,
      deliveryCost: data.delivery_cost,
      totalSavings: data.total_savings,
      taxTotal: data.tax_total,
      taxGroup: data.tax_group ?? {},
      orderItems: orderItems,
      img: Array.isArray(data.img) ? data.img.map(String) : [],
      assignedDelivery: DeliveryAssign.fromMap(data.assigned_delivery ?? {}),
      orderComplete: data.order_complete,
      orderAcceptStatus: data.order_accept_status,
      deviceToken: data.device_token,
      txnDetails: data.txn_details,
      deliveryNotificationSent: data.delivery_notification_sent ?? false,
      userNotificationSent: data.user_notification_sent ?? false,
      orderGst: data.order_gst,
    });
  }
 
  toJsonObj(): any {
    return {
      id: this.id,
      delivery_address: this.deliveryAddress.toJsonObj(),
      order_time: this.orderTime,
      creation_time: this.creationTime,
      payment_mode: this.paymentMode,
      phone_number: this.phoneNumber,
      user_name: this.userName,
      store: this.store,
      store_id: this.storeId,
      device_token: this.deviceToken,
      cart_total: this.cartTotal,
      final_order_total: this.finalOrderTotal,
      final_order_total_without_delivery: this.finalOrderTotalWithOutDelivery,
      coupon_code: this.couponCode,
      coupon_amount: this.couponAmount,
      discount_amount: this.discountAmount,
      package_cost: this.packageCost,
      delivery_cost: this.deliveryCost,
      total_savings: this.totalSavings,
      tax_total: this.taxTotal,
      tax_group: this.taxGroup,
      order_items: this.orderItems.map(item => item.toJsonObj()),
      txn_details: this.txnDetails,
      delivery_notification_sent: this.deliveryNotificationSent,
      img: this.img,
      assigned_delivery: this.assignedDelivery.toJsonObj(),
      order_complete: this.orderComplete,
      user_notification_sent: this.userNotificationSent,
      order_accept_status: this.orderAcceptStatus,
      order_gst: this.orderGst,
    };
  }
 
  getDeliveryAssignName(): string {
    return this.assignedDelivery.name;
  }
 
  getItemsCount(): number {
    let count = 0;
    this.orderItems.forEach(orderItem => {
      if (orderItem.isProduct) {
        count += orderItem.cartItemCount;
      } else {
        count += orderItem.cartItemCount * orderItem.orderKitItems.length;
      }
    });
    return count;
  }
 
  getOrderAmountWithOutDelivery(): number {
    return this.finalOrderTotalWithOutDelivery;
  }
 
  getAssignedDeliveryName(): string {
    return this.assignedDelivery.name;
  }
}
