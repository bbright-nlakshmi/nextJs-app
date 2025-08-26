//wishlistpage

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useContext, useCallback } from "react";
import { NextPage } from "next";
import { useWishlistStore } from "../../../helpers/wishlist/wishlistStore";
import { CartContext } from "../../../helpers/cart/cart.context";
import { Row, Col, Table, Card, CardBody, Button, Toast, ToastHeader, ToastBody } from "reactstrap";
import Link from "next/link";
import Breadcrumb from "../../Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController, Kit } from "@/app/globalProvider";
import { WishlistProduct } from "../../../helpers/wishlist/wishlistStore";

interface KitRaw {
  id: string;
  [key: string]: any;
}

interface EnrichedWishlistItem extends WishlistProduct {
  title: string;
  img: string[];
  price: number;
  stock: number;
  isAvailable: boolean;
  cartItemId?: string;
  key?: string;
  id?: string;
  purchaseOptionStr?: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

const WishListPage: NextPage = () => {
  const { wishlistItems, removeFromWish } = useWishlistStore();
  const { addToCart } = useContext(CartContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [enrichedWishlistData, setEnrichedWishlistData] = useState<EnrichedWishlistItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const getProductById = useCallback((productId: string): any => {
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

      // Search in kits array with proper Kit handling
      if (searchController?.kits && Array.isArray(searchController.kits)) {
        const kitRaw = searchController.kits.find((k: KitRaw) => k?.id === productId);
        if (kitRaw) {
          if (Kit.fromMap && typeof Kit.fromMap === "function") {
            return Kit.fromMap(kitRaw);
          }
          return kitRaw;
        }
      }

      // Try getDetails as fallback
      if (searchController?.getDetails && typeof searchController.getDetails === "function") {
        const found = searchController.getDetails(productId, "wishlist-page");
        if (found && typeof found === "object") {
          return found;
        }
      }
    } catch (error) {
      // Silent error handling
    }

    return null;
  }, []);

  const getPrice = useCallback((item: any): number => {
    if (!item) return 0;
    
    // Check if price is directly available in the wishlist item
    if ('price' in item && typeof item.price === 'number' && item.price > 0) {
      return item.price;
    }

    // Check originalItem first
    if (item.originalItem) {
      const originalPrice = getPrice(item.originalItem);
      if (originalPrice > 0) {
        return originalPrice;
      }
    }
    
    // Try to get product data and extract price from it
    const productId = item.productId || item.Id || item.id;
    if (productId) {
      const product = getProductById(productId);
      if (product) {
        // Handle Kit pricing with getPrice method
        if (product instanceof Kit && typeof product.getPrice === "function") {
          try {
            const kitPrice = product.getPrice({ cartQuantity: 1 });
            if (typeof kitPrice === 'number' && !isNaN(kitPrice) && kitPrice > 0) {
              return kitPrice;
            }
          } catch (methodError) {
            // Silent error handling
          }
        }

        // Handle regular product pricing with getPrice method
        if (product?.getPrice && typeof product.getPrice === "function") {
          try {
            const productPrice = product.getPrice({
              cartQuantity: 1,
              purchaseOptionStr: item.purchaseOptionStr || "",
            });
            if (typeof productPrice === 'number' && !isNaN(productPrice) && productPrice > 0) {
              return productPrice;
            }
          } catch (methodError) {
            // Silent error handling
          }
        }

        // Extract price from product object properties
        const extractPriceFromProduct = (obj: any): number => {
          if (!obj || typeof obj !== 'object') return 0;

          if ('sellingPrice' in obj && typeof obj.sellingPrice === 'number' && obj.sellingPrice > 0) {
            return obj.sellingPrice;
          }

          const priceFields = ['price', 'kitPrice', 'discountPrice', 'salePrice', 'finalPrice', 'currentPrice', 'amount', 'cost', 'value'];

          for (const field of priceFields) {
            if (field in obj && typeof obj[field] === 'number' && obj[field] > 0) {
              return obj[field];
            }
          }

          // Check nested pricing objects
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

        const productPrice = extractPriceFromProduct(product);
        if (productPrice > 0) return productPrice;
      }

      // Try searchController for this specific product
      try {
        const controllerPrice = searchController.getDetails(productId, "getPrice");
        if (typeof controllerPrice === 'number' && controllerPrice > 0) {
          return controllerPrice;
        }
      } catch (error) {
        // Silent error handling
      }
    }
    
    // Direct price fields check from item
    if ('sellingPrice' in item && typeof item.sellingPrice === 'number' && item.sellingPrice > 0) {
      return item.sellingPrice;
    }

    // Method-based price extraction from item
    if ('getProductPrice' in item && typeof item.getProductPrice === 'function') {
      try {
        const price = item.getProductPrice();
        if (typeof price === 'number' && price > 0) {
          return price;
        }
      } catch (error) {
        // Silent error handling
      }
    }
    
    if ('getPrice' in item && typeof item.getPrice === 'function') {
      try {
        const price = item.getPrice();
        if (typeof price === 'number' && price > 0) {
          return price;
        }
      } catch (error) {
        // Silent error handling
      }
    }

    // Additional fallback fields from item
    const fallbackFields = ['kitPrice', 'discountPrice', 'salePrice', 'finalPrice', 'currentPrice', 'amount', 'cost', 'value'];
    for (const field of fallbackFields) {
      if (item[field] && typeof item[field] === 'number' && item[field] > 0) {
        return item[field];
      }
    }

    // Check nested objects from item
    const nestedObjects = [item.pricing, item.priceInfo, item.cost, item.priceData];
    for (const nested of nestedObjects) {
      if (typeof nested === 'number' && nested > 0) {
        return nested;
      }
      if (typeof nested === 'object' && nested !== null) {
        const nestedPrice = nested.amount || nested.value || nested.price || nested.final || nested.current;
        if (typeof nestedPrice === 'number' && nestedPrice > 0) {
          return nestedPrice;
        }
      }
    }
    
    return 0;
  }, [getProductById]);

  const getStock = useCallback((item: any): number => {
    if (!item || typeof item !== "object") return 0;
    
    // First check originalItem
    if (item.originalItem) {
      const originalStock = getStock(item.originalItem);
      if (originalStock >= 0) {
        return originalStock;
      }
    }
    
    // Try to get product data and extract stock from it
    const productId = item.productId || item.Id || item.id;
    if (productId) {
      const product = getProductById(productId);
      if (product) {
        // Handle Kit stock
        if (product instanceof Kit && typeof product.getStock === "function") {
          try {
            const kitStock = product.getStock();
            if (typeof kitStock === 'number' && kitStock >= 0) {
              return kitStock;
            }
          } catch (methodError) {
            // Silent error handling
          }
        }

        // Handle regular product stock with method
        if (product?.getStock && typeof product.getStock === "function") {
          try {
            const productStock = product.getStock();
            if (typeof productStock === 'number' && productStock >= 0) {
              return productStock;
            }
          } catch (methodError) {
            // Silent error handling
          }
        }

        // Extract stock from product object properties
        const stockFields = ['stock', 'quantity', 'inventory', 'stockQuantity', 'availableStock', 'inStock', 'stockLevel'];
        for (const field of stockFields) {
          if (typeof product[field] === "number" && product[field] >= 0) {
            return product[field];
          }
          // Handle string numbers
          if (typeof product[field] === "string" && !isNaN(Number(product[field]))) {
            const numStock = Number(product[field]);
            if (numStock >= 0) {
              return numStock;
            }
          }
        }

        // Check nested stock objects
        const nestedStock = product.stockInfo || product.inventory || product.stockData;
        if (typeof nestedStock === 'number' && nestedStock >= 0) {
          return nestedStock;
        }
        if (typeof nestedStock === 'object' && nestedStock !== null) {
          const extractedStock = nestedStock.quantity || nestedStock.available || nestedStock.stock || nestedStock.count;
          if (typeof extractedStock === 'number' && extractedStock >= 0) {
            return extractedStock;
          }
          if (typeof extractedStock === 'string' && !isNaN(Number(extractedStock))) {
            const numStock = Number(extractedStock);
            if (numStock >= 0) {
              return numStock;
            }
          }
        }
      }
    }
    
    // Check direct stock fields from wishlist item
    const stockFields = ['stock', 'quantity', 'inventory', 'stockQuantity', 'availableStock', 'inStock', 'stockLevel'];
    for (const field of stockFields) {
      if (typeof item[field] === "number" && item[field] >= 0) {
        return item[field];
      }
      // Handle string numbers
      if (typeof item[field] === "string" && !isNaN(Number(item[field]))) {
        const numStock = Number(item[field]);
        if (numStock >= 0) {
          return numStock;
        }
      }
    }

    // Method-based stock extraction from item
    if ('getStock' in item && typeof item.getStock === 'function') {
      try {
        const stockValue = item.getStock();
        if (typeof stockValue === 'number' && stockValue >= 0) {
          return stockValue;
        }
      } catch (error) {
        // Silent error handling
      }
    }

    // Check nested stock objects from item
    const nestedObjects = [item.stockInfo, item.inventory, item.stockData];
    for (const nested of nestedObjects) {
      if (typeof nested === 'number' && nested >= 0) {
        return nested;
      }
      if (typeof nested === 'object' && nested !== null) {
        const nestedStock = nested.quantity || nested.available || nested.stock || nested.count;
        if (typeof nestedStock === 'number' && nestedStock >= 0) {
          return nestedStock;
        }
        if (typeof nestedStock === 'string' && !isNaN(Number(nestedStock))) {
          const numStock = Number(nestedStock);
          if (numStock >= 0) {
            return numStock;
          }
        }
      }
    }

    // Boolean availability checks as fallback
    if (typeof item.isAvailable === 'boolean') {
      return item.isAvailable ? 999 : 0;
    }

    if (typeof item.inStock === 'boolean') {
      return item.inStock ? 999 : 0;
    }

    // Try searchController for stock info
    if (productId) {
      try {
        const controllerStock = searchController?.getDetails && searchController.getDetails(productId, "getStock");
        if (typeof controllerStock === 'number' && controllerStock >= 0) {
          return controllerStock;
        }
      } catch (error) {
        // Silent error handling
      }
    }
    
    return 999; // Default to available if no stock info found
  }, [getProductById]);

  const getProductImages = useCallback((obj: any): string[] => {
    if (!obj) return ["/images/placeholder.png"];
    
    if (obj.img && Array.isArray(obj.img) && obj.img.length > 0) {
      return obj.img;
    }
    if (obj.images && Array.isArray(obj.images) && obj.images.length > 0) {
      return obj.images;
    }
    if (obj.img && typeof obj.img === "string") {
      return [obj.img];
    }
    if (obj.image && typeof obj.image === "string") {
      return [obj.image];
    }
    if (obj.picture && typeof obj.picture === "string") {
      return [obj.picture];
    }
    
    return ["/images/placeholder.png"];
  }, []);

  useEffect(() => {
    const enrichedData = wishlistItems.map((item, index) => {
      const productId = item.productId || item.Id || item.id;
      const found = productId ? getProductById(productId) : null;
      const enriched = found && typeof found === "object" ? found : {};
      
      const productPrice = getPrice(item);
      
      let productStock = getStock(enriched);
      if (productStock === 0 || productStock === 999) {
        const itemStock = getStock(item);
        if (itemStock > 0 && itemStock !== 999) {
          productStock = itemStock;
        }
      }
      
      if (isNaN(productStock) || productStock < 0) {
        productStock = 999;
      }
      
      const productAvailability = productStock > 0;

      let productImages = getProductImages(enriched);
      if (productImages[0] === "/images/placeholder.png") {
        productImages = getProductImages(item);
      }

      return {
        ...item,
        title: enriched.title || enriched.name || item.title || item.name || "Unnamed Product",
        img: productImages,
        price: productPrice,
        stock: productStock,
        isAvailable: productAvailability,
      } as EnrichedWishlistItem;
    });

    setEnrichedWishlistData(enrichedData);
  }, [wishlistItems, getProductById, getPrice, getStock, getProductImages]);

  const handleAddToCart = useCallback((item: EnrichedWishlistItem) => {
    try {
      if (item.stock <= 0) {
        showToast('error', 'Out of Stock', `${item.title} is currently out of stock.`);
        return;
      }
      addToCart(item, 1);
      removeFromWish(item);
      showToast('success', 'Added to Cart', `${item.title} has been added to your cart and removed from wishlist.`);
    } catch (error) {
      showToast('error', 'Error', 'Failed to add item to cart.');
    }
  }, [addToCart, removeFromWish, showToast]);

  const handleRemoveFromWishlist = useCallback((item: EnrichedWishlistItem) => {
    removeFromWish(item);
    showToast('info', 'Item Removed', `${item.title} has been removed from your wishlist.`);
  }, [removeFromWish, showToast]);

  const getItemKey = (item: EnrichedWishlistItem): string => {
    return item.productId || item.cartItemId || item.key || item.id || item.title || Math.random().toString();
  };

  const renderWishlistItem = (item: EnrichedWishlistItem, isMobile = false) => {
    const price = item.price;
    const itemKey = getItemKey(item);

    if (isMobile) {
      return (
        <Card key={itemKey} className="wishlist-mobile-card mb-3 shadow-sm border-0">
          <CardBody className="p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <img 
                  src={item.img?.[0] || "/images/placeholder.png"} 
                  alt={item.title} 
                  className="wishlist-mobile-img rounded"
                  style={{ width: 80, height: 80, objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder.png";
                  }}
                />
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1 wishlist-item-title">{item.title}</h6>
                {price > 0 ? (
                  <p className="mb-0 text-muted small">
                    {symbol}{(price * value).toFixed(2)}
                  </p>
                ) : (
                  <p className="mb-0 text-muted small">Price not available</p>
                )}
              </div>
              <div className="text-end">
                <small className={item.stock > 0 ? 'text-success' : 'text-danger'}>
                  {item.stock > 0 ? "In Stock" : "Out of Stock"}
                </small>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center">
              <Button
                color="danger"
                size="sm"
                outline
                onClick={() => handleRemoveFromWishlist(item)}
                className="btn-action-sm"
              >
                <i className="ti-close me-1"></i>Remove
              </Button>
              <Button
                color="primary"
                size="sm"
                onClick={() => handleAddToCart(item)}
                disabled={item.stock <= 0}
                className="btn-action-sm"
              >
                <i className="ti-shopping-cart me-1"></i>Add to Cart
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    return (
      <tr key={itemKey} className="wishlist-table-row">
        <td className="text-center p-3">
          <img 
            src={item.img?.[0] || "/images/placeholder.png"} 
            alt={item.title} 
            className="wishlist-table-img rounded"
            style={{ width: 60, height: 60, objectFit: 'cover' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/placeholder.png";
            }}
          />
        </td>
        <td className="p-3 wishlist-item-title">
          {item.title}
        </td>
        <td className="text-center p-3 wishlist-item-price">
          {price > 0 ? (
            `${symbol}${(price * value).toFixed(2)}`
          ) : (
            <span className="text-muted">Price not available</span>
          )}
        </td>
        <td className={`text-center p-3 ${item.stock > 0 ? 'text-success' : 'text-danger'}`}>
          {item.stock > 0 ? "In Stock" : "Out of Stock"}
        </td>
        <td className="text-center p-3">
          <div className="d-flex gap-2 justify-content-center">
            <Button
              color="danger"
              size="sm"
              outline
              onClick={() => handleRemoveFromWishlist(item)}
              className="btn-action-sm"
            >
              <i className="ti-close"></i>
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={() => handleAddToCart(item)}
              disabled={item.stock <= 0}
              className="btn-action-sm"
            >
              <i className="ti-shopping-cart"></i>
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      <Breadcrumb parent="home" title="Wishlist" />
      <section className="wishlist-content section-big-py-space">
        <div className="custom-container">
          <div className="toast-container position-fixed top-0 end-0 p-3">
            {toasts.map(toast => (
              <Toast key={toast.id} isOpen={true}>
                <ToastHeader 
                  icon={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'danger' : 'info'}
                  toggle={() => removeToast(toast.id)}
                >
                  {toast.title}
                </ToastHeader>
                <ToastBody>{toast.message}</ToastBody>
              </Toast>
            ))}
          </div>

          {enrichedWishlistData.length > 0 ? (
            <>
              <div className="d-none d-lg-block">
                <Card className="wishlist-table-card shadow-sm border-0">
                  <CardBody className="p-0">
                    <div className="wishlist-scroll-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <Table responsive className="wishlist-data-table mb-0">
                        <thead className="sticky-top bg-light">
                          <tr className="wishlist-header-row">
                            <th className="text-center p-3">Image</th>
                            <th className="p-3">Product Name</th>
                            <th className="text-center p-3">Price</th>
                            <th className="text-center p-3">Availability</th>
                            <th className="text-center p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrichedWishlistData.map(item => renderWishlistItem(item))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="d-block d-lg-none">
                <div className="wishlist-mobile-scroll" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {enrichedWishlistData.map(item => renderWishlistItem(item, true))}
                </div>
              </div>

              <div className="wishlist-action-buttons mt-4">
                <div className="d-flex justify-content-between flex-wrap gap-3">
                  <Link href="/">
                    <Button color="outline-primary" size="lg" className="btn-primary-outline">
                      <i className="fa fa-arrow-left me-2"></i>Continue Shopping
                    </Button>
                  </Link>
                  <Link href="/pages/account/checkout">
                    <Button color="primary" size="lg" className="btn-primary-solid">
                      Check Out<i className="fa fa-arrow-right ms-2"></i>
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <Card className="wishlist-empty-card shadow-sm border-0">
              <CardBody className="text-center py-5">
                <i className="fa fa-heart fa-4x mb-4" style={{ color: '#00baf2' }}></i>
                <h3 className="mb-3">Your Wishlist is Empty</h3>
                <p className="text-muted mb-4">Explore more and shortlist some items.</p>
                <Link href="/">
                  <Button color="primary" className="btn-primary-solid">
                    <i className="fa fa-shopping-cart me-2"></i>Start Shopping
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </section>
    </>
  );
};

export default WishListPage;