// wish.provider.tsx
import React, { PropsWithChildren } from "react";
import { WishlistContext } from "./wish.context";
import { useWishlistStore } from "../../../src/helpers/wishlist/wishlistStore";
import { WishlistProduct } from "../../../src/helpers/wishlist/wishlistStore";

export const WishlistProvider = ({ children }: PropsWithChildren<{}>) => {
  const {
    wishlistItems,
    addToWish,
    removeFromWish,
    setWishlistItems,
  } = useWishlistStore();

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWish,
        removeFromWish,
        setWishlistItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
