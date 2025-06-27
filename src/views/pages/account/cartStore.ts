// cartStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
 
export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}
 
interface CartStore {
  cartItems: CartItem[];
  cartTotal: number;
  setCartItems: (items: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  emptyCart: () => void;
  calculateTotal: () => void;
}
 
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartItems: [],
      cartTotal: 0,
 
      setCartItems: (items) => {
        set({ cartItems: items });
        get().calculateTotal();
      },
 
      addToCart: (item) => {
        const existing = get().cartItems;
        const index = existing.findIndex(i => i.id === item.id);
 
        let updatedItems;
        if (index >= 0) {
          updatedItems = [...existing];
          updatedItems[index].qty += item.qty;
        } else {
          updatedItems = [...existing, item];
        }
 
        set({ cartItems: updatedItems });
        get().calculateTotal();
      },
 
      removeFromCart: (id) => {
        const updatedItems = get().cartItems.filter(item => item.id !== id);
        set({ cartItems: updatedItems });
        get().calculateTotal();
      },
 
      updateQuantity: (id, qty) => {
        if (qty <= 0) {
          get().removeFromCart(id);
          return;
        }
 
        const updatedItems = get().cartItems.map(item =>
          item.id === id ? { ...item, qty } : item
        );
        set({ cartItems: updatedItems });
        get().calculateTotal();
      },
 
      emptyCart: () => {
        set({ cartItems: [], cartTotal: 0 });
      },
 
      calculateTotal: () => {
        const items = get().cartItems;
        const total = items.reduce((acc, item) => {
          const itemTotal = Number(item.price) * Number(item.qty);
          return acc + (isNaN(itemTotal) ? 0 : itemTotal);
        }, 0);
 
        set({ cartTotal: total });
      }
    }),
    {
      name: "cart-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({
        cartItems: state.cartItems,
        cartTotal: state.cartTotal
      }),
    }
  )
);