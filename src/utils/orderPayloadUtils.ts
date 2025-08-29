import { DeliveryAddressModel } from "@/app/models/delivery_address_model/delivery_address";
import { DeliveryAssign, OrderItemsModel, OrderModel } from "@/app/models/order/order";
import { appConfig } from "@/app/config";
import { API, searchController, Kit } from "@/app/globalProvider";
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
  [key: string]: any;
}

interface CartCalculations {
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

interface StoreDetails {
  id?: string;
  name?: string;
  active?: boolean;
}

interface KitRaw {
  id: string;
  [key: string]: any;
}

interface CreateOrderPayloadParams {
  formData: FormType;
  cartItems: CartItem[];
  selectedPaymentMode: string;
  cartCalculations: CartCalculations;
  storeDetails?: StoreDetails;
  gstNumber?: string;
  appName?: string;
  defaultStoreId?: string;
}

// Product lookup utilities (exact copy from checkout)
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

// Enhanced getPrice function (exact copy from checkout)
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

// Enhanced Order Payload Service
export class OrderPayloadService {
  static generateOrderId(): string {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const combined = timestamp + randomNum;
    return combined.slice(-10);
  }

  static validateCalculations(cartCalculations: any): CartCalculations {
    const safeCalc: CartCalculations = {
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

    return safeCalc;
  }

  static createDeliveryAddress(formData: FormType, selectedPaymentMode: string): DeliveryAddressModel {
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

  static createOrderPayload(config: CreateOrderPayloadParams): OrderModel {
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
      // CRITICAL: Get the exact prices shown in checkout using the same logic
      const originalPrice = getPrice(item);
      const quantity = item.qty || item.cartItemCount || 1;
      
      // Check if there's a discounted price being used in checkout (EXACT MATCH)
      let finalUnitPrice = originalPrice;
      if (item.discountPrice && item.discountPrice < originalPrice) {
        finalUnitPrice = item.discountPrice; // Use the discount price shown in checkout
      }
      
      // Calculate totals based on the ACTUAL price being charged (what checkout shows)
      const itemTotal = finalUnitPrice * quantity;
      const originalTotal = originalPrice * quantity;
      
      // Get variations from product
      const { sizes } = getProductVariations(item);
      const selectedVariation = item.selectedSize || (sizes.length > 0 ? sizes[0] : "");
      
      const orderItemData = {
        id: item.id,
        name: item.name || 'Unknown Product',
        
        // CRITICAL: Store the EXACT prices from checkout display
        baseChoosedPrice: originalTotal, // Original total before any discount
        baseCHoosedPrice: originalPrice, // Original price per unit (for reference)
        choosedPrice: itemTotal, // ACTUAL total being charged (what customer sees and pays)
        unitPrice: finalUnitPrice, // ACTUAL price per unit being charged
        costPrice: finalUnitPrice, // Use the actual charged price
        
        collectedTax: item.collectedTax || (finalUnitPrice * 0.18 * quantity) || 0,
        saleQuantityStr: item.purchaseOptionStr || selectedVariation || "default",
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
        
        // Variation fields for order history
        selectedSize: selectedVariation,
        sellingDisplayOptions: item.sellingDisplayOptions || [],
        sellingPrices: item.sellingPrices || [],
        purchaseOptionStr: item.purchaseOptionStr || selectedVariation || "default",
        
        // Store pricing information for order success page
        originalPrice: originalPrice,
        discountedPrice: finalUnitPrice !== originalPrice ? finalUnitPrice : null,
        savings: originalPrice !== finalUnitPrice ? (originalPrice - finalUnitPrice) * quantity : 0,
        displayPrice: finalUnitPrice,
        displayTotal: itemTotal
      };

      const orderItem = new OrderItemsModel(orderItemData);
      
      // Set status based on payment mode
      if (selectedPaymentMode === 'PICK_AT_STORE') {
        orderItem.status.process = null;
        orderItem.status.deliver = currentTime;
      } else {
        orderItem.status.process = currentTime;
        orderItem.status.deliver = null;
      }

      return orderItem;
    });

    // Calculate tax group based on actual charged prices
    const taxGroup = orderItems.reduce((acc, item) => {
      const taxType = item.taxType || 'EXCLUSIVE';
      acc[taxType] = (acc[taxType] || 0) + (item.collectedTax || 0);
      return acc;
    }, {} as Record<string, number>);

    // Create order data with validated calculations
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
      
      // Use the validated calculations directly (matching checkout totals)
      cartTotal: safeCalculations.cartTotal,
      cartAmount: safeCalculations.cartTotal, // Alternative field name
      finalOrderTotal: safeCalculations.finalTotal,
      finalTotal: safeCalculations.finalTotal, // Alternative field name
      finalOrderTotalWithOutDelivery: Math.max(0, safeCalculations.finalTotal - safeCalculations.deliveryCharges),
      
      couponCode: "",
      couponAmount: safeCalculations.couponDiscount,
      couponDiscount: safeCalculations.couponDiscount, // Alternative field name
      discountAmount: safeCalculations.discountAmount,
      packageCost: safeCalculations.packageCost,
      deliveryCost: safeCalculations.deliveryCharges,
      deliveryCharges: safeCalculations.deliveryCharges, // Alternative field name
      totalSavings: safeCalculations.totalSavings,
      taxTotal: safeCalculations.taxAmount + safeCalculations.collectedTax,
      taxAmount: safeCalculations.taxAmount, // Additional tax field
      collectedTax: safeCalculations.collectedTax, // Collected tax field
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
      priceValidation: orderItems.map(item => ({
        name: item.name,
        originalPrice: item.baseChoosedPrice,
        chargedPrice: item.unitPrice,
        displayPrice: item.displayPrice,
        total: item.choosedPrice,
        displayTotal: item.displayTotal,
        quantity: item.cartItemCount,
        savings: item.savings
      }))
    });

    return new OrderModel(orderData);
  }
}

// Store order success data with enhanced pricing info
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
      items: cartItems.map(item => {
        const originalPrice = getPrice(item);
        const finalPrice = item.discountPrice && item.discountPrice < originalPrice ? item.discountPrice : originalPrice;
        const quantity = item.qty || item.cartItemCount || 1;
        
        return {
          id: item.id,
          name: item.name,
          img: item.img,
          cartItemCount: quantity,
          qty: quantity,
          price: originalPrice,
          discountPrice: item.discountPrice,
          finalPrice: finalPrice,
          displayTotal: finalPrice * quantity,
          originalTotal: originalPrice * quantity,
          savings: originalPrice !== finalPrice ? (originalPrice - finalPrice) * quantity : 0,
          taxAmount: item.taxAmount,
          categoryName: item.categoryName,
          selectedSize: item.selectedSize,
          purchaseOptionStr: item.purchaseOptionStr
        };
      }),
      cartTotal: cartCalculations.cartTotal,
      finalTotal: cartCalculations.finalTotal,
      discountAmount: cartCalculations.discountAmount,
      packageCost: cartCalculations.packageCost,
      deliveryCost: cartCalculations.deliveryCharges,
      deliveryCharges: cartCalculations.deliveryCharges,
      taxTotal: cartCalculations.taxAmount + cartCalculations.collectedTax,
      taxAmount: cartCalculations.taxAmount,
      collectedTax: cartCalculations.collectedTax,
      totalSavings: cartCalculations.totalSavings,
      couponDiscount: cartCalculations.couponDiscount,
      billingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude
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

// Legacy export for compatibility
export const createOrderPayload = (params: CreateOrderPayloadParams): OrderModel => {
  return OrderPayloadService.createOrderPayload(params);
};