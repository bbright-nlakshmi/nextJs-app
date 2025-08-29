import React, { useState, useContext } from "react";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartContext, CartItem } from "../../../helpers/cart/cart.context";
import Breadcrumb from "../../../views/Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController, Kit, objCache } from "@/app/globalProvider";
import { getSizeLabel } from "@/utils/Labels";
import { getProductFinalPrice } from "@/utils/price.helper";

interface KitRaw {
  id: string;
  [key: string]: any;
}

const CartPage: NextPage = () => {
  const { cartItems, updateQty, removeFromCart, updateCartItem } = React.useContext(CartContext);
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [quantityErrorKey, setQuantityErrorKey] = useState<string | null>(null);
  const router = useRouter();

  const getProductById = (productId: string): any => {
    if (!productId) return null;

    try {
      // First check objCache
      const cachedProduct = objCache.getProductById(productId);
      if (cachedProduct) return cachedProduct;

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
          sizes: Array.isArray(product?.sellingDisplayOptions) 
          ? product.sellingDisplayOptions 
          : [],
          sizePrices: Array.isArray(product?.sellingPrices) ? product.sellingPrices : [],
          uniqueSize: Array.isArray(product?.sellingDisplayOption) 
          ? product.sellingDisplayOption 
          : []
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

  // Get final price using the same logic as ProductBox
  const getFinalPrice = (item: CartItem): number => {
    if (!item) return 0;

    try {
      const product = getProductById(item.productId || item.id);
      const { sizes, sizePrices } = getProductVariations(item);
      
      // Get base price - prefer product data over item data
      const basePrice = product?.sellingPrice || product?.price || item.price || 0;
      const discount = product?.discount || item.discount || 0;
      
      // Find active size index
      const activeIndex = item.selectedSize && sizes.length 
        ? sizes.indexOf(item.selectedSize) 
        : 0;

      // Use the same price calculation logic as ProductBox
      return getProductFinalPrice({
        price: basePrice,
        discount: discount,
        sellingPrices: sizePrices,
        activeIndex: Math.max(0, activeIndex),
      });
    } catch (error) {
      return item.price || 0;
    }
  };

  const handleQtyUpdate = (item: CartItem, quantity: string) => {
    const qty = parseInt(quantity);
    if (qty >= 1 && !isNaN(qty)) {
      setQuantityErrorKey(null);
      updateQty(item, qty);
    } else {
      setQuantityErrorKey(item.cartItemId || item.key || item.id);
    }
  };

  const getSubtotal = (): number => {
    try {
      return cartItems.reduce((sum, item) => {
        const price = getFinalPrice(item);
        const itemTotal = price * (item.qty || 1) * value;
        return sum + (isNaN(itemTotal) ? 0 : itemTotal);
      }, 0);
    } catch (error) {
      return 0;
    }
  };

  const getItemKey = (item: CartItem): string => {
    return item.cartItemId || item.key || item.id || item.productId || Math.random().toString();
  };

  const handleImageClick = (item: CartItem) => {
    const productId = item.productId || item.id;
    if (productId) {
      const product = getProductById(productId);
      const isKit = product?.type === "kit";
      router.push(isKit ? `/product-details/thumbnail-left/${productId}` : `/product-details/${productId}`);
    }
  };

  const getProductSizeDisplay = (item: CartItem) => {
    const product = getProductById(item.productId || item.id);
    const productInfo = objCache.getProductById(item.productId || item.id);
    
    // Get the same data as ProductBox
    const uniqueSizes: string[] = item?.sellingDisplayOptions || product?.sellingDisplayOptions || productInfo?.sellingDisplayOptions || [];
    const uniqueSize: string[] = item?.sellingDisplayOption || product?.sellingDisplayOption || productInfo?.sellingDisplayOption || [];
    const saleMode = product?.saleMode || productInfo?.saleMode || item.saleMode;
    
    // Get the current selected size or fallback
    const currentSize = item.selectedSize || item.cartPurchaseOptionStr || uniqueSizes[0] || uniqueSize[0] || '';
    
    return {
      uniqueSizes,
      uniqueSize,
      saleMode,
      currentSize,
      displayLabel: getSizeLabel(currentSize) || currentSize || 'N/A'
    };
  };

  // Handle checkout navigation with proper data management
  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // Clear any existing buy now cache data
      if (typeof window !== 'undefined') {
        // Clear localStorage buy now data
        localStorage.removeItem('buyNowData');
        localStorage.removeItem('buyNowProduct');
        localStorage.removeItem('checkoutData');
        
        // Clear sessionStorage buy now data
        sessionStorage.removeItem('buyNowData');
        sessionStorage.removeItem('buyNowProduct');
        sessionStorage.removeItem('checkoutData');
      }

      // Prepare cart checkout data
      const checkoutData = {
        source: 'cart',
        items: cartItems.map(item => ({
          ...item,
          finalPrice: getFinalPrice(item),
          totalPrice: getFinalPrice(item) * (item.qty || 1) * value
        })),
        subtotal: getSubtotal(),
        currency: selectedCurr,
        timestamp: Date.now()
      };

      // Store cart checkout data
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cartCheckoutData', JSON.stringify(checkoutData));
      }

      // Navigate to checkout
      router.push('/pages/account/checkout');
    } catch (error) {
      console.error('Error preparing checkout data:', error);
      // Fallback navigation
      router.push('/pages/account/checkout');
    }
  };

  return (
    <>
      <Breadcrumb parent="home" title="cart" />
      <section className="cart-section section-big-py-space bg-light">
        <div className="custom-container">
          {cartItems && cartItems.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="row d-none d-lg-block">
                <div className="col-sm-12">
                  <table className="table cart-table table-responsive-xs">
                    <thead>
                      <tr className="table-head cart-table-head">
                        <th className="cart-table-header cart-table-header--image">Image</th>
                        <th className="cart-table-header cart-table-header--product">Product Name</th>
                        <th className="cart-table-header cart-table-header--price">Price</th>
                        <th className="cart-table-header cart-table-header--size">Size</th>
                        <th className="cart-table-header cart-table-header--quantity">Quantity</th>
                        <th className="cart-table-header cart-table-header--action">Action</th>
                        <th className="cart-table-header cart-table-header--total">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item: CartItem, index: number) => {
                        const price = getFinalPrice(item);
                        const itemKey = getItemKey(item);
                        const errorKey = item.cartItemId || item.key || item.id;
                        const sizeDisplay = getProductSizeDisplay(item);

                        return (
                          <tr key={itemKey} className="cart-table-row">
                            <td className="cart-table-cell cart-table-cell-center">
                              <img
                                src={item.img?.[0] || "/static/images/placeholder.png"}
                                alt="cart"
                                className="cart-product-image"
                                onClick={() => handleImageClick(item)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/static/images/placeholder.png";
                                }}
                              />
                            </td>
                            <td className="cart-table-cell">
                              <div>
                                <span className="cart-product-name" onClick={() => handleImageClick(item)}>
                                  {item.name || "Unknown Product"}
                                </span>
                              </div>
                            </td>
                            <td className="cart-table-cell cart-table-cell-center">
                              <span className="cart-product-price">
                                {symbol}{price.toFixed(2)}
                              </span>
                            </td>
                            <td className="cart-table-cell cart-table-cell-center">
                              <div className="cart-size-display">
                                {sizeDisplay.displayLabel}
                              </div>
                            </td>
                            <td className="cart-table-cell cart-table-cell-center">
                              <input
                                type="number"
                                min="1"
                                value={item.qty || 1}
                                onChange={(e) => handleQtyUpdate(item, e.target.value)}
                                className={`form-control input-number cart-quantity-input ${quantityErrorKey === errorKey ? 'cart-quantity-input--error' : ''}`}
                              />
                            </td>
                            <td className="cart-table-cell cart-table-cell-center">
                              <button
                                className="btn btn-sm btn-outline-danger cart-remove-btn"
                                onClick={() => removeFromCart(item)}
                                aria-label="Remove item"
                              >
                                <i className="ti-close"></i>
                              </button>
                            </td>
                            <td className="cart-table-cell cart-table-cell-center">
                              <span className="cart-total-price">
                                {symbol}{(price * (item.qty || 1) * value).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Simplified Total Section */}
                  <div className="row mt-4">
                    <div className="col-lg-8"></div>
                    <div className="col-lg-4">
                      <div className="card shadow-sm">
                        <div className="card-body cart-total-section">
                          <div className="d-flex justify-content-between align-items-center">
                            <h4 className="mb-0 cart-total-label">
                              Total Amount:
                            </h4>
                            <h3 className="mb-0 cart-total-amount">
                              {symbol}{getSubtotal().toFixed(2)}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile and Tablet View */}
              <div className="row d-block d-lg-none">
                <div className="col-12">
                  {cartItems.map((item: CartItem, index: number) => {
                    const price = getFinalPrice(item);
                    const itemTotal = price * (item.qty || 1) * value;
                    const itemKey = getItemKey(item);
                    const errorKey = item.cartItemId || item.key || item.id;
                    const sizeDisplay = getProductSizeDisplay(item);

                    return (
                      <div key={itemKey} className="card mb-3 shadow-sm cart-mobile-item">
                        <div className="card-body">
                          <div className="row align-items-center mb-3">
                            <div className="col-3 col-sm-2">
                              <img
                                src={item.img?.[0] || "/static/images/placeholder.png"}
                                alt="cart"
                                className="cart-mobile-image"
                                onClick={() => handleImageClick(item)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/static/images/placeholder.png";
                                }}
                              />
                            </div>
                            <div className="col-6 col-sm-7">
                              <h6 className="cart-mobile-product-name"
                                  onClick={() => handleImageClick(item)}>
                                {item.name || "Unknown Product"}
                              </h6>
                              <p className="cart-mobile-price">
                                Unit Price: {symbol}{price.toFixed(2)}
                              </p>
                            </div>
                            <div className="col-3 col-sm-3 text-right">
                              <button
                                className="btn btn-sm btn-outline-danger cart-mobile-remove-btn"
                                onClick={() => removeFromCart(item)}
                                aria-label="Remove item"
                              >
                                <i className="ti-close"></i>
                              </button>
                            </div>
                          </div>

                          {/* Size Display for Mobile - Read Only */}
                          <div className="row mb-3">
                            <div className="col-12">
                              <label className="cart-mobile-label">Size:</label>
                              <div className="cart-mobile-size-display">
                                {sizeDisplay.displayLabel}
                              </div>
                            </div>
                          </div>

                          <div className="row align-items-center">
                            <div className="col-6">
                              <div className="form-group mb-0">
                                <label className="cart-mobile-label">Quantity:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty || 1}
                                  onChange={(e) => handleQtyUpdate(item, e.target.value)}
                                  className={`form-control form-control-sm cart-mobile-quantity-input ${quantityErrorKey === errorKey ? 'cart-mobile-quantity-input--error' : ''}`}
                                />
                                {quantityErrorKey === errorKey && (
                                  <small className="text-danger">Please enter a valid quantity</small>
                                )}
                              </div>
                            </div>
                            <div className="col-6 text-right">
                              <div>
                                <small className="text-muted d-block">Total</small>
                                <strong className="cart-mobile-item-total">
                                  {symbol}{itemTotal.toFixed(2)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Mobile Total */}
                  <div className="card shadow-sm">
                    <div className="card-body cart-mobile-total-section">
                      <div className="row">
                        <div className="col-12 text-center">
                          <h3 className="cart-mobile-total-amount">
                            Total: {symbol}{getSubtotal().toFixed(2)}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons with Fixed Checkout Handler */}
              <div className="row cart-buttons mt-4">
                <div className="col-12">
                  <div className="d-none d-md-flex justify-content-between">
                    <Link href="/" className="btn btn-outline-primary btn-lg continue-shopping-btn">
                      <i className="fa fa-arrow-left mr-2"></i>
                      Continue Shopping
                    </Link>
                    <Link href="/pages/account/checkout" className="btn btn-primary btn-lg checkout-btn"
                          onClick={handleCheckoutClick}>
                      Check Out
                      <i className="fa fa-arrow-right ml-2"></i>
                    </Link>
                  </div>

                  <div className="d-block d-md-none">
                    <div className="d-grid gap-3">
                      <Link href="/pages/account/checkout" className="btn btn-primary btn-lg checkout-btn-mobile"
                            onClick={handleCheckoutClick}>
                        Check Out
                        <i className="fa fa-arrow-right ml-2"></i>
                      </Link>
                      <Link href="/" className="btn btn-outline-primary btn-lg continue-shopping-btn-mobile">
                        <i className="fa fa-arrow-left mr-2"></i>
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-sm-12 empty-cart-cls text-center">
              <div className="empty-cart-content">
                <img
                  src="/static/images/icon-empty-cart.png"
                  className="img-fluid mb-4 empty-cart-image"
                  alt="empty cart"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                <h3 className="empty-cart-title mb-3">
                  Your Cart is Empty
                </h3>
                <p className="empty-cart-subtitle text-muted mb-4">
                  Explore our products and add some items to your cart.
                </p>
                <Link href="/" className="btn btn-primary btn-lg continue-shopping-empty">
                  <i className="fa fa-shopping-cart mr-2"></i>
                  Start Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CartPage;