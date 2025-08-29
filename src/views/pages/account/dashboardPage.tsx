"use client";

import React, { useEffect, useState, useContext, useCallback } from "react";
import { NextPage } from "next";
import {
  Row, Col, Container, Spinner, Input, FormGroup, Label, Button,
  Card, CardBody, Badge, Table, Modal, ModalHeader, ModalBody, ModalFooter, Toast, ToastHeader, ToastBody
} from "reactstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../Containers/Breadcrumb";
import { API } from "@/app/services/api.service";
import { OrderModel } from "@/app/models/order/order";
import { OrderItemsModel } from "@/app/models/order_item_model/order_item_model";
import { useWishlistStore, WishlistProduct } from "../../../helpers/wishlist/wishlistStore";
import { CartContext } from "../../../helpers/cart/cart.context";
import { CurrencyContext } from "../../../helpers/currency/CurrencyContext";
import { searchController, Kit } from "@/app/globalProvider";

// Define interfaces
interface UserInfo {
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
}

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

// Profile Avatar Component
const ProfileAvatar: React.FC<{ name: string; size?: number }> = ({ name, size = 80 }) => {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={`dashboard-profile-avatar dashboard-flex-center`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
};

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "wishlist" | "account">("dashboard");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "User",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
  });
  const [editingUser, setEditingUser] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const { wishlistItems, removeFromWish } = useWishlistStore();
  const { addToCart } = useContext(CartContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const { symbol, value } = selectedCurr || { symbol: "₹", value: 1 };
  const [enrichedWishlistData, setEnrichedWishlistData] = useState<EnrichedWishlistItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: "", item: null });

  // Load user info from localStorage on component mount
  useEffect(() => {
    const loadUserInfo = () => {
      try {
        // First try to get from userLoginInfo
        const loginInfo = localStorage.getItem('userLoginInfo');
        if (loginInfo) {
          const parsedLoginInfo = JSON.parse(loginInfo);
          setUserInfo(prev => ({
            ...prev,
            name: parsedLoginInfo.name || prev.name,
            phone: parsedLoginInfo.phoneNumber || parsedLoginInfo.phone || prev.phone,
            email: parsedLoginInfo.email || prev.email,
          }));
        }

        // Then try to get additional info from userProfile or userInfo
        const profileInfo = localStorage.getItem('userProfile') || localStorage.getItem('userInfo');
        if (profileInfo) {
          const parsedProfileInfo = JSON.parse(profileInfo);
          setUserInfo(prev => ({
            ...prev,
            name: parsedProfileInfo.name || `${parsedProfileInfo.firstName} ${parsedProfileInfo.lastName}`.trim() || prev.name,
            phone: parsedProfileInfo.phoneNumber || parsedProfileInfo.phone || prev.phone,
            email: parsedProfileInfo.email || prev.email,
            billingAddress: parsedProfileInfo.billingAddress || prev.billingAddress,
            shippingAddress: parsedProfileInfo.shippingAddress || prev.shippingAddress,
          }));
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };

    loadUserInfo();
  }, []);

  // Toast handling
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

  // Fetch product details
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
          if (Kit.fromMap && typeof Kit.fromMap === "function") {
            return Kit.fromMap(kitRaw);
          }
          return kitRaw;
        }
      }

      if (searchController?.getDetails && typeof searchController.getDetails === "function") {
        const found = searchController.getDetails(productId, "wishlist");
        if (found && typeof found === "object") {
          return found;
        }
      }
    } catch (error) {
      console.warn(`Error fetching product ${productId}:`, error);
    }

    return null;
  }, []);

  // Calculate price
  const getPrice = useCallback((item: any): number => {
    if (!item || typeof item !== "object") {
      console.warn("getPrice: Invalid item received", item);
      return 0;
    }

    if ('price' in item && typeof item.price === 'number' && !isNaN(item.price) && item.price > 0) {
      return item.price;
    }

    if (item.originalItem) {
      const originalPrice = getPrice(item.originalItem);
      if (originalPrice > 0) {
        return originalPrice;
      }
    }
    
    const productId = item.productId || item.Id || item.id;
    if (productId) {
      const product = getProductById(productId);
      if (product) {
        if (product instanceof Kit && typeof product.getPrice === "function") {
          try {
            const kitPrice = product.getPrice({ 
              cartQuantity: 1, 
              purchaseOptionStr: item.purchaseOptionStr || "" 
            });
            if (typeof kitPrice === 'number' && !isNaN(kitPrice) && kitPrice > 0) {
              return kitPrice;
            }
          } catch (methodError) {
            console.warn(`getPrice: Error in Kit.getPrice for ${productId}:`, methodError);
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
            console.warn(`getPrice: Error in product.getPrice for ${productId}:`, methodError);
          }
        }

        const extractPriceFromProduct = (obj: any): number => {
          if (!obj || typeof obj !== 'object') return 0;

          const priceFields = [
            'sellingPrice', 'price', 'kitPrice', 'discountPrice', 'salePrice', 
            'finalPrice', 'currentPrice', 'amount', 'cost', 'value', 
            'regularPrice', 'basePrice', 'unitPrice', 'totalPrice'
          ];

          for (const field of priceFields) {
            if (field in obj && typeof obj[field] === 'number' && !isNaN(obj[field]) && obj[field] > 0) {
              return obj[field];
            }
            if (field in obj && typeof obj[field] === 'string' && !isNaN(Number(obj[field]))) {
              const numPrice = Number(obj[field]);
              if (numPrice > 0) {
                return numPrice;
              }
            }
          }

          const nestedPrice = obj.pricing || obj.priceInfo || obj.cost || obj.priceData || obj.priceDetails;
          if (typeof nestedPrice === 'number' && !isNaN(nestedPrice) && nestedPrice > 0) {
            return nestedPrice;
          }
          if (typeof nestedPrice === 'object' && nestedPrice !== null) {
            const extractedPrice = nestedPrice.amount || nestedPrice.value || nestedPrice.price || 
                                 nestedPrice.final || nestedPrice.current || nestedPrice.cost || 
                                 nestedPrice.salePrice || nestedPrice.basePrice;
            if (typeof extractedPrice === 'number' && !isNaN(extractedPrice) && extractedPrice > 0) {
              return extractedPrice;
            }
            if (typeof extractedPrice === 'string' && !isNaN(Number(extractedPrice))) {
              const numPrice = Number(extractedPrice);
              if (numPrice > 0) {
                return numPrice;
              }
            }
          }

          return 0;
        };

        const productPrice = extractPriceFromProduct(product);
        if (productPrice > 0) return productPrice;
      }

      try {
        const controllerPrice = searchController.getDetails(productId, "getPrice");
        if (typeof controllerPrice === 'number' && !isNaN(controllerPrice) && controllerPrice > 0) {
          return controllerPrice;
        }
      } catch (error) {
        console.warn(`getPrice: Error in searchController.getDetails for ${productId}:`, error);
      }
    }
    
    const priceFields = [
      'sellingPrice', 'price', 'kitPrice', 'discountPrice', 'salePrice', 
      'finalPrice', 'currentPrice', 'amount', 'cost', 'value', 
      'regularPrice', 'basePrice', 'unitPrice', 'totalPrice'
    ];
    for (const field of priceFields) {
      if (field in item && typeof item[field] === 'number' && !isNaN(item[field]) && item[field] > 0) {
        return item[field];
      }
      if (field in item && typeof item[field] === 'string' && !isNaN(Number(item[field]))) {
        const numPrice = Number(item[field]);
        if (numPrice > 0) {
          return numPrice;
        }
      }
    }

    if ('getProductPrice' in item && typeof item.getProductPrice === 'function') {
      try {
        const price = item.getProductPrice();
        if (typeof price === 'number' && !isNaN(price) && price > 0) {
          return price;
        }
      } catch (error) {
        console.warn(`getPrice: Error in getProductPrice for ${productId || 'unknown'}:`, error);
      }
    }
    
    if ('getPrice' in item && typeof item.getPrice === 'function') {
      try {
        const price = item.getPrice();
        if (typeof price === 'number' && !isNaN(price) && price > 0) {
          return price;
        }
      } catch (error) {
        console.warn(`getPrice: Error in getPrice for ${productId || 'unknown'}:`, error);
      }
    }

    const nestedObjects = [item.pricing, item.priceInfo, item.cost, item.priceData, item.priceDetails];
    for (const nested of nestedObjects) {
      if (typeof nested === 'number' && !isNaN(nested) && nested > 0) {
        return nested;
      }
      if (typeof nested === 'object' && nested !== null) {
        const nestedPrice = nested.amount || nested.value || nested.price || 
                           nested.final || nested.current || nested.cost || 
                           nested.salePrice || nested.basePrice;
        if (typeof nestedPrice === 'number' && !isNaN(nestedPrice) && nestedPrice > 0) {
          return nestedPrice;
        }
        if (typeof nestedPrice === 'string' && !isNaN(Number(nestedPrice))) {
          const numPrice = Number(nestedPrice);
          if (numPrice > 0) {
            return numPrice;
          }
        }
      }
    }
    
    return 0;
  }, [getProductById]);

  // Calculate stock
  const getStock = useCallback((item: any): number => {
    if (!item || typeof item !== "object") return 0;
    
    if (item.originalItem) {
      const originalStock = getStock(item.originalItem);
      if (originalStock >= 0) {
        return originalStock;
      }
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
            console.warn(`getStock: Error in Kit.getStock for ${productId}:`, methodError);
          }
        }

        if (product?.getStock && typeof product.getStock === "function") {
          try {
            const productStock = product.getStock();
            if (typeof productStock === 'number' && productStock >= 0) {
              return productStock;
            }
          } catch (methodError) {
            console.warn(`getStock: Error in product.getStock for ${productId}:`, methodError);
          }
        }

        const stockFields = ['stock', 'quantity', 'inventory', 'stockQuantity', 'availableStock', 'inStock', 'stockLevel'];
        for (const field of stockFields) {
          if (typeof product[field] === "number" && product[field] >= 0) {
            return product[field];
          }
          if (typeof product[field] === "string" && !isNaN(Number(product[field]))) {
            const numStock = Number(product[field]);
            if (numStock >= 0) {
              return numStock;
            }
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
            if (numStock >= 0) {
              return numStock;
            }
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
        if (numStock >= 0) {
          return numStock;
        }
      }
    }

    if ('getStock' in item && typeof item.getStock === 'function') {
      try {
        const stockValue = item.getStock();
        if (typeof stockValue === 'number' && stockValue >= 0) {
          return stockValue;
        }
      } catch (error) {
        console.warn(`getStock: Error in item.getStock for ${productId || 'unknown'}:`, error);
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
          if (numStock >= 0) {
            return numStock;
          }
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
        console.warn(`getStock: Error in searchController.getDetails for ${productId}:`, error);
      }
    }
    
    return 999;
  }, [getProductById]);

  // Get product images
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

  // Save user info
  const saveUserInfo = useCallback((newInfo: UserInfo) => {
    setUserInfo(newInfo);
    
    // Save to multiple storage keys for compatibility
    const userInfoToSave = {
      ...newInfo,
      phoneNumber: newInfo.phone, // Add phoneNumber field for compatibility
    };
    
    localStorage.setItem("userInfo", JSON.stringify(userInfoToSave));
    localStorage.setItem("userLoginInfo", JSON.stringify({
      name: newInfo.name,
      email: newInfo.email,
      phone: newInfo.phone,
      phoneNumber: newInfo.phone,
    }));
  }, []);

  // Format date
  const formatDate = useCallback(
    (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    []
  );

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    const colors: { [key: string]: string } = {
      delivered: "success",
      pending: "warning",
      processing: "info",
      cancelled: "danger",
    };
    return colors[status?.toLowerCase()] || "secondary";
  }, []);

  // Fetch orders
  useEffect(() => {
    if (activeTab === "orders" && userInfo.phone) {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          setError(null);
          const fetchedOrders = await API.getOrders(userInfo.phone);
          fetchedOrders.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
          setOrders(fetchedOrders);
          setFilteredOrders(fetchedOrders);
        } catch (err) {
          setError("Could not load your orders.");
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, userInfo.phone]);

  // Enrich wishlist data
  useEffect(() => {
    const enrichedData = wishlistItems.map((item) => {
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

  // Handle filter
  const handleFilter = useCallback(() => {
    if (!fromDate || !toDate) {
      alert("Please select both dates");
      return;
    }
    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.creationTime);
      return orderDate >= new Date(fromDate) && orderDate <= new Date(toDate);
    });
    setFilteredOrders(filtered);
  }, [orders, fromDate, toDate]);

  // Handle user edit
  const handleUserEdit = useCallback(
    (field: keyof UserInfo, value: string) => {
      const newInfo = { ...userInfo, [field]: value };
      saveUserInfo(newInfo);
    },
    [userInfo, saveUserInfo]
  );

  // Handle add to cart
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

  // Handle remove from wishlist
  const handleRemoveFromWishlist = useCallback((item: EnrichedWishlistItem) => {
    setConfirmModal({ isOpen: true, action: "remove", item });
  }, []);

  // Get item key
  const getItemKey = useCallback((item: EnrichedWishlistItem): string => {
    return item.productId || item.cartItemId || item.key || item.id || item.title || Math.random().toString();
  }, []);

  // Render wishlist item
  const renderWishlistItem = useCallback(
    (item: EnrichedWishlistItem, isMobile = false) => {
      const price = item.price;
      const itemKey = getItemKey(item);

      if (isMobile) {
        return (
          <Card key={itemKey} className="dashboard-wishlist-mobile-card dashboard-mb-3 dashboard-shadow-sm dashboard-border-0">
            <CardBody className="dashboard-p-3">
              <div className="dashboard-flex dashboard-align-items-center dashboard-mb-3">
                <div className="dashboard-me-3">
                  <img
                    src={item.img?.[0] || "/images/placeholder.png"}
                    alt={item.title}
                    className="dashboard-wishlist-mobile-img dashboard-rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/placeholder.png";
                    }}
                  />
                </div>
                <div className="dashboard-flex-grow-1">
                  <h6 className="dashboard-mb-1 dashboard-wishlist-item-title">{item.title}</h6>
                  {price > 0 ? (
                    <p className="dashboard-mb-0 dashboard-text-muted dashboard-small">
                      {symbol}{(price * value).toFixed(2)}
                    </p>
                  ) : (
                    <p className="dashboard-mb-0 dashboard-text-muted dashboard-small">Price not available</p>
                  )}
                </div>
                <div className="dashboard-text-end">
                  <small className={item.stock > 0 ? "dashboard-text-success" : "dashboard-text-danger"}>
                    {item.stock > 0 ? "In Stock" : "Out of Stock"}
                  </small>
                </div>
              </div>
              <div className="dashboard-flex dashboard-gap-2 dashboard-justify-content-center">
                <Button
                  color="danger"
                  size="sm"
                  outline
                  onClick={() => handleRemoveFromWishlist(item)}
                  className="dashboard-btn-action-sm"
                >
                  <i className="ti-close dashboard-me-1" />
                  Remove
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => handleAddToCart(item)}
                  disabled={item.stock <= 0}
                  className="dashboard-btn-action-sm"
                >
                  <i className="ti-shopping-cart dashboard-me-1" />
                  Add to Cart
                </Button>
              </div>
            </CardBody>
          </Card>
        );
      }

      return (
        <tr key={itemKey} className="dashboard-wishlist-table-row">
          <td className="dashboard-text-center dashboard-p-3">
            <img
              src={item.img?.[0] || "/images/placeholder.png"}
              alt={item.title}
              className="dashboard-wishlist-table-img dashboard-rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/placeholder.png";
              }}
            />
          </td>
          <td className="dashboard-p-3 dashboard-wishlist-item-title">{item.title}</td>
          <td className="dashboard-text-center dashboard-p-3 dashboard-wishlist-item-price">
            {price > 0 ? (
              `${symbol}${(price * value).toFixed(2)}`
            ) : (
              <span className="dashboard-text-muted">Price not available</span>
            )}
          </td>
          <td className={`dashboard-text-center dashboard-p-3 ${item.stock > 0 ? "dashboard-text-success" : "dashboard-text-danger"}`}>
            {item.stock > 0 ? "In Stock" : "Out of Stock"}
          </td>
          <td className="dashboard-text-center dashboard-p-3">
            <div className="dashboard-flex dashboard-gap-2 dashboard-justify-content-center">
              <Button
                color="danger"
                size="sm"
                outline
                onClick={() => handleRemoveFromWishlist(item)}
                className="dashboard-btn-action-sm"
              >
                <i className="ti-close" />
              </Button>
              <Button
                color="primary"
                size="sm"
                onClick={() => handleAddToCart(item)}
                disabled={item.stock <= 0}
                className="dashboard-btn-action-sm"
              >
                <i className="ti-shopping-cart" />
              </Button>
            </div>
          </td>
        </tr>
      );
    },
    [getPrice, getItemKey, symbol, value, handleAddToCart, handleRemoveFromWishlist]
  );

  // Render dashboard content
  const renderDashboardContent = useCallback(() => {
    switch (activeTab) {
      case "wishlist":
        return (
          <div>
            <div className="dashboard-page-title dashboard-mb-4">
              <h2>My Wishlist</h2>
              <p className="dashboard-text-muted">Manage your saved items</p>
            </div>
            <div className="dashboard-toast-container dashboard-position-fixed dashboard-top-0 dashboard-end-0 dashboard-p-3">
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
                <div className="dashboard-d-none dashboard-d-lg-block">
                  <Card className="dashboard-wishlist-table-card dashboard-shadow-sm dashboard-border-0">
                    <CardBody className="dashboard-p-0">
                      <div className="dashboard-wishlist-scroll">
                        <Table responsive className="dashboard-wishlist-data-table dashboard-mb-0">
                          <thead className="dashboard-sticky-top dashboard-bg-light">
                            <tr className="dashboard-wishlist-header-row">
                              <th className="dashboard-text-center dashboard-p-3">Image</th>
                              <th className="dashboard-p-3">Product Name</th>
                              <th className="dashboard-text-center dashboard-p-3">Price</th>
                              <th className="dashboard-text-center dashboard-p-3">Availability</th>
                              <th className="dashboard-text-center dashboard-p-3">Action</th>
                            </tr>
                          </thead>
                          <tbody>{enrichedWishlistData.map((item) => renderWishlistItem(item))}</tbody>
                        </Table>
                      </div>
                    </CardBody>
                  </Card>
                </div>
                <div className="dashboard-d-block dashboard-d-lg-none">
                  <div className="dashboard-wishlist-scroll">
                    {enrichedWishlistData.map((item) => renderWishlistItem(item, true))}
                  </div>
                </div>
                <div className="dashboard-wishlist-action-buttons dashboard-mt-4">
                  <div className="dashboard-flex dashboard-justify-content-between dashboard-flex-wrap dashboard-gap-3">
                    <Link href="/">
                      <Button color="outline-primary" size="lg" className="dashboard-btn-primary-outline">
                        <i className="fa fa-arrow-left dashboard-me-2" />
                        Continue Shopping
                      </Button>
                    </Link>
                    <Link href="/pages/account/checkout">
                      <Button color="primary" size="lg" className="dashboard-btn-primary-solid">
                        Check Out
                        <i className="fa fa-arrow-right dashboard-ms-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <Card className="dashboard-wishlist-empty-card dashboard-shadow-sm dashboard-border-0">
                <CardBody className="dashboard-text-center dashboard-py-5">
                  <i className="fa fa-heart fa-5x dashboard-mb-4 dashboard-primary-color" />
                  <h3 className="dashboard-mb-3">
                    <strong>Your wishlist is Empty</strong>
                  </h3>
                  <p className="dashboard-text-muted dashboard-mb-4">Explore more and shortlist some items.</p>
                  <Link href="/">
                    <Button color="primary" className="dashboard-btn-primary-solid">
                      <i className="fa fa-shopping-cart dashboard-me-2" />
                      Start Shopping
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            )}
          </div>
        );

      case "orders":
        return (
          <div>
            <div className="dashboard-page-title dashboard-mb-4">
              <h2>My Orders</h2>
              <p className="dashboard-text-muted">Track your order history</p>
            </div>
            <Card className="dashboard-mb-4 dashboard-shadow-sm">
              <CardBody>
                <h5>Filter Orders</h5>
                <Row>
                  <Col md="4">
                    <FormGroup>
                      <Label>From Date</Label>
                      <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>To Date</Label>
                      <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <div className="dashboard-mt-4">
                      <div className="dashboard-action-button-group">
                        <Button color="primary" onClick={handleFilter} className="dashboard-btn-primary-custom">
                          Filter
                        </Button>
                        <Button
                          color="secondary"
                          onClick={() => {
                            setFromDate("");
                            setToDate("");
                            setFilteredOrders(orders);
                          }}
                          className="dashboard-btn-secondary-custom"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
            {loading ? (
              <div className="dashboard-text-center dashboard-py-5">
                <Spinner size="lg" color="primary" />
                <p className="dashboard-mt-3">Loading orders...</p>
              </div>
            ) : error ? (
              <Card className="dashboard-shadow-sm">
                <CardBody className="dashboard-text-center dashboard-py-5">
                  <h5 className="dashboard-text-danger">{error}</h5>
                  <Button color="primary" onClick={() => window.location.reload()} className="dashboard-btn-primary-custom">
                    Try Again
                  </Button>
                </CardBody>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="dashboard-shadow-sm">
                <CardBody className="dashboard-text-center dashboard-py-5">
                  <i className="fa fa-shopping-bag fa-5x dashboard-mb-4 dashboard-primary-color" />
                  <h5>No orders found</h5>
                  <p>You haven't placed any orders yet</p>
                </CardBody>
              </Card>
            ) : (
              <div className="dashboard-orders-scroll">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="dashboard-mb-3 dashboard-shadow-sm">
                    <CardBody>
                      <div
                        className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-cursor-pointer"
                        onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                      >
                        <div>
                          <h6 className="dashboard-mb-1">Order #{order.id}</h6>
                          <small className="dashboard-text-muted">{formatDate(order.creationTime)}</small>
                        </div>
                        <div className="dashboard-flex dashboard-align-items-center dashboard-gap-3">
                          <div className="dashboard-text-center">
                            <strong className="dashboard-primary-color">{Object.keys(order.orderItems).length}</strong>
                            <div>
                              <small>Items</small>
                            </div>
                          </div>
                          <div className="dashboard-text-center">
                            <strong className="dashboard-primary-color">{symbol}{order.finalOrderTotal.toFixed(2)}</strong>
                            <div>
                              <small>Total</small>
                            </div>
                          </div>
                          <Badge color={getStatusColor(order.orderAcceptStatus || "Pending")}>
                            {order.orderAcceptStatus || "Pending"}
                          </Badge>
                          <i
                            className={`fa ${expandedOrderId === order.id ? "fa-chevron-up" : "fa-chevron-down"} dashboard-primary-color`}
                          />
                        </div>
                      </div>
                      {expandedOrderId === order.id && (
                        <div className="dashboard-mt-3 dashboard-pt-3 dashboard-border-top">
                          <h6>Order Details</h6>
                          {Object.values(order.orderItems || {}).map((item: OrderItemsModel) => (
                            <div key={item.id} className="dashboard-flex dashboard-align-items-center dashboard-mb-3 dashboard-p-3 dashboard-bg-light dashboard-rounded">
                              <img
                                src={item.url || "/images/placeholder.png"}
                                alt={item.name || "Product"}
                                className="dashboard-me-3 dashboard-rounded dashboard-order-item-img"
                              />
                              <div className="dashboard-flex-grow-1">
                                <h6 className="dashboard-mb-1">{item.name || "Unnamed Product"}</h6>
                                <p className="dashboard-text-muted dashboard-mb-0">{item.categoryName || "N/A"}</p>
                              </div>
                              <div className="dashboard-text-end">
                                <div className="dashboard-fw-bold dashboard-primary-color">
                                  {symbol}{item.choosedPrice?.toFixed(2) ?? "0.00"}
                                </div>
                                <small>Qty: {item.cartItemCount ?? 0}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "account":
        return (
          <div>
            <div className="dashboard-page-title dashboard-mb-4">
              <h2>Account Information</h2>
              <p className="dashboard-text-muted">Manage your personal details and addresses</p>
            </div>
            <Card className="dashboard-shadow-sm dashboard-mb-4">
              <CardBody>
                <div className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-mb-4">
                  <div>
                    <h5 className="dashboard-mb-1 dashboard-section-title">
                      <i className="fa fa-user dashboard-me-2 dashboard-primary-color" />
                      Contact Information
                    </h5>
                    <p className="dashboard-text-muted dashboard-mb-0 dashboard-small">Keep your contact details up to date</p>
                  </div>
                  <Button
                    color={editingUser ? "success" : "primary"}
                    size="sm"
                    onClick={() => setEditingUser(!editingUser)}
                    className={editingUser ? "dashboard-btn-success-custom-xs" : "dashboard-btn-primary-custom-xs"}
                  >
                    <i className={`fa ${editingUser ? "fa-check" : "fa-edit"} dashboard-me-1`} />
                    {editingUser ? "Save" : "Edit"}
                  </Button>
                </div>
                {editingUser ? (
                  <Row>
                    <Col md="6">
                      <FormGroup className="dashboard-mb-3">
                        <Label className="dashboard-form-label">
                          <i className="fa fa-user dashboard-me-2 dashboard-text-muted" />
                          Full Name
                        </Label>
                        <Input
                          type="text"
                          value={userInfo.name}
                          onChange={(e) => handleUserEdit("name", e.target.value)}
                          className="dashboard-form-control-custom"
                          placeholder="Enter your full name"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup className="dashboard-mb-3">
                        <Label className="dashboard-form-label">
                          <i className="fa fa-envelope dashboard-me-2 dashboard-text-muted" />
                          Email Address
                        </Label>
                        <Input
                          type="email"
                          value={userInfo.email}
                          onChange={(e) => handleUserEdit("email", e.target.value)}
                          className="dashboard-form-control-custom"
                          placeholder="Enter your email address"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup className="dashboard-mb-3">
                        <Label className="dashboard-form-label">
                          <i className="fa fa-phone dashboard-me-2 dashboard-text-muted" />
                          Phone Number
                        </Label>
                        <Input
                          type="text"
                          value={userInfo.phone}
                          onChange={(e) => handleUserEdit("phone", e.target.value)}
                          className="dashboard-form-control-custom"
                          placeholder="Enter your phone number"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                ) : (
                  <Row>
                    <Col md="4">
                      <div className="dashboard-info-item dashboard-mb-3">
                        <div className="dashboard-info-label">
                          <i className="fa fa-user dashboard-me-2 dashboard-primary-color" />
                          <strong>Name</strong>
                        </div>
                        <div className="dashboard-info-value">{userInfo.name || "Not provided"}</div>
                      </div>
                    </Col>
                    <Col md="4">
                      <div className="dashboard-info-item dashboard-mb-3">
                        <div className="dashboard-info-label">
                          <i className="fa fa-envelope dashboard-me-2 dashboard-primary-color" />
                          <strong>Email</strong>
                        </div>
                        <div className="dashboard-info-value">{userInfo.email || "Not provided"}</div>
                      </div>
                    </Col>
                    <Col md="4">
                      <div className="dashboard-info-item dashboard-mb-3">
                        <div className="dashboard-info-label">
                          <i className="fa fa-phone dashboard-me-2 dashboard-primary-color" />
                          <strong>Phone</strong>
                        </div>
                        <div className="dashboard-info-value">{userInfo.phone || "Not provided"}</div>
                      </div>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
            <Card className="dashboard-shadow-sm">
              <CardBody>
                <div className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-mb-4">
                  <div>
                    <h5 className="dashboard-mb-1 dashboard-section-title">
                      <i className="fa fa-map-marker dashboard-me-2 dashboard-primary-color" />
                      Address Information
                    </h5>
                    <p className="dashboard-text-muted dashboard-mb-0 dashboard-small">Manage your billing and shipping addresses</p>
                  </div>
                  <Button
                    color={editingAddress ? "success" : "primary"}
                    size="sm"
                    onClick={() => setEditingAddress(!editingAddress)}
                    className={editingAddress ? "dashboard-btn-success-custom-xs" : "dashboard-btn-primary-custom-xs"}
                  >
                    <i className={`fa ${editingAddress ? "fa-check" : "fa-edit"} dashboard-me-1`} />
                    {editingAddress ? "Save" : "Edit"}
                  </Button>
                </div>
                {editingAddress ? (
                  <Row>
                    <Col md="6">
                      <FormGroup className="dashboard-mb-3">
                        <Label className="dashboard-form-label">
                          <i className="fa fa-credit-card dashboard-me-2 dashboard-text-muted" />
                          Billing Address
                        </Label>
                        <Input
                          type="textarea"
                          rows="4"
                          value={userInfo.billingAddress}
                          onChange={(e) => handleUserEdit("billingAddress", e.target.value)}
                          placeholder="Enter your billing address"
                          className="dashboard-form-control-custom"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup className="dashboard-mb-3">
                        <Label className="dashboard-form-label">
                          <i className="fa fa-truck dashboard-me-2 dashboard-text-muted" />
                          Shipping Address
                        </Label>
                        <Input
                          type="textarea"
                          rows="4"
                          value={userInfo.shippingAddress}
                          onChange={(e) => handleUserEdit("shippingAddress", e.target.value)}
                          placeholder="Enter your shipping address"
                          className="dashboard-form-control-custom"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                ) : (
                  <Row>
                    <Col md="6">
                      <div className="dashboard-address-card">
                        <div className="dashboard-address-header">
                          <i className="fa fa-credit-card dashboard-me-2 dashboard-primary-color" />
                          <strong>Billing Address</strong>
                        </div>
                        <div className="dashboard-address-content">
                          {userInfo.billingAddress || (
                            <span className="dashboard-text-muted">
                              <i className="fa fa-plus-circle dashboard-me-2" />
                              No billing address added yet
                            </span>
                          )}
                        </div>
                      </div>
                    </Col>
                    <Col md="6">
                      <div className="dashboard-address-card">
                        <div className="dashboard-address-header">
                          <i className="fa fa-truck dashboard-me-2 dashboard-primary-color" />
                          <strong>Shipping Address</strong>
                        </div>
                        <div className="dashboard-address-content">
                          {userInfo.shippingAddress || (
                            <span className="dashboard-text-muted">
                              <i className="fa fa-plus-circle dashboard-me-2" />
                              No shipping address added yet
                            </span>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </div>
        );

      default:
        return (
          <div>
            <div className="dashboard-page-title dashboard-mb-4">
              <h2>Dashboard</h2>
              <p className="dashboard-text-muted">Welcome back, {userInfo.name || "User"}!</p>
            </div>
            <Row className="dashboard-mb-4">
              {[
                { icon: "fa-shopping-bag", count: orders.length, label: "Total Orders" },
                { icon: "fa-check-circle", count: orders.filter((order) => order.orderAcceptStatus?.toLowerCase() === "delivered").length, label: "Delivered Orders" },
                { icon: "fa-heart", count: enrichedWishlistData.length, label: "Wishlist Items" },
              ].map((stat, idx) => (
                <Col md="4" className="dashboard-mb-4" key={idx}>
                  <Card className="dashboard-text-center dashboard-shadow-sm dashboard-stat-card">
                    <CardBody>
                      <i className={`fa ${stat.icon} fa-3x dashboard-mb-3 dashboard-primary-color`} />
                      <h3 className="dashboard-fw-bold dashboard-section-title">
                        {stat.count}
                      </h3>
                      <p className="dashboard-text-muted dashboard-mb-0">{stat.label}</p>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
            <Row>
              <Col md="6" className="dashboard-mb-4">
                <Card className="dashboard-shadow-sm dashboard-h-100">
                  <CardBody>
                    <h5 className="dashboard-mb-3">Recent Orders</h5>
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-py-3 dashboard-border-bottom">
                        <div>
                          <p className="dashboard-mb-1 dashboard-fw-bold">Order #{order.id}</p>
                          <small className="dashboard-text-muted">{formatDate(order.creationTime)}</small>
                        </div>
                        <div className="dashboard-text-end">
                          <p className="dashboard-mb-1 dashboard-fw-bold dashboard-primary-color">
                            {symbol}{order.finalOrderTotal.toFixed(2)}
                          </p>
                          <Badge color={getStatusColor(order.orderAcceptStatus || "Pending")}>
                            {order.orderAcceptStatus || "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && <p className="dashboard-text-muted dashboard-text-center dashboard-py-3">No orders found</p>}
                    <div className="dashboard-text-center dashboard-mt-3">
                      <Button color="outline-primary" onClick={() => setActiveTab("orders")} className="dashboard-btn-action">
                        View All Orders
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md="6" className="dashboard-mb-4">
                <Card className="dashboard-shadow-sm dashboard-h-100">
                  <CardBody>
                    <h5 className="dashboard-mb-3">Account Summary</h5>
                    <div className="dashboard-py-2">
                      <p className="dashboard-mb-2">
                        <strong>Name:</strong> {userInfo.name || "Not provided"}
                      </p>
                      <p className="dashboard-mb-2">
                        <strong>Email:</strong> {userInfo.email || "Not provided"}
                      </p>
                      <p className="dashboard-mb-2">
                        <strong>Phone:</strong> {userInfo.phone || "Not provided"}
                      </p>
                    </div>
                    <div className="dashboard-text-center dashboard-mt-3">
                      <Button color="outline-primary" onClick={() => setActiveTab("account")} className="dashboard-btn-action">
                        Edit Profile
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        );
    }
  }, [
    activeTab,
    enrichedWishlistData,
    symbol,
    value,
    orders,
    filteredOrders,
    loading,
    error,
    userInfo,
    editingUser,
    editingAddress,
    fromDate,
    toDate,
    expandedOrderId,
    renderWishlistItem,
    handleFilter,
    formatDate,
    getStatusColor,
    handleUserEdit,
    toasts,
    removeToast,
  ]);

  return (
    <>
      <Breadcrumb title="Dashboard" parent="Home" />
      <Container fluid className="dashboard-container">
        <Row>
          <Col lg="3" md="4" className="dashboard-mb-4">
            <Card className="dashboard-sidebar dashboard-shadow-sm dashboard-h-100">
              <CardBody>
                <div className="dashboard-user-profile-info dashboard-text-center dashboard-mb-4">
                  <div className="dashboard-user-avatar dashboard-mb-3 dashboard-flex dashboard-justify-content-center">
                    <ProfileAvatar name={userInfo.name || "User"} size={80} />
                  </div>
                  <h5 className="dashboard-mb-1 dashboard-fw-bold">{userInfo.name || "User"}</h5>
                  <p className="dashboard-text-muted dashboard-small dashboard-mb-0">{userInfo.email || "No email provided"}</p>
                </div>
                <div className="dashboard-menu">
                  {[
                    { key: "dashboard", icon: "fa-tachometer", label: "Dashboard" },
                    { key: "orders", icon: "fa-shopping-bag", label: "My Orders" },
                    { key: "wishlist", icon: "fa-heart", label: "My Wishlist" },
                    { key: "account", icon: "fa-user", label: "Account Info" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`dashboard-menu-item ${activeTab === item.key ? "dashboard-active" : ""}`}
                      onClick={() => setActiveTab(item.key as any)}
                    >
                      <i className={`fa ${item.icon} dashboard-me-2`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="9" md="8">
            <div className="dashboard-content">{renderDashboardContent()}</div>
          </Col>
        </Row>
      </Container>
      <Modal
        isOpen={confirmModal.isOpen}
        toggle={() => setConfirmModal({ isOpen: false, action: "", item: null })}
        centered
      >
        <ModalHeader toggle={() => setConfirmModal({ isOpen: false, action: "", item: null })}>
          Confirm Action
        </ModalHeader>
        <ModalBody>Are you sure you want to remove this item from your wishlist?</ModalBody>
        <ModalFooter>
          <div className="dashboard-action-button-group dashboard-w-100 dashboard-justify-content-end">
            <Button
              color="secondary"
              onClick={() => setConfirmModal({ isOpen: false, action: "", item: null })}
              className="dashboard-btn-secondary-custom"
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => {
                if (confirmModal.item) {
                  removeFromWish(confirmModal.item);
                  showToast('info', 'Item Removed', `${confirmModal.item.title} has been removed from your wishlist.`);
                  setConfirmModal({ isOpen: false, action: "", item: null });
                }
              }}
              className="dashboard-btn-danger-custom"
            >
              Remove
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Dashboard;