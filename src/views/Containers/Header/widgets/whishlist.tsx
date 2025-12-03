// wishlist 

/* eslint-disable @next/next/no-img-element */
import React, { useState, useContext, useEffect, useCallback } from "react";
import { NextPage } from "next";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { searchController, Kit } from "@/app/globalProvider";
import router from "next/router";

interface EnrichedWishlistItem {
  uuid?: string;
  productId: string;
  variantId?: string;
  title: string;
  type: string;
  img: string[];
  price: number;
  stock: number;
  isAvailable: boolean;
  originalItem: any;
}

interface KitRaw {
  id: string;
  [key: string]: any;
}

const Wishlist: NextPage = () => {
  const [openWishlist, setOpenWishlist] = useState(false);
  const [enrichedWishlistData, setEnrichedWishlistData] = useState<EnrichedWishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { wishlistItems, removeFromWish } = useContext(WishlistContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const totalItem = wishlistItems?.length || 0;
  const { t } = useTranslation("common");

  const getProductById = useCallback((productId: string): any => {
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
          return Kit.fromMap && typeof Kit.fromMap === "function" ? Kit.fromMap(kitRaw) : kitRaw;
        }
      }

      if (searchController?.getDetails && typeof searchController.getDetails === "function") {
        const found = searchController.getDetails(productId, "wishlist-sidebar");
        if (found && typeof found === "object") return found;
      }
    } catch (error) {
      // Silent error handling
    }

    return null;
  }, []);

  const getPrice = useCallback((item: any): number => {
    if (!item) return 0;
    
    if ('price' in item && typeof item.price === 'number' && item.price > 0) {
      return item.price;
    }

    if (item.originalItem) {
      const originalPrice = getPrice(item.originalItem);
      if (originalPrice > 0) return originalPrice;
    }
    
    const productId = item.productId || item.Id || item.id;
    if (productId) {
      const product = getProductById(productId);
      if (product) {
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

      try {
        const controllerPrice = searchController.getDetails(productId, "getPrice");
        if (typeof controllerPrice === 'number' && controllerPrice > 0) {
          return controllerPrice;
        }
      } catch (error) {
        // Silent error handling
      }
    }
    
    if ('sellingPrice' in item && typeof item.sellingPrice === 'number' && item.sellingPrice > 0) {
      return item.sellingPrice;
    }

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

    const fallbackFields = ['kitPrice', 'discountPrice', 'salePrice', 'finalPrice', 'currentPrice', 'amount', 'cost', 'value'];
    for (const field of fallbackFields) {
      if (item[field] && typeof item[field] === 'number' && item[field] > 0) {
        return item[field];
      }
    }

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
    if (!item || typeof item !== "object") return 999;
    
    if (item.originalItem) {
      const originalStock = getStock(item.originalItem);
      if (originalStock >= 0) return originalStock;
    }
    
    const productId = item.productId || item.Id || item.id;
    if (productId) {
      const product = getProductById(productId);
      if (product) {
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

        const stockFields = ['stock', 'quantity', 'inventory', 'stockQuantity', 'availableStock', 'inStock', 'stockLevel'];
        for (const field of stockFields) {
          if (typeof product[field] === "number" && product[field] >= 0) {
            return product[field];
          }
          
          if (typeof product[field] === "string" && !isNaN(Number(product[field]))) {
            const numStock = Number(product[field]);
            if (numStock >= 0) return numStock;
          }
        }

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
            if (numStock >= 0) return numStock;
          }
        }
      }
    }
    
    const stockFields = ['stock', 'quantity', 'inventory', 'stockQuantity', 'availableStock', 'inStock', 'stockLevel'];
    for (const field of stockFields) {
      if (typeof item[field] === "number" && item[field] >= 0) {
        return item[field];
      }
      
      if (typeof item[field] === "string" && !isNaN(Number(item[field]))) {
        const numStock = Number(item[field]);
        if (numStock >= 0) return numStock;
      }
    }

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
          if (numStock >= 0) return numStock;
        }
      }
    }

    if (typeof item.isAvailable === 'boolean') {
      return item.isAvailable ? 999 : 0;
    }

    if (typeof item.inStock === 'boolean') {
      return item.inStock ? 999 : 0;
    }

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
    
    return 999;
  }, [getProductById]);

  const getProductImages = useCallback((obj: any): string[] => {
    if (!obj) return ["/images/placeholder.png"];
    
    if (obj.img && Array.isArray(obj.img) && obj.img.length > 0) return obj.img;
    if (obj.images && Array.isArray(obj.images) && obj.images.length > 0) return obj.images;
    if (obj.img && typeof obj.img === "string") return [obj.img];
    if (obj.image && typeof obj.image === "string") return [obj.image];
    if (obj.picture && typeof obj.picture === "string") return [obj.picture];
    
    return ["/images/placeholder.png"];
  }, []);

  useEffect(() => {
    if (!wishlistItems || wishlistItems.length === 0) {
      setEnrichedWishlistData([]);
      return;
    }

    setIsLoading(true);

    try {
      const enrichedData = wishlistItems.map((item: any, index: number) => {
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
          uuid: item.uuid,
          productId: item.productId,
          variantId: item.variantId,
          title: enriched.title || enriched.name || item.title || item.name || "Unnamed Product",
          type: enriched.type || enriched.category || item.type || "General",
          img: productImages,
          price: productPrice,
          stock: productStock,
          isAvailable: productAvailability,
          originalItem: item,
        } as EnrichedWishlistItem;
      });

      setEnrichedWishlistData(enrichedData);
    } catch (error) {
      setEnrichedWishlistData([]);
    } finally {
      setIsLoading(false);
    }
  }, [wishlistItems, getProductById, getPrice, getStock, getProductImages]);

  const handleRemoveFromWishlist = useCallback((item: EnrichedWishlistItem) => {
    try {
      if (removeFromWish && typeof removeFromWish === "function") {
        removeFromWish(item.originalItem);
      }
    } catch (error) {
      // Silent error handling
    }
  }, [removeFromWish]);

  const formatPrice = useCallback((price: number): string => {
    try {
      const convertedPrice = price * (value || 1);
      return `${symbol || "$"}${convertedPrice.toFixed(2)}`;
    } catch (error) {
      return `$${price.toFixed(2)}`;
    }
  }, [symbol, value]);

  const toggleWishlist = () => setOpenWishlist(!openWishlist);
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenWishlist(false);
  };
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenWishlist(false);
  };

  return (
    <>
      <li className="mobile-wishlist item-count" onClick={toggleWishlist}>
        <a>
          <i className="icon-heart"></i>
          <div className="item-count-contain">{totalItem}</div>
        </a>
      </li>

      <div id="wishlist_side" className={`add_to_cart right ${openWishlist ? "open-side" : ""}`}>
        <div className="overlay" onClick={handleOverlayClick}></div>
        <div className="cart-inner">
          <div className="cart_top">
            <h3>My Wishlist</h3>
            <div className="close-cart" onClick={handleCloseClick}>
              <button type="button" className="btn-close" aria-label="Close wishlist">
                <i className="fa fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : enrichedWishlistData && enrichedWishlistData.length > 0 ? (
            <div className="cart_media">
              <ul className="cart_product">
                {enrichedWishlistData.map((item: EnrichedWishlistItem, index: number) => (
                  <li key={item.uuid || item.productId || index}>
                    <div className="media">
                      <a href={`/product/${item.productId}`}>
                        <img
                          src={item.img?.[0] || "/images/placeholder.png"}
                          onClick={() => router.push(`/product-details/${item.productId}`)}
                          alt={item.title}
                          className="me-3"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/placeholder.png";
                          }}
                        />
                      </a>
                      <div className="media-body">
                        <Link href={`/product/${item.productId}`}>
                          <h4 title={item.title}>
                            {item.title.length > 30 ? `${item.title.substring(0, 30)}...` : item.title}
                          </h4>
                        </Link>
                        <h4 className="theme-color">
                          <span>{item.type}</span>
                        </h4>
                        {item.price > 0 ? (
                          <h5><span>{formatPrice(item.price)}</span></h5>
                        ) : (
                          <h5><span className="text-muted">Price not available</span></h5>
                        )}
                        {item.stock <= 0 && (
                          <small className="text-danger">Out of Stock</small>
                        )}
                        {item.stock > 0 && item.stock < 10 && (
                          <small className="text-warning">Low Stock ({item.stock} left)</small>
                        )}
                      </div>
                    </div>
                    <div className="close-circle">
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => handleRemoveFromWishlist(item)}
                        title="Remove from wishlist"
                        aria-label="Remove from wishlist"
                      >
                        <i className="ti-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <ul className="cart_total">
                <li>
                  <div className="buttons">
                    <Link
                      href="/pages/account/wishlist"
                      className="btn btn-normal btn-block view-cart"
                      onClick={() => setOpenWishlist(false)}
                    >
                      View Wishlist
                    </Link>
                  </div>
                </li>
              </ul>
            </div>
          ) : (
            <div className="empty-cart-cls text-center">
              <img
                src="/images/empty-wishlist.png"
                className="mb-4 wishlist-max-width"
                alt="empty wishlist"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <h3><strong>Your Wishlist is Empty</strong></h3>
              <h4>Explore more and shortlist some items.</h4>
              <div className="mt-3">
                <Link
                  href="/collections/leftsidebar"
                  className="btn btn-primary btn-sm"
                  onClick={() => setOpenWishlist(false)}
                >
                  Start Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;