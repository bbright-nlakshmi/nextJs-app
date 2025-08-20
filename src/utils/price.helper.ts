interface PriceParams {
  price?: number;                  // fallback single price
  discount?: number | { discount?: number }; // allow object or number
  sellingPrices?: number[];        // sizes
  activeIndex?: number | null;     // selected size
}

export const getProductFinalPrice = ({
  price,
  discount,
  sellingPrices = [],
  activeIndex = null,
}: PriceParams): number => {
  // ✅ Pick correct base price
  let basePrice : number;

  if (sellingPrices.length > 0) {
    if (activeIndex !== null && sellingPrices[activeIndex] !== undefined) {
      basePrice = sellingPrices[activeIndex];
    } else {
      basePrice = sellingPrices[0];
    }
  } else {
    basePrice = price && price > 0 ? price : 0; 
  }

  // ✅ Extract discount whether it's a number or object
  const discountValue =
    typeof discount === "object"
      ? discount?.discount ?? 0
      : discount ?? 0;

  // ✅ Apply discount
  if (discountValue > 0) {
    return basePrice - (basePrice * discountValue) / 100;
  }

  return basePrice;
};
