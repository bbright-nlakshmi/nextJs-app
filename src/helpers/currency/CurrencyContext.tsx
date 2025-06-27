import { createContext, useState } from "react";

interface ContextProps {
  selectedCurrency: Function;
  selectedCurr: { currency: string; symbol: string; value: number };
}
export const Context = createContext({} as ContextProps);

export const Provider = (props: any) => {
  const [selectedCurr, selectedCurrency] = useState({ currency: "In", symbol: "₹", value: 1 });

  const currencyContext = {
    selectedCurr,
    selectedCurrency,
  };

  return <Context.Provider value={currencyContext}> {props.children}</Context.Provider>;
};

export const { Consumer } = Context;

export { Context as CurrencyContext, Provider as CurrencyContextProvider } from "./CurrencyContext";
