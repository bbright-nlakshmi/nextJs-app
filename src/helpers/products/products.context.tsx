import { Product } from "@/app/globalProvider";
import { createContext } from "react";

interface ContextProps {
  products: Product[] ;
  addProducts: Function;
  
}

export const ProductContext = createContext({} as ContextProps);
