import React, { useState, useEffect } from "react";
import { CartContext, CartItem } from "./cart.context";
import { toast } from "react-toastify";
import { API } from "@/app/globalProvider";
import { CartModel } from "@/app/globalProvider";

const getLocalCartItems = () => {
  try {
    const list = localStorage.getItem("cartList");
    return list ? JSON.parse(list) : [];
  } catch {
    return [];
  }
};

const getPhoneNumber = (): string => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("Login") || "";
    }
    return "";
};

export const CartProvider = (props: any) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(getLocalCartItems());
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    const phoneNumber = getPhoneNumber();
    console.log("[CartProvider] Loaded userPhone from localStorage:", phoneNumber);
    if (!phoneNumber) return;

    (async () => {
      try {
        const items = await API.getCartItems(phoneNumber);
        setCartItems(
          items.map((item: any) => ({
            ...item,
            qty: item.qty || 1,
            cartItemId: item.cartItemId,
          }))
        );
      } catch (err) {
        console.error("Failed to load remote cart, using local storage:", err);
        setCartItems(getLocalCartItems());
      }
    })();
  }, []);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.price);
      const qty = Number(item.qty);
      return sum + price * qty;
    }, 0);

    setCartTotal(total);
    localStorage.setItem("cartList", JSON.stringify(cartItems));
  }, [cartItems]);

  // Check if product is already in cart
  // Check if product-option is already in cart
  const isProductInCart = (cartItemId: string): boolean => {
    return cartItems.some((item) => item.cartItemId === cartItemId);
  };

  // Get product-option quantity from cart
  const getProductQuantity = (cartItemId: string): number => {
    const item = cartItems.find((item) => item.cartItemId === cartItemId);
    return item ? item.qty : 0;
  };

  // Find existing product in cart
  const findExistingProduct = (item: any) => {
    return cartItems.find(
      (cartItem) =>
        //cartItem.id === item.id ||
        cartItem.cartItemId === item.cartItemId
      //cartItem.productId === item.id
    );
  };

  // Find cart item helper
  const findCartItem = (item: any): CartItem | undefined => {
    return findExistingProduct(item);
  };

  const addToCart = async (item: any, quantity: number = 1): Promise<boolean> => {
    const saleMode: string | undefined = item.saleMode ?? item.salemode;
    const productId = item.productId || item.id;
    // const { productId, saleMode } = item;
    const optionKey: string = String(
      item.cartPurchaseOptionStr ??
        item.purchaseOptionStr ??
        item.sellingDisplayOption ??
        "default"
    );

    // Use composite key for uniqueness
    const cartItemId: string = item.cartItemId ?? `${productId}-${optionKey}`;

    const existingProduct = cartItems.find(
      (ci) => ci.cartItemId === cartItemId
    );

    const stock = Number(item.stock ?? item.availableStock ?? 0);
    const newQuantity = (existingProduct?.qty || 0) + quantity;

    // ✅ check stock before updating cart
    if (stock > 0 && newQuantity > stock) {
      toast.error(`Only ${stock} item(s) available in stock`);
      return false;
    }
    console.log("[CartProvider] addToCart called:", { item, quantity });
    const phoneNumber = getPhoneNumber();

    if (saleMode === "custom") {
      if (existingProduct) {
        // Already in cart, do nothing
        toast.info("This item is already in your cart");
        return false;
      }

      const newItem: CartItem = {
        ...item,
        qty: 1, // always 1
        cartItemId,
        id: productId || item.id,
        purchaseOptionStr: optionKey,
        saleMode,
      };

      setCartItems((prev) => [...prev, newItem]);
      toast.success(" Item added to cart!");

       if (phoneNumber) {
        try {
          console.log("[CartProvider] Calling API.saveCartItems with:", {
             phoneNumber,
          itemId: item.id,
          qty: quantity,
        });
          const cartModel = new CartModel({
            id: productId,
            storeId: item.storeId,
            cartItemCount: quantity,
            cartPurchaseOptionStr: optionKey,
          });
          await API.saveCartItems(phoneNumber, cartModel);
        } catch (err) {
          console.error("Failed to sync addToCart:", err);
        }
      }

      return true;
    }
    if (existingProduct) {
      // Normal mode → increase quantity
      const updated = await updateQty(existingProduct, newQuantity);
      if (updated) {
        toast.success(
          `Product quantity updated! Now ${newQuantity} item(s) in cart`
        );
        return true;
      }
      return false;
    }

    const newItem: CartItem = {
      ...item,
      qty: quantity,
      cartItemId,
      id: productId || item.id,
      purchaseOptionStr: optionKey,
      saleMode,
    };

    setCartItems((prev) => [...prev, newItem]);
    toast.success(`${quantity} item(s) added to cart!`);

    if (phoneNumber) {
      try {
        const cartModel = new CartModel({
          id: productId,
          storeId: item.storeId,
          cartItemCount: quantity,
          cartPurchaseOptionStr: optionKey,
        });
        await API.saveCartItems(phoneNumber, cartModel);
      } catch (err) {
        console.error("Failed to sync addToCart:", err);
      }
    }

    return true;
  };

  const updateQty = async (item: CartItem, quantity: number): Promise<boolean> => {
    const saleMode = (item as any).saleMode ?? (item as any).salemode;
    if (saleMode === "custom") {
      toast.info("Custom items always have quantity = 1");
      return false;
    }

    const stock = Number(item.stock ?? (item as any).availableStock ?? 0);
    if (stock > 0 && quantity > stock) {
      return false;
    }

    if (quantity >= 1) {
      setCartItems((prev) =>
        prev.map((ci) =>
          ci.cartItemId === item.cartItemId ? { ...ci, qty: quantity } : ci
        )
      );
      toast.info("Product Quantity Updated!");

      const phoneNumber = getPhoneNumber();
      if (phoneNumber) {
        try {
          const cartModel = new CartModel({
            id: item.id,
            storeId: item.storeId,
            cartItemCount: quantity,
            cartPurchaseOptionStr: item.purchaseOptionStr ?? "",
          });
          await API.saveCartItems(phoneNumber, cartModel);
        } catch (err) {
          console.error("Failed to sync updateQty:", err);
        }
      }
      return true;
    }
    return false;
  };

  const removeFromCart = async (item: CartItem): Promise<boolean> => {
    toast.error("Product Removed from Cart");
    setCartItems((prev) =>
      prev.filter((e) => e.cartItemId !== item.cartItemId)
    );
    const phoneNumber = getPhoneNumber();
      if (phoneNumber) {
      try {
        const cartModel = new CartModel({
          id: item.id,
          storeId: item.storeId,
          cartItemCount: 0,
          cartPurchaseOptionStr: item.purchaseOptionStr ?? "",
        });
        await API.deleteCartItems(phoneNumber, cartModel);
      } catch (err) {
        console.error("Failed to sync removeFromCart:", err);
      }
    }
    return true;
  };

  const emptyCart = async () => {
    // toast.error("Cart is empty");
    setCartItems([]);
    const phoneNumber = getPhoneNumber();
    if (phoneNumber) {
      try {
        for (const item of cartItems) {
          const cartModel = new CartModel({
            id: item.id,
            storeId: item.storeId,
            cartItemCount: 0,
            cartPurchaseOptionStr: item.purchaseOptionStr ?? "",
          });
          await API.deleteCartItems(phoneNumber, cartModel);
        }
      } catch (err) {
        console.error("Failed to sync emptyCart:", err);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        addToCart,
        updateQty,
        removeFromCart,
        emptyCart,
        isProductInCart,
        getProductQuantity,
        findCartItem,
      }}
    >
      {props.children}
    </CartContext.Provider>
  );
};
