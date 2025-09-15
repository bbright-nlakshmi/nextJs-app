"use client";

import React, { useEffect, useState, useContext, useCallback } from "react";
import { NextPage } from "next";
import { Row, Col, Container, Modal, ModalHeader, ModalBody, ModalFooter, Button, Card, CardBody } from "reactstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../Containers/Breadcrumb";
import { API } from "@/app/services/api.service";
import { OrderModel } from "@/app/models/order/order";
import { useWishlistStore } from "../../../helpers/wishlist/wishlistStore";
import { CartContext } from "../../../helpers/cart/cart.context";
import { CurrencyContext } from "../../../helpers/currency/CurrencyContext";
import { searchController, Kit, DeliveryAddressModel } from "@/app/globalProvider";

// ✅ Import new components
import ProfileAvatar from "@/views/components/dashboard/ProfileAvatar";
import ToastContainer, { ToastMessage } from "@/views/components/dashboard/ToastContainer";
import AddressForm from "@/views/components/dashboard/AddressForm";
import AddressList from "@/views/components/dashboard/AddressList";
import OrdersList from "@/views/components/dashboard/OrdersList";
import WishlistTable, { EnrichedWishlistItem } from "@/views/components/dashboard/WishlistTable";
import DashboardStats from "@/views/components/dashboard/DashboardStats";
import Sidebar from "@/views/components/dashboard/Sidebar";
import UserInfoForm from "@/views/components/dashboard/UserInfoForm";
import { generateUniqueId } from "@/utils/idGenerator";

// Interfaces
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

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "wishlist" | "account">("dashboard");

  // State
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "User",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
  });
  const [editingUser, setEditingUser] = useState(false);
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
  const [addresses, setAddresses] = useState<DeliveryAddressModel[]>([]);
  const [newAddress, setNewAddress] = useState<DeliveryAddressModel>(
    new DeliveryAddressModel({
      atStore: 0,
      firstName: "",
      lastName: "",
      pinCode: "",
      city: "",
      address: "",
      phoneNumber: "",
      lat: 0,
      lng: 0,
    })
  );
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // --- Toast Handling ---
  const showToast = useCallback((type: "success" | "error" | "info", title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

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

  // Load addresses when user info is available and on account tab
  useEffect(() => {
    const loadAddresses = async () => {
      if (activeTab === "account" && userInfo.phone) {
        try {
          const userAddresses: DeliveryAddressModel[] = await API.getAddresses(userInfo.phone);
          setAddresses(userAddresses);
        } catch (error) {
          console.error("Error loading addresses:", error);
          showToast('error', 'Address Error', 'Failed to load addresses');
        }
      }
    };

    loadAddresses();
  }, [activeTab, userInfo.phone]);

  const getItemKey = useCallback((item: EnrichedWishlistItem): string => {
    return item.productId || item.cartItemId || item.key || item.id || item.title || Math.random().toString();
  }, []);

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

  // Add this function to your dashboardPage.tsx
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
    [symbol, value, handleAddToCart, handleRemoveFromWishlist]
  );

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

  // --- Address Handling ---

  const handleSaveAddress = useCallback(async (addressData?: DeliveryAddressModel) => {
    try {
      const addressToSave = addressData || newAddress;
      if (!addressToSave) return;

      if (!addressToSave.id) {
        addressToSave.id = generateUniqueId();
    }
      console.log("Saving address:", addressToSave);
    console.log("JSON payload:", addressToSave.toJsonObj());
      
      await API.saveAddresses(userInfo.phone, [addressToSave]); 
      showToast("success", "Address Saved", "Your address has been saved");

      // Reload list
      const userAddresses: DeliveryAddressModel[] = await API.getAddresses(userInfo.phone);
      setAddresses(userAddresses);
      setIsAddingAddress(false);
      setEditingAddressId(null);
      setNewAddress(new DeliveryAddressModel({
        atStore: 0,
        firstName: "",
        lastName: "",
        pinCode: "",
        city: "",
        address: "",
        phoneNumber: "",
        lat: 0,
        lng: 0,
      }));
    } catch (error) {
      console.error("Error saving address:", error);
      showToast("error", "Save Error", "Failed to save address");
    }
  }, [newAddress, userInfo.phone, showToast, editingAddressId]);
  

  const handleDeleteAddress = useCallback(async (addressId: number) => {
    try {
      await API.deleteAddress(userInfo.phone, addressId.toString());
      showToast("success", "Address Deleted", "Your address has been removed");

      setAddresses((prev) => prev.filter(addr => addr.id !== addressId.toString()));
    } catch (error) {
      console.error("Error deleting address:", error);
      showToast("error", "Delete Error", "Failed to delete address");
    }
  }, [userInfo.phone, showToast]);

  const handleEditAddress = useCallback((address: DeliveryAddressModel) => {
    const editedAddress = new DeliveryAddressModel({
      id: address.id,
      atStore: address.atStore,
      firstName:  address.firstName || userInfo.name?.split(" ")[0] || "",
      lastName: address.lastName || userInfo.name?.split(" ")[1] || "",
      pinCode: address.pinCode,
      city: address.city,
      address: address.address,
      phoneNumber:  address.phoneNumber || userInfo.phone || "",
      lat:address.lat || 0,
      lng: address.lng || 0,
    });

    setNewAddress(editedAddress);
    setEditingAddressId(address.id || null);
    setIsAddingAddress(true);
  }, []);
  const handleAddNewAddress = useCallback(() => {
    setNewAddress(new DeliveryAddressModel({
      id: generateUniqueId(), // Generate new ID for new address
      atStore: 0,
      firstName: userInfo.name?.split(" ")[0] || "",
      lastName: userInfo.name?.split(" ")[1] || "",
      pinCode: "",
      city: "",
      address: "",
      phoneNumber: userInfo.phone || "",
      lat: 0,
      lng: 0,
    }));
    setEditingAddressId(null);
    setIsAddingAddress(true);
  }, [userInfo]);

  // --- Helpers ---
  const formatDate = useCallback(
    (dateStr: string) => new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    []
  );

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

    // --- User Info Handlers ---
const handleUserEdit = (field: keyof UserInfo, value: string) => {
  setUserInfo((prev) => ({ ...prev, [field]: value }));
};

const handleSaveUserInfo = () => {
  localStorage.setItem('userProfile', JSON.stringify(userInfo));
  setEditingUser(false);
  showToast("success", "Profile Updated", "Your contact information has been updated.");
};

  // Filter orders by date
  const handleFilter = useCallback(() => {
    if (!fromDate && !toDate) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.creationTime);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (from && to) {
        return orderDate >= from && orderDate <= to;
      } else if (from) {
        return orderDate >= from;
      } else if (to) {
        return orderDate <= to;
      }
      return true;
    });

    setFilteredOrders(filtered);
  }, [fromDate, toDate, orders]);
  
  // --- UI Rendering ---
  const renderDashboardContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardStats
            orders={orders}
            enrichedWishlistCount={enrichedWishlistData.length}
            userName={userInfo.name}
            userEmail={userInfo.email}  
            userPhone={userInfo.phone}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            symbol={symbol}
            setActiveTab={setActiveTab}
          />
        );

      case "wishlist":
        return (
          <WishlistTable 
            enrichedWishlistData={enrichedWishlistData} 
            renderWishlistItem={renderWishlistItem}
            handleAddToCart={handleAddToCart}
            handleRemoveFromWishlist={handleRemoveFromWishlist}
            symbol={symbol}
            value={value}
          />
        );

      case "orders":
        return (
          <OrdersList
            orders={orders}
            filteredOrders={filteredOrders}
            loading={loading}
            error={error}
            fromDate={fromDate}
            toDate={toDate}
            expandedOrderId={expandedOrderId}
            setFromDate={setFromDate}
            setToDate={setToDate}
            setFilteredOrders={setFilteredOrders}
            setExpandedOrderId={setExpandedOrderId}
            handleFilter={handleFilter}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            symbol={symbol}
          />
        );

      case "account":
        return (
          <>
            <UserInfoForm
              userInfo={userInfo}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              handleUserEdit={handleUserEdit}
              handleSaveUserInfo={handleSaveUserInfo}
            />
            {isAddingAddress && (
              <AddressForm
                address={newAddress}
                editingAddressId={editingAddressId}
                setAddress={setNewAddress}
                setIsAddingAddress={setIsAddingAddress}
                setEditingAddressId={setEditingAddressId}
                onSave={handleSaveAddress}
                onCancel={() => {
                  setIsAddingAddress(false);
                  setEditingAddressId(null);
                }}
                symbol={symbol}
                value={value}                                
              />
            )}
            {/* Address list */}
            <AddressList
              addresses={addresses} 
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              editingAddressId={editingAddressId}
              isAddingAddress={isAddingAddress}              
              symbol={symbol}
              value={value}        
              onAdd={() => setIsAddingAddress(true)}                    
            />

            {/* Button shown only when not in add/edit mode */}
            {!isAddingAddress && (
              <Button color="primary" onClick={() => setIsAddingAddress(true)}>
                + Add New Address
              </Button>
            )}
          </>
        );

      default:
        return (
          <DashboardStats
            userName={userInfo.name}
            userEmail={userInfo.email}                        
            userPhone={userInfo.phone}
            orders={orders}
            enrichedWishlistCount={enrichedWishlistData.length}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            symbol={symbol}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <>
      <Breadcrumb title="Dashboard" parent="Home" />
      <Container fluid className="dashboard-container">
        <Row>
          <Col lg="3" md="4" className="dashboard-mb-4">
            <Sidebar
              userName={userInfo.name}
              userEmail={userInfo.email}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </Col>
          <Col lg="9" md="8">
            <div className="dashboard-content">{renderDashboardContent()}</div>
          </Col>
        </Row>
      </Container>

      {/* Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Confirm Modal */}
      <Modal isOpen={confirmModal.isOpen} toggle={() => setConfirmModal({ isOpen: false, action: "", item: null })} centered>
        <ModalHeader toggle={() => setConfirmModal({ isOpen: false, action: "", item: null })}>
          Confirm Action
        </ModalHeader>
        <ModalBody>Are you sure you want to remove this item from your wishlist?</ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setConfirmModal({ isOpen: false, action: "", item: null })}>
            Cancel
          </Button>
          <Button
            color="danger"
            onClick={() => {
              if (confirmModal.item) {
                removeFromWish(confirmModal.item);
                showToast("info", "Item Removed", `${confirmModal.item.title} has been removed from your wishlist.`);
                setConfirmModal({ isOpen: false, action: "", item: null });
              }
            }}
          >
            Remove
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Dashboard;