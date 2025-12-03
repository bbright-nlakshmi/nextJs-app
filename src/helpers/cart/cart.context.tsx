// cart.context.tsx - Updated Interface
import React, { createContext, useState, useEffect } from "react";

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
  saleMode?:string;
  [key: string]: any; // For additional properties
}

interface ContextProps {
  cartItems: CartItem[];
  cartTotal: number;
  addToCart: (item: any, quantity?: number) => Promise<boolean>;
  updateQty: (item: CartItem, quantity: number) => Promise<boolean>;
  removeFromCart: (item: CartItem) => Promise<boolean>;
  emptyCart: () => Promise<void>;
  isProductInCart: (cartItemId: string) => boolean;
  getProductQuantity: (cartItemId: string) => number;
  findCartItem: (item: any) => CartItem | undefined;
}


export const CartContext = createContext({} as ContextProps);