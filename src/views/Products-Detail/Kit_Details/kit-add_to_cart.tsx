import React, { useContext, useState } from "react";
import { Input } from "reactstrap";
import { useRouter } from "next/navigation";
import CountDownComponent from "../../layouts/widgets/CountDownComponent";
import { CartContext } from "@/helpers/cart/cart.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { Kit } from "@/app/models/models";
import { getProductFinalPrice } from "@/utils/price.helper";
import { objCache } from "@/app/globalProvider";
import { getSizeLabel } from "@/utils/Labels";

interface ProductRightProps {
  item: any;
}

const KitAddToCart: React.FC<ProductRightProps> = ({ item }) => {
  const [qty, setQty] = useState(item.minCount || 1);
  const [stock, setStock] = useState(item.isInStock() ? "InStock" : "OutOfStock");
  const [warning, setWarning] = useState<string>("");
  const [activesize, setActiveSize] = useState<string | null>(null);

  const { addToCart } = useContext(CartContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const router = useRouter();
  const { symbol, value } = selectedCurr;

  // Ensure currency value is valid, default to 1 if not
  const currencyValue = (typeof value === 'number' && !isNaN(value) && value > 0) ? value : 1;
  
  // Get product info from cache
  const productInfo = objCache.getProductById(item?.productId || item?.id);
  
  // Get size options
  const uniqueSizes: string[] = item?.sellingDisplayOptions || productInfo?.sellingDisplayOptions || [];
  const sizePrices: number[] = item?.sellingPrices || productInfo?.sellingPrices || [];
  const sizePrice: number = item?.sellingPrice || productInfo?.sellingPrice || 0;

  // Initialize active size
  React.useEffect(() => {
    if (uniqueSizes.length && !activesize) {
      setActiveSize(uniqueSizes[0]);
    }
  }, [uniqueSizes]);

  // Enhanced price calculation for kit products
  const getPrice = () => {
    // Check all possible price fields
    const priceFields = [
      'kitPrice', 'totalPrice', 'salePrice', 'price', 
      'sellingPrice', 'finalPrice', 'amount', 'cost',
      'basePrice', 'originalPrice'
    ];
    
    for (const field of priceFields) {
      if (item[field] && typeof item[field] === 'number' && item[field] > 0) {
        return item[field];
      }
    }
    
    // Check function-based pricing
    if (item.getProductPrice && typeof item.getProductPrice === 'function') {
      const price = item.getProductPrice();
      if (price && price > 0) {
        return price;
      }
    }
    
    // Check sellingPrices array
    if (item.sellingPrices && Array.isArray(item.sellingPrices) && item.sellingPrices.length > 0) {
      for (const price of item.sellingPrices) {
        if (typeof price === 'number' && price > 0) {
          return price;
        }
      }
    }

    // Calculate from kit items if available
    if (item.kitItems && Array.isArray(item.kitItems) && item.kitItems.length > 0) {
      const calculatedPrice = item.kitItems.reduce((total: number, kitItem: any) => {
        const itemPrice = kitItem.inKitSalePrice || kitItem.salePrice || kitItem.price || 0;
        const itemQuantity = kitItem.inKitQuantity || 1;
        return total + (itemPrice * itemQuantity);
      }, 0);
      if (calculatedPrice > 0) {
        return calculatedPrice;
      }
    }

    // Check if price is stored as string and convert
    for (const field of priceFields) {
      if (item[field] && typeof item[field] === 'string') {
        const numPrice = parseFloat(item[field]);
        if (!isNaN(numPrice) && numPrice > 0) {
          return numPrice;
        }
      }
    }

    // Check nested objects for price
    if (item.pricing && typeof item.pricing === 'object') {
      for (const field of priceFields) {
        if (item.pricing[field] && typeof item.pricing[field] === 'number' && item.pricing[field] > 0) {
          return item.pricing[field];
        }
      }
    }

    return 0;
  };

  const getDiscount = () => {
    if (item.getDiscount && typeof item.getDiscount === 'function') {
      return item.getDiscount();
    }
    if (item.discount && item.discount > 0) return item.discount;
    if (item.discountPercentage && item.discountPercentage > 0) return item.discountPercentage;
    return 0;
  };

  const basePrice = getPrice();
  const discount = getDiscount();
  
  // Get final price with size consideration
  const getFinalPrice = () => {
    return getProductFinalPrice({
      price: sizePrice || basePrice,
      discount: discount,
      sellingPrices: sizePrices,
      activeIndex: activesize ? uniqueSizes.indexOf(activesize) : 0,
    });
  };

  let finalPrice = getFinalPrice();
  
  // Ensure price is never negative
  finalPrice = Math.max(finalPrice, 0);

  const minusQty = () => {
    if (qty > (item.minCount || 1)) {
      setStock("InStock");
      setQty(qty - 1);
    } else {
      setStock("Minimum limit reached");
    }
  };

  const plusQty = () => {
    if (item.isInOrderStock && item.isInOrderStock(qty + 1)) {
      setQty(qty + 1);
      setStock("InStock");
    } else if (qty < (item?.maxCount || productInfo?.maxCount)) {
      setQty(qty + 1);
      setStock("InStock");
    } else {
      setStock("Out of Stock !");
    }
  };

  const changeQty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseInt(e.target.value);
    if (!isNaN(newQty) && newQty >= (item.minCount || 1)) {
      if (item.isInOrderStock && item.isInOrderStock(newQty)) {
        setQty(newQty);
        setStock("InStock");
      } else if (newQty <= (item?.maxCount || productInfo?.maxCount)) {
        setQty(newQty);
        setStock("InStock");
      } else {
        setStock("Out of Stock !");
      }
    }
  };

  // Size selection handler
  const handleSelectSize = (size: string) => {
    setActiveSize(size);
    setWarning("");
  };

  // Enhanced Add to Cart functionality
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if size selection is required
    if (uniqueSizes.length && !activesize) {
      setWarning("⚠️ Please select an option before adding to cart.");
      return;
    }

    // Check stock before adding
    if (item.stock && qty > item.stock) {
      setStock("Out of Stock !");
      return;
    }

    // Check if item is in order stock
    if (item.isInOrderStock && !item.isInOrderStock(qty)) {
      setStock("Out of Stock !");
      return;
    }

    const finalPrice = getFinalPrice();

    addToCart(
      {
        ...item,
        id: item.productId ?? item.id,
        selectedSize: activesize,
        price: finalPrice,
        cartItemCount: qty,
        cartPurchaseOptionStr: activesize || "",
        getPriceWithDiscount: () => finalPrice,
      },
      qty
    );
    
    setWarning("");
    setStock("Added to cart successfully!");
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      if (stock === "Added to cart successfully!") {
        setStock("InStock");
      }
    }, 3000);
  };

  // Enhanced Buy Now functionality
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if size selection is required
    if (uniqueSizes.length && !activesize) {
      setWarning("⚠️ Please select an option before Buy Now.");
      return;
    }

    // Stock check
    if (item.stock && qty > item.stock) {
      setStock("Out of Stock !");
      return;
    }

    // Check if item is in order stock
    if (item.isInOrderStock && !item.isInOrderStock(qty)) {
      setStock("Out of Stock !");
      return;
    }

    const finalPrice = getFinalPrice();

    try {
      sessionStorage.setItem(
        "buyNowProduct",
        JSON.stringify({
          id: item.id,
          name: item.name,
          img: item.img,
          quantity: qty,
          selectedSize: activesize,
          price: finalPrice,
          cartItemCount: qty,
          cartPurchaseOptionStr: activesize || "",
          getPriceWithDiscount: () => finalPrice,
        })
      );
      sessionStorage.setItem("checkoutMode", "buyNow");
    } catch (err) {
      console.error("Session storage error:", err);
    }

    setWarning("");
    router.push("/pages/account/checkout");
  };

  return (
    <div className="product-right product-form-box">
      <h2>{item.name}</h2>
      
      {/* Enhanced Price Display */}
      {finalPrice > 0 ? (
        item.isDiscount() || discount > 0 ? (
          <>
            <h4>
              <del>
                {symbol}{(basePrice * currencyValue).toFixed(2)}
              </del>
              <span>{discount || item.getDiscount()}% off</span>
            </h4>
            <h3>
              {symbol}{(finalPrice * currencyValue).toFixed(2)}
            </h3>
          </>
        ) : (
          <h3>
            {symbol}{(finalPrice * currencyValue).toFixed(2)}
          </h3>
        )
      ) : (
        <div>
          <h3 className="text-muted">Price not available</h3>
          <small className="text-info">Contact for pricing</small>
        </div>
      )}

      <div className="product-description border-product">
        {item.isDiscount() && (
          <>
            <h6 className="product-title">Time Reminder</h6>
            {/* <CountDownComponent endDate={item.getDiscountEndDate()} /> */}
          </>
        )}
        
        {/* Size Selection */}
        {!!uniqueSizes.length && (
          <div className="product-size-selection mb-3">
            <h6 className="product-title size">size</h6>
            <div className="size-box">
              <ul>
                {uniqueSizes.map((size, i) => (
                  <li key={i} className={size === activesize ? "active" : ""}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectSize(size);
                      }}
                    >
                      {getSizeLabel(size)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {warning && (
              <div className="warning-message text-danger mb-2 mt-1">
                {warning}
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced Stock Status Display */}
        {stock !== "InStock" && stock !== "Added to cart successfully!" && (
          <span className="instock-cls text-danger">{stock}</span>
        )}
        {stock === "Added to cart successfully!" && (
          <span className="instock-cls text-success">{stock}</span>
        )}
        
        <h6 className="product-title">quantity</h6>
        <div className="qty-box">
          <div className="input-group">
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-left-minus"
                data-type="minus"
                data-field=""
                onClick={minusQty}
                disabled={qty <= (item.minCount || 1)}
              >
                <i className="ti-angle-left"></i>
              </button>
            </span>
            <Input
              type="text"
              name="quantity"
              className="form-control input-number"
              value={qty}
              onChange={changeQty}
            />
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-right-plus"
                data-type="plus"
                data-field=""
                onClick={plusQty}
                disabled={
                  item.isInOrderStock ? 
                    !item.isInOrderStock(qty + 1) : 
                    qty >= (item?.maxCount || productInfo?.maxCount)
                }
              >
                <i className="ti-angle-right"></i>
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Product Buttons */}
      <div className="product-buttons">
        <a
          href="#"
          data-toggle="modal"
          data-target="#addtocart"
          className="btn btn-normal"
          onClick={handleAddToCart}
          style={{
            opacity: finalPrice <= 0 || (item.stock && item.stock <= 0) ? 0.6 : 1,
            pointerEvents: finalPrice <= 0 || (item.stock && item.stock <= 0) ? 'none' : 'auto'
          }}
        >
          add to cart
        </a>{" "}
        <a
          href="/pages/account/checkout"
          className="btn btn-normal"
          onClick={handleBuyNow}
          style={{
            opacity: finalPrice <= 0 || (item.stock && item.stock <= 0) ? 0.6 : 1,
            pointerEvents: finalPrice <= 0 || (item.stock && item.stock <= 0) ? 'none' : 'auto'
          }}
        >
          buy now
        </a>
      </div>

      {/* Tax Notice */}
      {item.tax && (
        <div className="tax-notice mt-2 small text-muted">
          * Price includes {item.tax.name} ({item.getTaxType()})
        </div>
      )}
    </div>
  );
};

export default KitAddToCart;