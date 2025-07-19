import { createContext } from "react";

interface ContextProps {
  cartItems: any;
  cartTotal: number;
  addToCart: (item: any) => boolean; // Return boolean to indicate success
  updateQty: Function;
  removeFromCart: Function;
  emptyCart: Function;
  isProductInCart: (productId: string) => boolean; // New function to check if product exists
}

export const CartContext = createContext({} as ContextProps);