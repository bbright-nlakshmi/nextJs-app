import React, { useState, useEffect } from "react";
import { ProductContext } from "./products.context";
import { Product } from "@/app/globalProvider";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

const getLocalCartItems = () => {
  try {
    const list = localStorage.getItem("cartList");
    return list ? JSON.parse(list) : [];
  } catch {
    return [];
  }
};

export const ProductsProvider = (props: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  
const addProducts = (products:Product[]) => {
    setProducts(products);
  };
  useEffect(() => {
   
  }, [products]);

  return (
    <ProductContext.Provider value={{products,addProducts}}>
      {props.children}
    </ProductContext.Provider>
  );
};
