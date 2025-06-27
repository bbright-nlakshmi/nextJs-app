import React, { useState, useEffect } from "react";
import { CartContext } from "./cart.context";
import { product } from "../interfaces/product";
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
  const [cartItems, setCartItems] = useState<product[]>(getLocalCartItems());
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

  const addToCart = (item: any) => {
    toast.success("Product Added to Cart Successfully!");

    const newItem = {
      ...item,
      qty: 1,
      cartItemId: uuidv4(),
    };

    setCartItems((prev) => [...prev, newItem]);
  };

  const updateQty = (item: any, quantity: number) => {
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
    } else {
      toast.error("Enter Valid Quantity!");
    }
  };

  const removeFromCart = (item: { cartItemId: string }) => {
    toast.error("Product Removed from Cart Successfully!");
    setCartItems((prev) =>
      prev.filter((e) => e.cartItemId !== item.cartItemId)
    );
  };

  const emptyCart = () => {
    toast.error("Cart is empty");
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
      }}
    >
      {props.children}
    </CartContext.Provider>
  );
};
