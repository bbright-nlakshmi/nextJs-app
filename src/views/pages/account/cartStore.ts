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
  addToCart: (item: CartItem) => boolean; // Return boolean to indicate success
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  emptyCart: () => void;
  calculateTotal: () => void;
  isProductInCart: (id: string) => boolean; // New function to check if product exists
  increaseQuantity: (id: string) => void; // New function to increase quantity of existing item
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

      isProductInCart: (id) => {
        return get().cartItems.some(item => item.id === id);
      },

      increaseQuantity: (id) => {
        const updatedItems = get().cartItems.map(item =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
        set({ cartItems: updatedItems });
        get().calculateTotal();
      },
 
      addToCart: (item) => {
        const existing = get().cartItems;
        const existingItem = existing.find(i => i.id === item.id);
 
        if (existingItem) {
          // Product already exists, don't add duplicate
          return false;
        }

        // Product doesn't exist, add it
        const updatedItems = [...existing, item];
        set({ cartItems: updatedItems });
        get().calculateTotal();
        return true;
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
      onRehydrateStorage: () => (state) => {
        // Recalculate total after rehydration
        if (state) {
          state.calculateTotal();
        }
      },
    }
  )
);