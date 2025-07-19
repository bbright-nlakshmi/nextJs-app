// cart.context.tsx - Updated Interface
import { createContext } from "react";

export interface CartItem {
  id: string;
  productId?: string;
  cartItemId: string;
  key?: string;
  name: string;
  price: number;
  qty: number;
  img?: string[];
  stock?: number;
  categoryName?: string;
  purchaseOptionStr?: string;
  [key: string]: any; // For additional properties
}

interface ContextProps {
  cartItems: CartItem[];
  cartTotal: number;
  addToCart: (item: any, quantity?: number) => boolean;
  updateQty: (item: CartItem, quantity: number) => boolean;
  removeFromCart: (item: CartItem) => boolean;
  emptyCart: () => void;
  isProductInCart: (productId: string) => boolean;
  getProductQuantity: (productId: string) => number;
  findCartItem: (item: any) => CartItem | undefined;
}

export const CartContext = createContext({} as ContextProps);