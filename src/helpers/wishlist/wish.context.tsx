import React, { createContext, PropsWithChildren } from "react";
import { useWishlistStore, WishlistProduct } from "../wishlist/wishlistStore";

// ✅ Define the shape of the context (Zustand-style)
interface WishlistContextType {
  wishlistItems: WishlistProduct[];
  addToWish: (product: WishlistProduct) => void;
  removeFromWish: (product: WishlistProduct) => void;
  setWishlistItems: (items: WishlistProduct[]) => void;
}

// ✅ Create the context
export const WishlistContext = createContext<WishlistContextType>({
  wishlistItems: [],
  addToWish: () => {},
  removeFromWish: () => {},
  setWishlistItems: () => {},
});

// ✅ Provider component using Zustand underneath
export const WishlistProvider = ({ children }: PropsWithChildren<{}>) => {
  const {
    wishlistItems,
    addToWish,
    removeFromWish,
    setWishlistItems,
  } = useWishlistStore();

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, addToWish, removeFromWish, setWishlistItems }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
