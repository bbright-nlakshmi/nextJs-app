import React, { useState } from "react";
import { NextPage } from "next";
import Link from "next/link";
import { CartContext, CartItem } from "../../../helpers/cart/cart.context";
import Breadcrumb from "../../../views/Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController, Kit, objCache } from "@/app/globalProvider";
import { getProductFinalPrice } from "@/utils/price.helper";
import { getSizeLabel } from "@/utils/Labels";

interface KitRaw {
  id: string;
  [key: string]: any;
}

const CartPage: NextPage = () => {
  const { cartItems, updateQty, removeFromCart, isProductInCart } = React.useContext(CartContext);
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [quantityErrorKey, setQuantityErrorKey] = useState<string | null>(null);

  const getProductById = (productId: string): any => {
    if (!productId) return null;

    try {
      // First try objCache
      const cachedProduct = objCache?.getProductById(productId);
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
      console.error("Error finding product:", error);
    }

    return null;
  };

  // Get product variations (sizes/options)
  const getProductVariations = (item: CartItem): { sizes: string[], sizePrices: number[] } => {
    try {
      const product = getProductById(item.productId || item.id);
      
      if (product) {
        const uniqueSize = product?.sellingDisplayOptions || [];
        const sizePrices = product?.sellingPrices || [];
        
        return {
          sizes: Array.isArray(uniqueSize) ? uniqueSize : [],
          sizePrices: Array.isArray(sizePrices) ? sizePrices : []
        };
      }
      
      // Fallback to item's own variation data
      return {
        sizes: item?.sellingDisplayOptions || [],
        sizePrices: item?.sellingPrices || []
      };
    } catch (error) {
      return { sizes: [], sizePrices: [] };
    }
  };

  const getPrice = (item: CartItem): number => {
    if (!item) return 0;

    try {
      const product = getProductById(item.productId || item.id);
      const { sizes, sizePrices } = getProductVariations(item);
      
      // If item has selected size and variations exist, calculate price based on variation
      if (item.selectedSize && sizes.length && sizePrices.length) {
        const sizeIndex = sizes.indexOf(item.selectedSize);
        if (sizeIndex >= 0 && sizeIndex < sizePrices.length) {
          const basePrice = product?.price || item.price || 0;
          return getProductFinalPrice({
            price: basePrice,
            discount: product?.discount || item.discount,
            sellingPrices: sizePrices,
            activeIndex: sizeIndex,
          });
        }
      }
      
      if (product) {
        if (product instanceof Kit && typeof product.getPrice === "function") {
          try {
            const price = product.getPrice({ cartQuantity: item.qty });
            if (typeof price === 'number' && !isNaN(price) && price > 0) {
              return price;
            }
          } catch (methodError) {
            console.warn("Kit getPrice method failed:", methodError);
          }
        }
        
        if (product?.getPrice && typeof product.getPrice === "function") {
          try {
            const price = product.getPrice({
              cartQuantity: item.qty,
              purchaseOptionStr: item.purchaseOptionStr || "",
            });
            if (typeof price === 'number' && !isNaN(price) && price > 0) {
              return price;
            }
          } catch (methodError) {
            console.warn("Product getPrice method failed:", methodError);
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
      console.error("Price extraction error:", err);
      return item.price || 0;
    }
  };

  // Handle size/variation change
  const handleVariationChange = (item: CartItem, newSize: string) => {
    if (!newSize) return;
    
    try {
      const { sizes, sizePrices } = getProductVariations(item);
      const sizeIndex = sizes.indexOf(newSize);
      
      if (sizeIndex >= 0) {
        const product = getProductById(item.productId || item.id);
        const basePrice = product?.price || item.price || 0;
        
        const newPrice = getProductFinalPrice({
          price: basePrice,
          discount: product?.discount || item.discount,
          sellingPrices: sizePrices,
          activeIndex: sizeIndex,
        });

        // Update cart item with new variation
        const updatedItem = {
          ...item,
          selectedSize: newSize,
          price: newPrice
        };

        // If updateCartItemVariation exists, use it, otherwise use updateQty
        if (updateCartItemVariation && typeof updateCartItemVariation === 'function') {
          updateCartItemVariation(item, updatedItem);
        } else {
          // Fallback: remove old item and add new one (if no direct variation update method)
          removeFromCart(item);
          // Note: This would need to be handled by the cart context to add the updated item
        }
      }
    } catch (error) {
      console.error('Error updating variation:', error);
    }
  };

  // Fixed quantity update handler with proper item identification
  const handleQtyUpdate = (item: CartItem, quantity: string) => {
    const qty = parseInt(quantity);
    const itemKey = getUniqueItemKey(item);
    
    if (qty >= 1 && !isNaN(qty)) {
      setQuantityErrorKey(null);
      updateQty(item, qty); // Pass the full CartItem object
    } else {
      setQuantityErrorKey(itemKey);
    }
  };

  // Handle product image click to redirect to product details
  const handleProductImageClick = (item: CartItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productId = item.productId || item.id;
    if (productId) {
      const product = getProductById(productId);
      const isKit = product?.type === "kit" || item.type === "kit";
      
      if (isKit) {
        router.push(`/product-details/thumbnail-left/${productId}`);
      } else {
        router.push(`/product-details/${productId}`);
      }
    }
  };

  const getSubtotal = (): number => {
    try {
      return cartItems.reduce((sum, item) => {
        const price = getPrice(item);
        const itemTotal = price * (item.qty || 1) * value;
        return sum + (isNaN(itemTotal) ? 0 : itemTotal);
      }, 0);
    } catch (error) {
      console.error("Subtotal calculation error:", error);
      return 0;
    }
  };

  // Enhanced helper function to get unique identifier for item
  const getUniqueItemKey = (item: CartItem): string => {
    const parts = [
      item.cartItemId,
      item.key, 
      item.id,
      item.productId,
      item.purchaseOptionStr,
      item.variantId,
      item.selectedVariant?.id,
      item.selectedSize
    ].filter(Boolean);
    
    if (parts.length > 0) {
      return parts.join('_');
    }
    
    return `${item.name || 'unknown'}_${item.productId || item.id || Math.random().toString()}`;
  };

  const getErrorKey = (item: CartItem): string => {
    return getUniqueItemKey(item);
  };

  // Clear any existing checkout mode data to ensure cart checkout
  const clearCheckoutModeData = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('checkoutMode');
      window.sessionStorage.removeItem('buyNowProduct');
      window.sessionStorage.setItem('checkoutMode', 'cart');
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
                        <th style={{ 
                          width: '100px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Image</th>
                        <th style={{ 
                          width: '250px', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Product Name</th>
                        <th style={{ 
                          width: '120px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Price</th>
                        <th style={{ 
                          width: '120px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Size</th>
                        <th style={{ 
                          width: '120px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Quantity</th>
                        <th style={{ 
                          width: '100px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Action</th>
                        <th style={{ 
                          width: '120px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item: CartItem, index: number) => {
                        const price = getPrice(item);
                        const total = price * value;
                        const itemKey = getUniqueItemKey(item);
                        const errorKey = getErrorKey(item);
                        const { sizes } = getProductVariations(item);

                        return (
                          <tr key={itemKey}>
                            <td className="cart-table-cell-center">
                              <img 
                                src={item.img?.[0] || "/static/images/placeholder.png"} 
                                alt="cart" 
                                className="cart-product-image"
                                style={{ 
                                  cursor: 'pointer',
                                  width: '60px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid #eee'
                                }}
                                onClick={(e) => handleProductImageClick(item, e)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/static/images/placeholder.png";
                                }}
                              />
                            </td>
                            <td className="cart-table-cell">
                              <div>
                                <span className="cart-product-name">
                                  {item.name || "Unknown Product"}
                                </span>
                              </div>
                            </td>
                            <td className="cart-table-cell-center">
                              <span className="cart-product-price">
                                {symbol}{price.toFixed(2)}
                              </span>
                            </td>
                            <td className="cart-table-cell-center">
                              {sizes.length > 0 ? (
                                <select
                                  value={item.selectedSize || sizes[0] || ""}
                                  onChange={(e) => handleVariationChange(item, e.target.value)}
                                  className="form-control"
                                  style={{
                                    width: "90px",
                                    margin: '0 auto',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    fontSize: '12px'
                                  }}
                                >
                                  {sizes.map((size, i) => (
                                    <option key={i} value={size}>
                                      {getSizeLabel(size)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="cart-table-cell-center">
                              <input
                                type="number"
                                min="1"
                                value={item.qty || 1}
                                onChange={(e) => handleQtyUpdate(item, e.target.value)}
                                className="form-control input-number"
                                style={{
                                  width: "70px",
                                  margin: '0 auto',
                                  textAlign: 'center',
                                  borderColor: quantityErrorKey === errorKey ? "red" : "#ddd",
                                  borderRadius: '6px',
                                  padding: '8px'
                                }}
                              />
                            </td>
                            <td className="cart-table-cell-center">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFromCart(item)}
                                style={{
                                  border: '1px solid #dc3545',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  backgroundColor: 'transparent',
                                  color: '#dc3545',
                                  transition: 'all 0.3s ease',
                                  minWidth: '35px',
                                  height: '32px'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#dc3545';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#dc3545';
                                }}
                                aria-label="Remove item"
                              >
                                <i className="ti-close"></i>
                              </button>
                            </td>
                            <td className="cart-table-cell-center">
                              <span className="cart-total-price">
                                {symbol}{(price * (item.qty || 1) * value).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <table className="table cart-table table-responsive-md">
                    <tfoot>
                      <tr>
                        <td className="cart-summary-cell">
                          Total Price:
                        </td>
                        <td className="cart-summary-container">
                          <h2 className="cart-total-amount">
                            {symbol}{getSubtotal().toFixed(2)}
                          </h2>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Mobile and Tablet View */}
              <div className="row d-block d-lg-none">
                <div className="col-12">
                  {cartItems.map((item: CartItem, index: number) => {
                    const price = getPrice(item);
                    const itemTotal = price * (item.qty || 1) * value;
                    const itemKey = getUniqueItemKey(item);
                    const errorKey = getErrorKey(item);
                    const { sizes } = getProductVariations(item);

                    return (
                      <div key={itemKey} className="card mb-3 shadow-sm">
                        <div className="card-body">
                          {/* Top Row - Image, Name, Remove Button */}
                          <div className="row align-items-center mb-3">
                            <div className="col-3 col-sm-2">
                              <img 
                                src={item.img?.[0] || "/static/images/placeholder.png"} 
                                alt="cart" 
                                className="img-fluid rounded"
                                style={{ 
                                  width: '100%', 
                                  maxWidth: '60px', 
                                  height: '60px', 
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  border: '1px solid #eee'
                                }}
                                onClick={(e) => handleProductImageClick(item, e)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/static/images/placeholder.png";
                                }}
                              />
                            </div>
                            <div className="col-6 col-sm-7">
                              <h6 className="mb-1 font-weight-bold">{item.name || "Unknown Product"}</h6>
                              <p className="text-muted mb-0 small">Unit Price: {symbol}{price.toFixed(2)}</p>
                              {item.selectedSize && (
                                <p className="text-info mb-0 small">Size: {getSizeLabel(item.selectedSize)}</p>
                              )}
                            </div>
                            <div className="col-3 col-sm-3 text-right">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFromCart(item)}
                                aria-label="Remove item"
                              >
                                <i className="ti-close"></i>
                              </button>
                            </div>
                          </div>

                          {/* Size Selection Row (if sizes available) */}
                          {sizes.length > 0 && (
                            <div className="row mb-3">
                              <div className="col-12">
                                <div className="form-group mb-0">
                                  <label className="small text-muted mb-1">Size:</label>
                                  <select
                                    value={item.selectedSize || sizes[0] || ""}
                                    onChange={(e) => handleVariationChange(item, e.target.value)}
                                    className="form-control"
                                    style={{ maxWidth: '120px' }}
                                  >
                                    {sizes.map((size, i) => (
                                      <option key={i} value={size}>
                                        {getSizeLabel(size)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bottom Row - Quantity and Total */}
                          <div className="row align-items-center">
                            <div className="col-6">
                              <div className="form-group mb-0">
                                <label className="small text-muted mb-1">Quantity:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty || 1}
                                  onChange={(e) => handleQtyUpdate(item, e.target.value)}
                                  className="form-control form-control-sm"
                                  style={{
                                    borderColor: quantityErrorKey === errorKey ? "red" : undefined,
                                    maxWidth: '80px'
                                  }}
                                />
                                {quantityErrorKey === errorKey && (
                                  <small className="text-danger">Please enter a valid quantity</small>
                                )}
                              </div>
                            </div>
                            <div className="col-6 text-right">
                              <div>
                                <small className="text-muted d-block">Total</small>
                                <strong className="h6 mb-0">{symbol}{itemTotal.toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Mobile Total Section */}
                  <div className="card">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-12 text-center">
                          <h4 className="mb-0">Total Price: {symbol}{getSubtotal().toFixed(2)}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Vertical Stack on Mobile */}
              <div className="row cart-buttons mt-4">
                <div className="col-12">
                  {/* Desktop - Side by Side */}
                  <div className="d-none d-md-flex justify-content-between">
                    <Link href="/" className="btn btn-outline-primary btn-lg continue-shopping-btn">
                      <i className="fa fa-arrow-left mr-2"></i>
                      Continue Shopping
                    </Link>
                    <Link href="/pages/account/checkout" className="btn btn-primary btn-lg checkout-btn">
                      Check Out
                      <i className="fa fa-arrow-right ml-2"></i>
                    </Link>
                  </div>

                  {/* Mobile - Vertical Stack */}
                  <div className="d-block d-md-none">
                    <div className="d-grid gap-3">
                      <Link href="/pages/account/checkout" className="btn btn-primary btn-lg checkout-btn-mobile">
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
                  style={{ maxWidth: '200px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                <h3 className="empty-cart-title mb-3">
                  <strong>Your Cart is Empty</strong>
                </h3>
                <p className="empty-cart-subtitle text-muted mb-4">
                  Explore more and shortlist some items.
                </p>
                <Link href="/" className="btn btn-primary btn-lg continue-shopping-empty">
                  <i className="fa fa-shopping-cart mr-2"></i>
                  Continue Shopping
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