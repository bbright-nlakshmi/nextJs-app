/* eslint-disable @next/next/no-img-element */
import React, { useState, useContext, useEffect } from "react";
import { NextPage } from "next";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { Media } from "reactstrap";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { searchController } from "@/app/globalProvider";

// Enhanced interface for enriched wishlist data
interface EnrichedWishlistItem {
  uuid?: string;
  productId: string;
  variantId?: string;
  title: string;
  type: string;
  img: string[];
  price: number;
  stock: number;
  originalItem: any;
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

  // ✅ Enhanced product lookup with multiple fallback strategies (same as wishlist page)
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
        const kitRaw = searchController.kits.find((k: any) => k?.id === productId);
        if (kitRaw) {
          return kitRaw;
        }
      }

      // Try getDetails as fallback with required eventName parameter
      if (searchController?.getDetails && typeof searchController.getDetails === 'function') {
        const found = searchController.getDetails(productId, 'wishlist-sidebar');
        if (found && typeof found === "object") {
          return found;
        }
      }
    } catch (error) {
      console.error("Error finding product:", error);
    }

    return null;
  };

  // ✅ Enhanced price extraction logic (same as wishlist page)
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

    return 0;
  };

  // ✅ Enhanced enrichment logic with robust product lookup
  useEffect(() => {
    if (!wishlistItems || wishlistItems.length === 0) {
      setEnrichedWishlistData([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const enrichedData = wishlistItems.map((item: any, index: number) => {
        const found = getProductById(item.productId);

        // Use fallback if product isn't found - consistent with cart logic
        const enriched = found && typeof found === "object" ? found : {};

        // Extract price from found product or fallback to item price
        const productPrice = extractPriceFromObject(enriched) || extractPriceFromObject(item) || item.price || 0;

        // Extract images with proper fallback
        const getImages = (obj: any): string[] => {
          if (obj?.img && Array.isArray(obj.img)) return obj.img;
          if (obj?.images && Array.isArray(obj.images)) return obj.images;
          if (obj?.img && typeof obj.img === 'string') return [obj.img];
          if (obj?.image && typeof obj.image === 'string') return [obj.image];
          return [""];
        };

        // Extract stock with proper fallback
        const getStock = (obj: any): number => {
          if (typeof obj?.stock === 'number') return obj.stock;
          if (typeof obj?.quantity === 'number') return obj.quantity;
          if (typeof obj?.inventory === 'number') return obj.inventory;
          if (typeof obj?.stockQuantity === 'number') return obj.stockQuantity;
          return 0;
        };

        return {
          uuid: item.uuid,
          productId: item.productId,
          variantId: item.variantId,
          title: enriched.title || enriched.name || item.title || item.name || "Unnamed Product",
          type: enriched.type || enriched.category || item.type || "General",
          img: getImages(enriched) || getImages(item),
          price: productPrice,
          stock: getStock(enriched) || getStock(item),
          originalItem: item,
        } as EnrichedWishlistItem;
      });

      console.log("Enriched wishlist sidebar data:", enrichedData);
      setEnrichedWishlistData(enrichedData);
    } catch (error) {
      console.error("Error enriching wishlist sidebar data:", error);
      setEnrichedWishlistData([]);
    } finally {
      setIsLoading(false);
    }
  }, [wishlistItems]);

  // ✅ Enhanced remove from wishlist handler
  const handleRemoveFromWishlist = (item: EnrichedWishlistItem) => {
    try {
      if (removeFromWish && typeof removeFromWish === 'function') {
        removeFromWish(item.originalItem);
      } else {
        console.error("removeFromWish function not available");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  // ✅ Format price with proper currency conversion
  const formatPrice = (price: number): string => {
    try {
      const convertedPrice = price * (value || 1);
      return `${symbol || '$'}${convertedPrice.toFixed(2)}`;
    } catch (error) {
      console.error("Error formatting price:", error);
      return `$${price.toFixed(2)}`;
    }
  };

  // ✅ Handle wishlist toggle
  const toggleWishlist = () => {
    setOpenWishlist(!openWishlist);
  };

  // ✅ Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenWishlist(false);
  };

  // ✅ Handle close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenWishlist(false);
  };

  return (
    <>
      {/* Mobile Wishlist Icon */}
      <li className="mobile-wishlist" onClick={toggleWishlist}>
        <a>
          <i className="icon-heart"></i>
          <div className="cart-item">
            <div>
              {totalItem} {t("item")} <span>{t("wishlist")}</span>
            </div>
          </div>
        </a>
      </li>

      {/* Wishlist Sidebar */}
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

          {/* Wishlist Content */}
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
                      <Link href={`/product/${item.productId}`}>
                        <Media 
                          alt={item.title} 
                          className="me-3" 
                          src={item.img?.[0] || ""}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "";
                          }}
                        />
                      </Link>
                      <div className="media-body">
                        <Link href={`/product/${item.productId}`}>
                          <h4 title={item.title}>
                            {item.title.length > 30 ? `${item.title.substring(0, 30)}...` : item.title}
                          </h4>
                        </Link>
                        <h4 className="theme-color">
                          <span>{item.type}</span>
                        </h4>
                        <h5>
                          <span>{formatPrice(item.price)}</span>
                        </h5>
                        {item.stock <= 0 && (
                          <small className="text-muted">Out of Stock</small>
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

              {/* Wishlist Footer Button */}
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
                className="img-fluid mb-4" 
                alt="empty wishlist"
                style={{ maxWidth: 200 }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <h3>
                <strong>Your Wishlist is Empty</strong>
              </h3>
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