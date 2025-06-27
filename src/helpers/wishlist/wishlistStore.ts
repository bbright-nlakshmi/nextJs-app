// stores/wishlistStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

// Product interface
export interface WishlistProduct {
  productId: string;
  title: string;
  img: string[];
  price: number;
  stock?: number;
  variantId?: string;
  uuid?: string; // Add uuid to the interface
  [key: string]: any;
}

// Zustand store type
interface WishlistStore {
  wishlistItems: WishlistProduct[];
  addToWish: (product: WishlistProduct) => void;
  removeFromWish: (product: WishlistProduct) => void;
  setWishlistItems: (items: WishlistProduct[]) => void;
}

// Helper function to create a unique identifier for products
const createProductKey = (product: WishlistProduct): string => {
  // If product already has a uuid, use it as the primary identifier
  if (product.uuid) {
    return product.uuid;
  }
  
  // Create a more comprehensive key that includes multiple identifying factors
  const keyParts = [
    product.productId || 'no-id',
    product.variantId || 'no-variant',
    product.title || 'no-title',
    (product.price !== undefined && product.price !== null) ? product.price.toString() : 'no-price',
    // Add any other distinguishing properties here
    product.stock?.toString() || 'no-stock',
    // You can add more fields like category, brand, etc.
  ];
  return keyParts.join('|');
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlistItems: [],

      addToWish: (product) => {
        // Just handle undefined values gracefully without strict validation
        if (!product || typeof product !== 'object') {
          toast.error("Invalid product data.");
          return;
        }

        const productKey = createProductKey(product);
        
        const alreadyExists = get().wishlistItems.some(
          (item) => createProductKey(item) === productKey
        );

        if (alreadyExists) {
          toast.error("This Product Already Added!");
          return;
        }

        const newItem = { ...product, uuid: uuidv4() };
        set({ wishlistItems: [...get().wishlistItems, newItem] });
        toast.success("Product Added to Wishlist Successfully!");
      },

      removeFromWish: (product) => {
        const productKey = createProductKey(product);
        
        const filtered = get().wishlistItems.filter(
          (item) => createProductKey(item) !== productKey
        );
        set({ wishlistItems: filtered });
        toast.info("Product Removed from Wishlist.");
      },

      setWishlistItems: (items) => {
        set({ wishlistItems: items });
      },
    }),
    {
      name: "wishlist-store", // localStorage key
    }
  )
);