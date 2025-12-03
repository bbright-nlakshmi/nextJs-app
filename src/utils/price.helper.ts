interface PriceParams {
  price?: number;                  // fallback single price
  discount?: number | { discount?: number }; // allow object or number
  sellingPrices?: number[];  
  sellingPrice?:number;      // sizes
  activeIndex?: number | null;     // selected size
}

export const getProductFinalPrice = ({
  price,
  discount,
  sellingPrices = [],
  sellingPrice,
  activeIndex = null,
}: PriceParams): number => {
  // ✅ Pick correct base price
  let basePrice : number = 0;

  if (sellingPrices.length > 0) {
    basePrice =
      activeIndex !== null && sellingPrices[activeIndex] !== undefined
        ? sellingPrices[activeIndex]
        : sellingPrices[0];
  }  else if (sellingPrice) {
    basePrice = sellingPrice;
  } else {
    basePrice = price && price > 0 ? price : 0; 
  }

  if (!basePrice || basePrice <= 0) return 0;

  // ✅ Extract discount whether it's a number or object
  const discountValue =
    typeof discount === "object"
      ? discount?.discount ?? (discount as any)?.percentage ?? 0
      : discount ?? 0;

  // ✅ Apply discount
  if (discountValue > 0) {
    return basePrice - (basePrice * discountValue) / 100;
  }

  return basePrice;
};
