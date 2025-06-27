import { createContext } from "react";
import { Product } from "@/app/models/product/product"; // Updated to match your import

interface CompareContextProps {
  compareItems: Product[];
  addToCompare: (item: Product) => void;
  removeFromCompare: (item: Product) => void;
  clearCompare: () => void;
}

export const CompareContext = createContext<CompareContextProps>({
  compareItems: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
});