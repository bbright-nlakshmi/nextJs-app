"use client";
import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Row, Col, Spinner, Button } from "reactstrap";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import { Skeleton } from "../../common/skeleton";
import { CartContext } from "../../helpers/cart/cart.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import { CompareContext } from "../../helpers/compare/compare.context";
import { appConfig, objCache, Product, searchController, centralDataCollector } from "@/app/globalProvider";
import { Swiper, SwiperSlide } from "swiper/react";
import { getProductFinalPrice } from "@/utils/price.helper";
import "swiper/css";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
interface RelatedProductsProps {
  productId: string;
  categoryId: string;
  hoverEffect?: string;
}

const RelatedProducts: NextPage<RelatedProductsProps> = ({
  productId,
  categoryId,
}) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  // const [pageLimit, setPageLimit] = useState(6);
  const [isLoading, setIsLoading] = useState(true); 

  const loadRelatedProducts = () => {
    try {
      // Get all products from different sources
      const allProducts: Product[] = [
        ...objCache.getAllPremiumProducts(),
        ...objCache.getAllNonPremiumProducts(),
        ...objCache.getAllProducts(),
      ];

      // Remove duplicates by creating a map with product IDs
      const uniqueProducts = new Map<string, Product>();
      allProducts.forEach((product) => {
        if (!uniqueProducts.has(product.id)) {
          uniqueProducts.set(product.id, product);
        }
      });

      // Filter related products
      const filtered = Array.from(uniqueProducts.values()).filter(
        (product) =>
          product.categoryID === categoryId && product.id !== productId
      );

      setRelatedProducts(filtered);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading related products:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleUpdateAllProducts = (data: Map<string, Product[]>) => {
      const allProducts: Product[] = Array.from(
        new Map(
          Array.from(data.values())
            .flat()
            .map((product) => [product.id, product])
        ).values()
      );
      const filtered = allProducts.filter(
        (product) =>
          product.categoryID === categoryId && product.id !== productId
      );
      setRelatedProducts(filtered);
      setIsLoading(false);
    };

    const handleUpdate = () => {
      loadRelatedProducts();
    };

    const handleUpdatePremium = () => {
      loadRelatedProducts();
    };

    const handleUpdateNonPremium = () => {
      loadRelatedProducts();
    };

    // Initial load
    if (centralDataCollector.isInitialLoading) {
      // Wait for data to be loaded
      const checkDataLoaded = () => {
        if (!centralDataCollector.isInitialLoading) {
          loadRelatedProducts();
        } else {
          setTimeout(checkDataLoaded, 100);
        }
      };
      checkDataLoaded();
    } else {
      loadRelatedProducts();
    }

    // Listen for various update events
    objCache.on("updateAllProducts", handleUpdateAllProducts);
    objCache.on("update", handleUpdate);
    objCache.on("updatePremium", handleUpdatePremium);
    objCache.on("updateNonPremium", handleUpdateNonPremium);
    objCache.on("dataLoaded", handleUpdate);

    return () => {
      objCache.off("updateAllProducts", handleUpdateAllProducts);
      objCache.off("update", handleUpdate);
      objCache.off("updatePremium", handleUpdatePremium);
      objCache.off("updateNonPremium", handleUpdateNonPremium);
      objCache.off("dataLoaded", handleUpdate);
    };
  }, [categoryId, productId]);

  const getPrice = (item: Product) => {
    return getProductFinalPrice({
      price: item.sellingPrice,
      discount: item.discount,
      sellingPrices: item.sellingPrices,
      activeIndex: 0,
    });
  };

  const handleAddToCart = (item: any, qty = 1) => {
    const price = getPrice(item);
    const cartItem = {
      ...item,
      price: price,
      cartItemCount: qty,
      getPriceWithDiscount: () => price,
      id: item.productId,
      cartPurchaseOptionStr: item.selectedSize || "",
    };
    addToCart(cartItem, qty);
  };

  // Don't render if no related products and still loading
  if (isLoading && relatedProducts.length === 0) {
    return null;
  }

  // Don't render if no related products found
  if (!isLoading && relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="section-big-py-space ratio_asos ">
      <div className="custom-container">
        <Row>
          <Col sm="12">
            <h2>Related Products</h2>
            <div className="related-products-slider">
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center related-products-container">
                  <div className="text-center">
                    <div className="spinner-border mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading related products...</p>
                  </div>
                </div>
              ) : (
                <Swiper
                  spaceBetween={20}
                  modules={[Navigation, Pagination, Autoplay]}
                  autoplay={{ delay: 1000, pauseOnMouseEnter: true }}
                  grabCursor={true}
                  simulateTouch={true}
                  allowTouchMove={true}
                  navigation
                  breakpoints={appConfig.mediaQueries}
                >
                  {relatedProducts.slice().map((item, i) => (
                    <SwiperSlide key={i}>
                      <div className="product">
                        <ProductBox
                          layout="layout-one"
                          data={item}
                          item={item}
                          price={getPrice(item)}
                          discount={item.discount?.discount}
                          addCart={handleAddToCart}
                          addCompare={() => addToCompare(item)}
                          addWish={() => addToWish(item)}
                          hoverEffect={"icon-inline"}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default RelatedProducts;
