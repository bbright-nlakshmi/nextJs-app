/* eslint-disable @next/next/no-img-element */
import React, { Fragment, useEffect, useState, useContext } from "react";
import { NextPage } from "next";
import { Media, Row, Col } from "reactstrap";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { getSizeLabel } from "@/utils/Labels";

interface OrderItem {
  id: string;
  name: string;
  img: string[];
  url?: string; // URL field from order payload
  cartItemCount: number;
  saleQuantity?: number; // Alternative quantity field
  price: number;
  unitPrice?: number; // Unit price from order payload
  costPrice?: number; // Cost price from order payload
  discountPrice?: number;
  choosedPrice?: number; // Chosen price from order payload
  baseChoosedPrice?: number; // Base chosen price from order payload
  baseCHoosedPrice?: number; // Alternative spelling from payload
  taxAmount?: number;
  collectedTax?: number; // Tax collected from order payload
  categoryName?: string;
  selectedSize?: string;
  selectedVariation?: string; // Variation from order payload
  saleQuantityStr?: string; // Sale quantity string from order payload
  purchaseOptionStr?: string; // Purchase option string from order payload
  sellingDisplayOptions?: string[]; // Available variations
  sellingPrices?: number[]; // Prices for variations
  variationIndex?: number; // Index of selected variation
  variationPrice?: number; // Price of selected variation
}

interface OrderData {
  orderId: string;
  items: OrderItem[];
  cartTotal: number;
  cartAmount?: number; // Alternative field name
  finalTotal: number;
  finalOrderTotal?: number; // Alternative field name
  discountAmount: number;
  packageCost: number;
  deliveryCost: number;
  deliveryCharges?: number; // Alternative field name
  taxTotal: number;
  taxAmount?: number; // Additional tax field
  collectedTax?: number; // Collected tax field
  totalSavings: number;
  couponDiscount?: number; // Coupon discount from order
  couponAmount?: number; // Alternative coupon field
  billingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    country: string;
    state: string;
    city: string;
    address: string;
    pincode: string;
  };
  paymentMethod: string;
  paymentMode?: string; // Alternative field name
  orderDate: string;
  orderTime?: string; // Alternative field name
  storeDetails?: {
    name: string;
    id: string;
  };
  store?: string; // Alternative store field
  storeId?: string; // Store ID field
  gstNumber?: string;
  orderGst?: string; // Alternative GST field
}

const OrderSuccessPage: NextPage = () => {
  const router = useRouter();
  const currencyContext = useContext(CurrencyContext);
  const { selectedCurr } = currencyContext || {};
  const { symbol = '$', value = 1 } = selectedCurr || {};
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedOrderDetails = sessionStorage.getItem("orderDetails");
      const storedAddressDetails = sessionStorage.getItem("addressDetails");

      if (storedOrderDetails) {
        const orderDetails = JSON.parse(storedOrderDetails);
        
        // Enhanced mapping with proper price calculation
        const mappedOrderData: OrderData = {
          orderId: orderDetails.id,
          items: (orderDetails.orderItems || []).map((item: any) => {
            // Get the actual unit price (this should match checkout calculations)
            const unitPrice = item.unitPrice || item.costPrice || 0;
            const choosedPrice = item.choosedPrice || 0;
            const baseChoosedPrice = item.baseChoosedPrice || item.baseCHoosedPrice || 0;
            const quantity = item.cartItemCount || item.saleQuantity || 1;
            
            // Calculate the effective price per unit (matching checkout logic)
            let effectiveUnitPrice = unitPrice;
            if (choosedPrice > 0 && baseChoosedPrice > 0 && choosedPrice < baseChoosedPrice) {
              effectiveUnitPrice = choosedPrice / quantity;
            }

            // Get variation information
            const selectedVariation = item.selectedVariation || item.selectedSize || "";
            const saleQuantityStr = item.saleQuantityStr || item.purchaseOptionStr || selectedVariation || "";

            return {
              id: item.id,
              name: item.name || "Unknown Product",
              img: item.url ? [item.url] : [],
              url: item.url,
              cartItemCount: quantity,
              saleQuantity: item.saleQuantity,
              price: unitPrice, // Original unit price
              unitPrice: unitPrice,
              costPrice: item.costPrice,
              choosedPrice: item.choosedPrice,
              baseChoosedPrice: baseChoosedPrice,
              baseCHoosedPrice: item.baseCHoosedPrice,
              discountPrice: effectiveUnitPrice !== unitPrice ? effectiveUnitPrice : undefined,
              taxAmount: item.taxAmount || 0,
              collectedTax: item.collectedTax || 0,
              categoryName: item.categoryName || "",
              selectedSize: item.selectedSize,
              selectedVariation: selectedVariation,
              saleQuantityStr: saleQuantityStr,
              purchaseOptionStr: item.purchaseOptionStr,
              sellingDisplayOptions: item.sellingDisplayOptions || [],
              sellingPrices: item.sellingPrices || [],
              variationIndex: item.variationIndex,
              variationPrice: item.variationPrice
            };
          }),
          cartTotal: orderDetails.cartTotal || orderDetails.cartAmount || 0,
          cartAmount: orderDetails.cartAmount,
          finalTotal: orderDetails.finalOrderTotal || orderDetails.finalTotal || 0,
          finalOrderTotal: orderDetails.finalOrderTotal,
          discountAmount: orderDetails.discountAmount || 0,
          packageCost: orderDetails.packageCost || 0,
          deliveryCost: orderDetails.deliveryCost || orderDetails.deliveryCharges || 0,
          deliveryCharges: orderDetails.deliveryCharges,
          taxTotal: orderDetails.taxTotal || ((orderDetails.taxAmount || 0) + (orderDetails.collectedTax || 0)) || 0,
          taxAmount: orderDetails.taxAmount,
          collectedTax: orderDetails.collectedTax,
          totalSavings: orderDetails.totalSavings || 0,
          couponDiscount: orderDetails.couponDiscount || orderDetails.couponAmount || 0,
          couponAmount: orderDetails.couponAmount,
          billingAddress: storedAddressDetails ? JSON.parse(storedAddressDetails) : {
            firstName: orderDetails.deliveryAddress?.firstName || "",
            lastName: orderDetails.deliveryAddress?.lastName || "",
            phone: orderDetails.phoneNumber || "",
            email: "",
            country: "",
            state: "",
            city: orderDetails.deliveryAddress?.city || "",
            address: orderDetails.deliveryAddress?.address || "",
            pincode: orderDetails.deliveryAddress?.pinCode || ""
          },
          paymentMethod: orderDetails.paymentMode || orderDetails.paymentMethod || "",
          paymentMode: orderDetails.paymentMode,
          orderDate: orderDetails.orderTime || orderDetails.orderDate || "",
          orderTime: orderDetails.orderTime,
          storeDetails: {
            name: orderDetails.store || "Store",
            id: orderDetails.storeId || "default"
          },
          store: orderDetails.store,
          storeId: orderDetails.storeId,
          gstNumber: orderDetails.orderGst || orderDetails.gstNumber,
          orderGst: orderDetails.orderGst
        };
        
        setOrderData(mappedOrderData);
      }
    } catch (error) {
      console.error("Error loading order data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get effective price for an item (matching checkout calculation logic)
  const getEffectivePrice = (item: OrderItem): number => {
    // If there's a choosedPrice that's different from baseChoosedPrice, use per-unit choosedPrice
    if (item.choosedPrice && item.baseChoosedPrice && item.choosedPrice < item.baseChoosedPrice) {
      return item.choosedPrice / item.cartItemCount;
    }
    // If there's a discountPrice, use it
    if (item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price) {
      return item.discountPrice;
    }
    // Otherwise use the unit price
    return item.unitPrice || item.price;
  };

  // Get original price for comparison (before discount)
  const getOriginalPrice = (item: OrderItem): number => {
    // If baseChoosedPrice exists and is higher, use it per unit
    if (item.baseChoosedPrice && item.baseChoosedPrice > (item.choosedPrice || 0)) {
      return item.baseChoosedPrice / item.cartItemCount;
    }
    // Otherwise use the original unit price
    return item.unitPrice || item.price;
  };

  // Check if item has a discount
  const hasDiscount = (item: OrderItem): boolean => {
    const effectivePrice = getEffectivePrice(item);
    const originalPrice = getOriginalPrice(item);
    return effectivePrice < originalPrice;
  };

  // Format variation display (matching checkout page logic)
  const formatVariation = (item: OrderItem): string | null => {
    // Priority order: selectedVariation -> selectedSize -> saleQuantityStr -> purchaseOptionStr
    const variation = item.selectedVariation || item.selectedSize || item.saleQuantityStr || item.purchaseOptionStr;
    
    if (variation && variation !== "default") {
      // Use getSizeLabel if available, otherwise return the variation as-is
      return getSizeLabel ? getSizeLabel(variation) : variation;
    }
    return null;
  };

  // Format billing address for display
  const formatAddress = (billingAddress: OrderData['billingAddress']) => {
    if (!billingAddress) return null;
    
    const { firstName, lastName, address, city, state, country, pincode, phone } = billingAddress;
    return {
      name: `${firstName || ""} ${lastName || ""}`.trim(),
      addressLine: address || "",
      cityState: `${city || ""}, ${state || ""}`.replace(/^,\s*|,\s*$/g, ''),
      country: country || "",
      postalCode: pincode || "",
      phone: phone || "",
    };
  };

  // Get payment method display text
  const getPaymentMethodText = (paymentMethod: string): string => {
    const paymentTexts: { [key: string]: string } = {
      "COD": "Cash on Delivery (COD)",
      "PICK_AT_STORE": "Pick at Store",
      "RAZORPAY": "Razorpay",
      "PHONEPE": "PhonePe",
      "paypal": "PayPal Payment",
      "card": "Credit/Debit Card"
    };
    
    return paymentTexts[paymentMethod] || paymentMethod;
  };

  // Navigate to order history
  const handleViewAllOrders = () => {
    router.push("/views/pages/OrderHistory");
  };

  if (isLoading) {
    return (
      <Fragment>
        <Breadcrumb title="order-success" parent="home" />
        <section className="order-success-page order-success-section-big-py-space mt--5 bg-light">
          <div className="order-success-custom-container">
            <div className="text-center">
              <div className="spinner-border order-success-spinner" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-3">Loading order details...</p>
            </div>
          </div>
        </section>
      </Fragment>
    );
  }

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return (
      <Fragment>
        <Breadcrumb title="order-success" parent="home" />
        <section className="order-success-page order-success-section-big-py-space mt--5 bg-light">
          <div className="order-success-custom-container">
            <div className="col-sm-12">
              <div className="order-success-empty-cart-cls text-center">
                <img src="/static/images/icon-empty-cart.png" className="img-fluid mb-4" alt="Empty Cart" />
                <h3 className="mb-3">
                  <strong>No Order Found</strong>
                </h3>
                <p className="mb-4">We couldn't find your order details. This might happen if:</p>
                <ul className="text-left d-inline-block mb-4 order-success-list">
                  <li>The order data has expired</li>
                  <li>You accessed this page directly</li>
                  <li>There was an error processing your order</li>
                </ul>
                <div className="row cart-buttons">
                  <div className="col-12">
                    <button
                      onClick={() => router.push("/")}
                      className="btn btn-normal order-success-btn-primary"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={() => router.push("/pages/account/checkout")}
                      className="btn btn-normal ms-3 order-success-btn-primary"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Fragment>
    );
  }

  const address = formatAddress(orderData.billingAddress);

  return (
    <Fragment>
      <Breadcrumb title="order-success" parent="home" />
      <section className="order-success-page order-success-section-big-py-space mt--5 bg-light">
        <div className="order-success-custom-container">
          {/* Success Message */}
          <div className="row mb-4">
            <div className="col-12 text-center">
              <div className="alert p-4 order-success-alert">
                <i className="fa fa-check-circle fa-3x mb-3 order-success-icon"></i>
                <h2 className="mb-2 order-success-title">Order Placed Successfully!</h2>
                <p className="mb-0">Thank you for your order. Your order ID is <strong>{orderData.orderId}</strong></p>
              </div>
            </div>
          </div>

          <Row>
            <Col lg="6">
              <div className="order-success-product-order">
                <h3 className="order-details-title">Your Order Details</h3>
                <Row className="order-success-product-order-detail g-3">
                  {/* Headers */}
                  <Col xs="4" className="order-success-detail-header">
                    <h4 className="order-success-header-text">Product</h4>
                  </Col>
                  <Col xs="3" className="order-success-detail-header">
                    <h4 className="order-success-header-text">Qty</h4>
                  </Col>
                  <Col xs="2" className="order-success-detail-header">
                    <h4 className="order-success-header-text">Price</h4>
                  </Col>
                  <Col xs="3" className="order-success-detail-header">
                    <h4 className="order-success-header-text">Total</h4>
                  </Col>
                  
                  {/* Product Items */}
                  {orderData.items.map((item: OrderItem, i: number) => {
                    const effectivePrice = getEffectivePrice(item);
                    const originalPrice = getOriginalPrice(item);
                    const itemHasDiscount = hasDiscount(item);
                    const itemTotal = effectivePrice * item.cartItemCount;
                    const variation = formatVariation(item);
                    
                    return (
                      <Fragment key={`${item.id}_${i}`}>
                        <Col xs="4" className="order-success-detail-cell">
                          <div className="order-success-product-text-info">
                            <h6 className="mb-0 order-success-item-name">{item.name}</h6>
                            {variation && (
                              <small className="text-info order-success-item-variation">
                                Size/Option: {variation}
                              </small>
                            )}
                            {item.categoryName && (
                              <small className="text-muted order-success-item-category d-block">
                                {item.categoryName}
                              </small>
                            )}
                          </div>
                        </Col>
                        <Col xs="3" className="order-success-detail-cell">
                          <h5 className="order-success-qty-text">{item.cartItemCount}</h5>
                        </Col>
                        <Col xs="2" className="order-success-detail-cell">
                          <div>
                            <h6 className="mb-0 order-success-price-text">
                              {symbol}{(effectivePrice * value).toFixed(2)}
                            </h6>
                            {itemHasDiscount && (
                              <small className="text-muted text-decoration-line-through order-success-original-price">
                                {symbol}{(originalPrice * value).toFixed(2)}
                              </small>
                            )}
                          </div>
                        </Col>
                        <Col xs="3" className="order-success-detail-cell">
                          <h5 className="order-success-total-text">
                            {symbol}{(itemTotal * value).toFixed(2)}
                          </h5>
                          {itemHasDiscount && (
                            <small className="text-success d-block">
                              Saved: {symbol}{((originalPrice - effectivePrice) * item.cartItemCount * value).toFixed(2)}
                            </small>
                          )}
                        </Col>
                      </Fragment>
                    );
                  })}
                </Row>

                <div className="order-success-total-sec">
                  <ul>
                    <li>
                      Cart Total ({orderData.items.length} items)
                      <span>
                        {symbol}{(orderData.cartTotal * value).toFixed(2)}
                      </span>
                    </li>
                    
                    {orderData.discountAmount > 0 && (
                      <li>
                        Item Discount
                        <span className="text-success">
                          -{symbol}{(orderData.discountAmount * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {(orderData.couponDiscount || orderData.couponAmount || 0) > 0 && (
                      <li>
                        Coupon Discount
                        <span className="text-success">
                          -{symbol}{((orderData.couponDiscount || orderData.couponAmount || 0) * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.taxTotal > 0 && (
                      <li>
                        Tax
                        <span>
                          {symbol}{(orderData.taxTotal * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.packageCost > 0 && (
                      <li>
                        Package Cost
                        <span>
                          {symbol}{(orderData.packageCost * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.deliveryCost > 0 && (
                      <li>
                        Delivery Charges
                        <span>
                          {symbol}{(orderData.deliveryCost * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                    
                    {orderData.totalSavings > 0 && (
                      <li className="order-success-text-success">
                        Total Savings
                        <span>
                          -{symbol}{(orderData.totalSavings * value).toFixed(2)}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="order-success-final-total">
                  <h3 className="order-success-final-total-text">
                    Final Total
                    <span>
                      {symbol}{(orderData.finalTotal * value).toFixed(2)}
                    </span>
                  </h3>
                </div>
              </div>
            </Col>
            
            <Col lg="6">
              <div className="row order-success-sec">
                <div className="col-sm-6">
                  <h4 className="order-success-section-title">Order Summary</h4>
                  <ul className="order-success-detail-list">
                    <li><strong>Order ID:</strong> {orderData.orderId}</li>
                    <li><strong>Order Date:</strong> {dayjs(orderData.orderDate).format("DD MMM YYYY, hh:mm A")}</li>
                    <li>
                      <strong>Order Total:</strong> <span className="order-success-total-highlight">{symbol}{(orderData.finalTotal * value).toFixed(2)}</span>
                    </li>
                    {orderData.storeDetails && (
                      <li><strong>Store:</strong> {orderData.storeDetails.name}</li>
                    )}
                    {(orderData.gstNumber || orderData.orderGst) && (
                      <li><strong>GST Number:</strong> {orderData.gstNumber || orderData.orderGst}</li>
                    )}
                  </ul>
                </div>
                
                <div className="col-sm-6">
                  <h4 className="order-success-section-title">Shipping Address</h4>
                  {address ? (
                    <ul className="order-success-detail-list">
                      <li><strong>{address.name}</strong></li>
                      <li>{address.addressLine}</li>
                      <li>{address.cityState}</li>
                      {address.postalCode && <li>PIN: {address.postalCode}</li>}
                      <li>{address.country}</li>
                      {address.phone && <li><strong>Phone:</strong> {address.phone}</li>}
                    </ul>
                  ) : (
                    <p>Address information not available</p>
                  )}
                </div>
                
                <div className="col-sm-12 order-success-payment-mode">
                  <h4 className="order-success-section-title">Payment Method</h4>
                  <p className="mb-0">
                    <i className="fa fa-credit-card me-2 order-success-payment-icon"></i>
                    {getPaymentMethodText(orderData.paymentMethod || orderData.paymentMode || "")}
                  </p>
                  
                  {(orderData.paymentMethod === 'COD' || orderData.paymentMode === 'COD') && (
                    <small className="text-muted">
                      Please keep the exact amount ready for cash on delivery
                    </small>
                  )}
                  
                  {(orderData.paymentMethod === 'PICK_AT_STORE' || orderData.paymentMode === 'PICK_AT_STORE') && (
                    <small className="text-muted">
                      Please visit our store to collect your order
                    </small>
                  )}
                </div>

                <div className="col-sm-12 mt-3">
                  <div className="order-success-d-flex-gap-2-flex-wrap justify-content-center justify-content-sm-start">
                    <button
                      onClick={() => router.push("/")}
                      className="btn btn-outline-primary flex-fill flex-sm-grow-0 order-success-btn-outline"
                      onMouseEnter={(e) => {
                        e.currentTarget.classList.add('order-success-btn-outline-hover');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.classList.remove('order-success-btn-outline-hover');
                      }}
                    >
                      Continue Shopping
                    </button>
                    {/* <button
                      onClick={handleViewAllOrders}
                      className="btn btn-primary flex-fill flex-sm-grow-0 order-success-btn-primary"
                    >
                      View All Orders
                    </button> */}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </Fragment>
  );
};

export default OrderSuccessPage;