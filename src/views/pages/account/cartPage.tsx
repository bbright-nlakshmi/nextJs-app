/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { NextPage } from "next";
import Link from "next/link";
import { CartContext } from "../../../helpers/cart/cart.context";
import Breadcrumb from "../../../views/Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController , Kit} from "@/app/globalProvider";


// Define proper interfaces
interface KitRaw {
  id: string;
  [key: string]: any;
}

interface SearchController {
  allProducts?: Map<string, any[]>;
  kits?: KitRaw[] | null | undefined;
}

const CartPage: NextPage = () => {
  const { cartItems, updateQty, removeFromCart } = React.useContext(CartContext);
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [quantityErrorKey, setQuantityErrorKey] = useState<string | null>(null);

  // ✅ Fixed getProductById with proper null checks and error handling
  const getProductById = (productId: string): any => {
    if (!productId) return null;

    try {
      // Search in allProducts Map
      if (searchController?.allProducts instanceof Map) {
        for (const products of searchController.allProducts.values()) {
          if (Array.isArray(products)) {
            const product = products.find((p: any) => p?.id === productId);
            if (product) return product;
          }
        }
      }

      // Search in kits array with proper null checks
      if (searchController?.kits && Array.isArray(searchController.kits)) {
        const kitRaw = searchController.kits.find((k: KitRaw) => k?.id === productId);
        if (kitRaw) {
          //const kit = new Kit();
          // Safe method call with optional chaining
          if (Kit.fromMap && typeof Kit.fromMap === "function") {
           
            return  Kit.fromMap(kitRaw);
          }
        }
      }
    } catch (error) {
      console.error("Error finding product:", error);
    }

    return null;
  };

  // ✅ Enhanced getPrice function - matches the working price ranges logic
  const getPrice = (item: any): number => {
    if (!item) return 0;

    try {
      // First try to get the product/kit from the system
      const product = getProductById(item.productId);
      
      // If we have the product, try to get price from it using methods first
      if (product) {
        // Try Kit getPrice method
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
        
        // Try Product getPrice method
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

      // Enhanced price extraction - same logic as working PriceRanges component
      const extractPriceFromObject = (obj: any): number => {
        if (!obj || typeof obj !== 'object') return 0;

        // Check standard price fields first
        if ('price' in obj && typeof obj.price === 'number' && obj.price > 0) {
          return obj.price;
        }

        // Check Kit-specific price fields
        if ('kitPrice' in obj && typeof obj.kitPrice === 'number' && obj.kitPrice > 0) {
          return obj.kitPrice;
        }

        // Check for discount price (prioritize over original price)
        if (obj.discountPrice && typeof obj.discountPrice === 'number' && obj.discountPrice > 0) {
          return obj.discountPrice;
        }

        // Check for sale price
        if (obj.salePrice && typeof obj.salePrice === 'number' && obj.salePrice > 0) {
          return obj.salePrice;
        }

        // Check for finalPrice
        if (obj.finalPrice && typeof obj.finalPrice === 'number' && obj.finalPrice > 0) {
          return obj.finalPrice;
        }

        // Check for currentPrice
        if (obj.currentPrice && typeof obj.currentPrice === 'number' && obj.currentPrice > 0) {
          return obj.currentPrice;
        }

        // Check for sellingPrice
        if (obj.sellingPrice && typeof obj.sellingPrice === 'number' && obj.sellingPrice > 0) {
          return obj.sellingPrice;
        }

        // Try extracting from nested price objects
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

      // Try to extract price from the found product first
      if (product) {
        const productPrice = extractPriceFromObject(product);
        if (productPrice > 0) {
          return productPrice;
        }
      }

      // Try to extract price from the cart item itself
      const itemPrice = extractPriceFromObject(item);
      if (itemPrice > 0) {
        return itemPrice;
      }

      // Final fallback - check if item has a direct price property
      if (typeof item.price === 'number' && item.price > 0) {
        return item.price;
      }

      console.warn("Could not extract valid price for cart item:", {
        productId: item.productId,
        itemName: item.name,
        item: item
      });
      
      return 0;
    } catch (err) {
      console.error("Price extraction error:", err);
      return item.price || 0;
    }
  };

  const handleQtyUpdate = (item: any, quantity: string) => {
    const qty = parseInt(quantity);
    if (qty >= 1 && !isNaN(qty)) {
      setQuantityErrorKey(null);
      updateQty(item, qty);
    } else {
      setQuantityErrorKey(item.key);
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

  return (
    <>
      <Breadcrumb parent="home" title="cart" />
      <section className="cart-section section-big-py-space bg-light">
        <div className="custom-container">
          {cartItems && cartItems.length > 0 ? (
            <>
              <div className="row">
                <div className="col-sm-12">
                  <table className="table cart-table table-responsive-xs">
                    <thead>
                      <tr className="table-head">
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Action</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item: any, index: number) => {
                        const price = getPrice(item);
                        const total = price * value;

                        return (
                          <tr key={item.key || index}>
                            <td>
                              <img 
                                src={item.img?.[0] || "/static/images/placeholder.png"} 
                                alt="cart" 
                                style={{ width: 60 }} 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/static/images/placeholder.png";
                                }}
                              />
                            </td>
                            <td>{item.name || "Unknown Product"}</td>
                            <td>
                              {symbol}
                              {price.toFixed(2)}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                value={item.qty || 1}
                                onChange={(e) => handleQtyUpdate(item, e.target.value)}
                                className="form-control input-number"
                                style={{
                                  width: "80px",
                                  borderColor:
                                    quantityErrorKey === item.key ? "red" : undefined,
                                }}
                              />
                            </td>
                            <td>
                              <a
                                href="#"
                                className="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeFromCart(item);
                                }}
                              >
                                <i className="ti-close"></i>
                              </a>
                            </td>
                            <td>
                              {symbol}
                              {(price * (item.qty || 1) * value).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <table className="table cart-table table-responsive-md">
                    <tfoot>
                      <tr>
                        <td>Total Price:</td>
                        <td>
                          <h2>
                            {symbol}
                            {getSubtotal().toFixed(2)}
                          </h2>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="row cart-buttons">
                <div className="col-12">
                  <Link href="/" className="btn btn-normal">
                    Continue Shopping
                  </Link>
                  <Link href="/pages/account/checkout" className="btn btn-normal ms-3">
                    Check Out
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="col-sm-12 empty-cart-cls text-center">
              <img
                src="/static/images/icon-empty-cart.png"
                className="img-fluid mb-4"
                alt="empty cart"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <h3>
                <strong>Your Cart is Empty</strong>
              </h3>
              <h4>Explore more and shortlist some items.</h4>
              <Link href="/" className="btn btn-solid mt-4">
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CartPage;