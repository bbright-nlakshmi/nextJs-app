import React, { useState, useEffect } from "react";
import { CartContext, CartItem } from "./cart.context";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

const getLocalCartItems = () => {
  try {
    const list = localStorage.getItem("cartList");
    return list ? JSON.parse(list) : [];
  } catch {
    return [];
  }
};

export const CartProvider = (props: any) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(getLocalCartItems());
  const [cartTotal, setCartTotal] = useState(0);

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
  const isProductInCart = (productId: string): boolean => {
    return cartItems.some(
      (item) =>
        item.id === productId ||
        item.productId === productId ||
        item.key === productId
    );
  };

  // Get product quantity from cart
  const getProductQuantity = (productId: string): number => {
    const item = cartItems.find(
      (item) =>
        item.id === productId ||
        item.productId === productId ||
        item.key === productId
    );
    return item ? item.qty : 0;
  };

  // Find existing product in cart
  const findExistingProduct = (item: any) => {
    return cartItems.find(
      (cartItem) =>
        //cartItem.id === item.id ||
        cartItem.cartItemId === item.id
      //cartItem.productId === item.id
    );
  };

  // Find cart item helper
  const findCartItem = (item: any): CartItem | undefined => {
    return findExistingProduct(item);
  };

  const addToCart = (item: any, quantity: number = 1): boolean => {
  console.log("Adding to cart:", item, "Quantity:", quantity);

  const { productId, salemode, purchaseOptionStr } = item;
  // Use composite key for uniqueness
  const cartItemId = `${productId || item.id}-${purchaseOptionStr || ""}`;

  const existingProduct = cartItems.find(
    (ci) => ci.cartItemId === cartItemId
  );

  if (salemode === "custom") {
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
      purchaseOptionStr,
      salemode,
    };

    setCartItems((prev) => [...prev, newItem]);
    toast.success(" Item added to cart!");
    return true;
  } else {
    if (existingProduct) {
      // Normal mode → increase quantity
      const newQuantity = existingProduct.qty + quantity;
      updateQty(existingProduct, newQuantity);
      toast.success(
        `Product quantity updated! Now ${newQuantity} items in cart`
      );
      return true;
    }

    // Normal product, add new
    const newItem: CartItem = {
      ...item,
      qty: quantity,
      cartItemId,
      id: productId || item.id,
    };

    setCartItems((prev) => [...prev, newItem]);
    toast.success(`${quantity} item(s) added to cart!`);
    return true;
  }
  };

  const updateQty = (item: CartItem, quantity: number): boolean => {
    if (item.salemode === "custom") {
      toast.info("Custom items always have quantity = 1");
      return false;
    }
    if (quantity >= 1) {
      setCartItems((prev) =>
        prev.map((cartItem) =>
          cartItem.cartItemId === item.cartItemId
            ? {
                ...cartItem,
                qty: quantity,
              }
            : cartItem
        )
      );
      toast.info("Product Quantity Updated!");
      return true;
    } else {
      toast.error("Enter Valid Quantity!");
      return false;
    }
  };

  const removeFromCart = (item: CartItem): boolean => {
    toast.error("Product Removed from Cart Successfully!");
    setCartItems((prev) =>
      prev.filter((e) => e.cartItemId !== item.cartItemId)
    );
    return true;
  };

  const emptyCart = () => {
    // toast.error("Cart is empty");
    setCartItems([]);
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
