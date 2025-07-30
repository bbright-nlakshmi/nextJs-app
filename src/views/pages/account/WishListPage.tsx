/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { useWishlistStore } from "../../../helpers/wishlist/wishlistStore";
import { CartContext } from "../../../helpers/cart/cart.context";
import { Row, Col, Table } from "reactstrap";
import Link from "next/link";
import Breadcrumb from "../../Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController, Kit } from "@/app/globalProvider";
import { WishlistProduct } from "../../../helpers/wishlist/wishlistStore";

interface KitRaw {
  id: string;
  [key: string]: any;
}

// Enhanced interface for enriched wishlist data
interface EnrichedWishlistItem extends WishlistProduct {
  title: string;
  img: string[];
  price: number;
  stock: number;
}

const WishListPage: NextPage = () => {
  const { wishlistItems, removeFromWish } = useWishlistStore();
  const { addToCart } = React.useContext(CartContext);
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;

  const [enrichedWishlistData, setEnrichedWishlistData] = useState<
    EnrichedWishlistItem[]
  >([]);

  // ✅ Enhanced product lookup - same as cart
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
      console.error("Error finding product:", error);
    }

    return null;
  };

  // ✅ Enhanced price logic - exactly same as cart
  const getPrice = (item: WishlistProduct): number => {
    if (!item) return 0;

    try {
      const product = getProductById(item.productId || item.id);
      
      if (product) {
        if (product instanceof Kit && typeof product.getPrice === "function") {
          try {
            const price = product.getPrice({ cartQuantity: 1 });
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
              cartQuantity: 1,
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

  // ✅ Enhanced enrichment logic using the new price function
  useEffect(() => {
    const enrichedData = wishlistItems.map((item) => {
      const found = item.productId ? getProductById(item.productId) : null;
      const enriched = found && typeof found === "object" ? found : {};

      // Use the enhanced price function
      const productPrice = getPrice(item);

      return {
        ...item,
        title:
          enriched.title ||
          enriched.name ||
          item.title ||
          item.name ||
          "Unnamed Product",
        img: enriched.img || enriched.images || item.img || [""],
        price: productPrice,
        stock: enriched.stock ?? enriched.quantity ?? item.stock ?? 0,
      } as EnrichedWishlistItem;
    });

    console.log("Enriched wishlist data:", enrichedData);
    setEnrichedWishlistData(enrichedData);
  }, [wishlistItems]);

  const handleAddCart = (item: WishlistProduct) => {
    addToCart(item);
    removeFromWish(item);
  };

  // Helper function to get unique identifier for item
  const getItemKey = (item: WishlistProduct): string => {
    return `${item.productId}-${item.variantId ?? Math.random().toString()}`;
  };

  return (
    <>
      <Breadcrumb parent="home" title="wishlist" />
      <section className="wishlist-section section-big-py-space bg-light">
        <div className="custom-container">
          {enrichedWishlistData.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="row d-none d-lg-block">
                <div className="col-sm-12">
                  <table className="table cart-table table-responsive-xs">
                    <thead>
                      <tr className="table-head" style={{ height: '60px' }}>
                        <th style={{ 
                          width: '100px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Image</th>
                        <th style={{ 
                          width: '300px', 
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
                        }}>Availability</th>
                        <th style={{ 
                          width: '150px', 
                          textAlign: 'center', 
                          padding: '20px 15px',
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedWishlistData.map((item, index) => {
                        const price = getPrice(item);
                        const itemKey = getItemKey(item);

                        return (
                          <tr key={itemKey}>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '15px' }}>
                              <img
                                src={item.img?.[0] || "/static/images/placeholder.png"}
                                alt={item.title || "Product"}
                                style={{ 
                                  width: 60, 
                                  height: 60, 
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/static/images/placeholder.png";
                                }}
                              />
                            </td>
                            <td style={{ verticalAlign: 'middle', padding: '15px' }}>
                              <div>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>
                                  {item.title}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '15px' }}>
                              <span style={{ fontWeight: '600', color: '#333' }}>
                                {symbol}{(price * value).toFixed(2)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '15px' }}>
                              <span style={{ 
                                color: (item.stock ?? 0) > 0 ? '#28a745' : '#dc3545',
                                fontWeight: '500'
                              }}>
                                {(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeFromWish(item)}
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
                                  aria-label="Remove from wishlist"
                                >
                                  <i className="ti-close"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleAddCart(item)}
                                  style={{
                                    border: '1px solid #00baf2',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    backgroundColor: 'transparent',
                                    color: '#00baf2',
                                    transition: 'all 0.3s ease',
                                    minWidth: '35px',
                                    height: '32px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#00baf2';
                                    e.currentTarget.style.color = 'white';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#00baf2';
                                  }}
                                  aria-label="Add to cart"
                                >
                                  <i className="ti-shopping-cart"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile and Tablet View */}
              <div className="row d-block d-lg-none">
                <div className="col-12">
                  {enrichedWishlistData.map((item, index) => {
                    const price = getPrice(item);
                    const itemKey = getItemKey(item);

                    return (
                      <div key={itemKey} className="card mb-3 shadow-sm">
                        <div className="card-body">
                          {/* Top Row - Image, Name, Remove Button */}
                          <div className="row align-items-center mb-3">
                            <div className="col-3 col-sm-2">
                              <img 
                                src={item.img?.[0] || "/static/images/placeholder.png"} 
                                alt={item.title || "Product"}
                                className="img-fluid rounded"
                                style={{ width: '100%', maxWidth: '60px', height: '60px', objectFit: 'cover' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/static/images/placeholder.png";
                                }}
                              />
                            </div>
                            <div className="col-6 col-sm-7">
                              <h6 className="mb-1 font-weight-bold">{item.title}</h6>
                              <p className="text-muted mb-0 small">Price: {symbol}{(price * value).toFixed(2)}</p>
                              <p className="mb-0 small" style={{ 
                                color: (item.stock ?? 0) > 0 ? '#28a745' : '#dc3545',
                                fontWeight: '500'
                              }}>
                                {(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                              </p>
                            </div>
                            <div className="col-3 col-sm-3 text-right">
                              <button
                                className="btn btn-sm btn-outline-danger mb-1"
                                onClick={() => removeFromWish(item)}
                                aria-label="Remove from wishlist"
                                style={{ width: '100%', maxWidth: '40px' }}
                              >
                                <i className="ti-close"></i>
                              </button>
                            </div>
                          </div>

                          {/* Bottom Row - Add to Cart Button */}
                          <div className="row">
                            <div className="col-12">
                              <button
                                className="btn btn-primary btn-sm w-100"
                                onClick={() => handleAddCart(item)}
                                style={{
                                  borderRadius: '6px',
                                  padding: '8px 16px',
                                  fontWeight: '500'
                                }}
                              >
                                <i className="ti-shopping-cart mr-2"></i>
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  src="/images/empty-wishlist.png"
                  className="img-fluid mb-4 empty-cart-image"
                  alt="empty wishlist"
                  style={{ maxWidth: '200px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                <h3 className="empty-cart-title mb-3">
                  <strong>Your Wishlist is Empty</strong>
                </h3>
                <p className="empty-cart-subtitle text-muted mb-4">
                  Explore more and shortlist some items.
                </p>
                <Link href="/" className="btn btn-primary btn-lg continue-shopping-empty">
                  <i className="fa fa-heart mr-2"></i>
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

export default WishListPage;