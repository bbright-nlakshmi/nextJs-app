/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { useWishlistStore } from "../../../helpers/wishlist/wishlistStore";
import { CartContext } from "../../../helpers/cart/cart.context";
import { Row, Col, Table } from "reactstrap";
import Link from "next/link";
import Breadcrumb from "../../Containers/Breadcrumb";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { searchController } from "@/app/globalProvider";
import { WishlistProduct } from "../../../helpers/wishlist/wishlistStore";
import { Kit } from "@/app/models/kit/kit";

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

  const [enrichedWishlistData, setEnrichedWishlistData] = useState<EnrichedWishlistItem[]>([]);

  // ✅ Enhanced product lookup with multiple fallback strategies (same as cart)
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
      const found = searchController?.getDetails ? searchController.getDetails(productId, 'wishlist') : null;
      if (found && typeof found === "object") {
        return found;
      }
    } catch (error) {
      console.error("Error finding product:", error);
    }

    return null;
  };

  // ✅ Enhanced enrichment logic with robust product lookup
  useEffect(() => {
    const enrichedData = wishlistItems.map((item) => {
      const found = getProductById(item.productId);

      // Use fallback if product isn't found - consistent with cart logic
      const enriched = found && typeof found === "object" ? found : {};

      // Enhanced price extraction - same logic as cart
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

      // Extract price from found product or fallback to item price
      const productPrice = extractPriceFromObject(enriched) || extractPriceFromObject(item) || item.price || 0;

      return {
        ...item,
        title: enriched.title || enriched.name || item.title || item.name || "Unnamed Product",
        img: enriched.img || enriched.images || item.img || [""],
        price: productPrice,
        stock: enriched.stock ?? enriched.quantity ?? item.stock ?? 0,
      } as EnrichedWishlistItem;
    });

    console.log("Enriched wishlist data:", enrichedData); // Debug log
    setEnrichedWishlistData(enrichedData);
  }, [wishlistItems]);

  const handleAddCart = (item: WishlistProduct) => {
    addToCart(item);
    removeFromWish(item);
  };

  return (
    <>
      <Breadcrumb parent="home" title="wishlist" />
      <section className="wishlist-section section-big-py-space bg-light">
        <div className="custom-container">
          {enrichedWishlistData.length > 0 ? (
            <>
              <Row>
                <Col sm="12">
                  <Table className="table cart-table table-responsive-xs">
                    <thead>
                      <tr className="table-head">
                        <th scope="col">Image</th>
                        <th scope="col">Product Name</th>
                        <th scope="col">Price</th>
                        <th scope="col">Availability</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedWishlistData.map((item, index) => (
                        <tr key={`${item.productId}-${item.variantId ?? index}`}>
                          <td>
                            <img
                              src={item.img?.[0] || ""}
                              alt={item.title || "Product"}
                              className="img-fluid"
                              style={{ width: 60 }}
                            />
                          </td>
                          <td>{item.title}</td>
                          <td>
                            {symbol}
                            {(item.price * value).toFixed(2)}
                          </td>
                          <td>{(item.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}</td>
                          <td>
                            <a
                              href="#"
                              className="icon me-3"
                              onClick={(e) => {
                                e.preventDefault();
                                removeFromWish(item);
                              }}
                            >
                              <i className="ti-close"></i>
                            </a>
                            <a
                              href="#"
                              className="cart"
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddCart(item);
                              }}
                            >
                              <i className="ti-shopping-cart"></i>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
              <Row className="wishlist-buttons">
                <Col xs="12">
                  <Link className="btn btn-normal" href="/collections/leftsidebar">
                    continue shopping
                  </Link>
                  <Link className="btn btn-normal" href="/pages/account/checkout">
                    check out
                  </Link>
                </Col>
              </Row>
            </>
          ) : (
            <Col sm="12">
              <div>
                <Col sm="12" className="empty-cart-cls text-center">
                  <img
                    src="/images/empty-wishlist.png"
                    className="img-fluid mb-4"
                    alt="empty wishlist"
                  />
                  <h3>
                    <strong>Your wishlist is Empty</strong>
                  </h3>
                  <h4>Explore more and shortlist some items.</h4>
                </Col>
              </div>
            </Col>
          )}
        </div>
      </section>
    </>
  );
};

export default WishListPage;