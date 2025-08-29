import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { CartContext } from "@/helpers/cart/cart.context";
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { Row, Col, Card, Collapse } from "reactstrap";
import { getProductFinalPrice } from "@/utils/price.helper";
import { objCache } from "@/app/globalProvider";
import { getSizeLabel } from "@/utils/Labels";

interface OrderKitItems {
  name: string;
  inKitSalePrice: number;
  inKitQuantity: number;
  img: string[];
  inKitCount: number;
  inKitCostPrice: number;
}

interface ProductRightProps {
  item: any;
}

const KitDiscription: React.FC<ProductRightProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDetail, setIsDetail] = useState(false);
  const [quantity, setQuantity] = useState(item?.minCount || 1);
  const [stockState, setStockState] = useState("InStock");
  const [warning, setWarning] = useState<string>("");
  const [activesize, setActiveSize] = useState<string | null>(null);

  const { addToWish } = React.useContext(WishlistContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const { addToCart } = useContext(CartContext);
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
      const calculatedPrice = item.kitItems.reduce((total: number, kitItem: OrderKitItems) => {
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

  // Quantity management functions
  const minusQty = () => {
    if (quantity > (item?.minCount || productInfo?.minCount || 1)) {
      setQuantity(quantity - 1);
      setStockState("InStock");
    } else {
      setStockState("Minimum limit reached");
    }
  };

  const plusQty = () => {
    if (quantity < (item?.maxCount || productInfo?.maxCount)) {
      setQuantity(quantity + 1);
      setStockState("InStock");
    } else {
      setStockState("Maximum limit reached");
    }
  };

  const changeQty = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value) || 1;
    if (val < (item?.minCount || productInfo?.minCount || 1)) {
      val = (item.minCount || productInfo?.minCount || 1);
      setStockState("Minimum limit reached");
    } else if (val > (item?.maxCount || productInfo?.maxCount)) {
      val = (item.maxCount || productInfo?.maxCount);
      setStockState("Maximum limit reached");
    } else {
      setStockState("InStock");
    }
    setQuantity(val);
  };

  // Size selection handler
  const handleSelectSize = (size: string) => {
    setActiveSize(size);
    setWarning("");
  };

  // Add to Cart functionality
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (uniqueSizes.length && !activesize) {
      setWarning("⚠️ Please select an option before adding to cart.");
      return;
    }

    // Check stock before adding
    if (item.stock && quantity > item.stock) {
      setStockState("Out of Stock !");
      return;
    }

    const finalPrice = getFinalPrice();

    addToCart(
      {
        ...item,
        id: item.productId ?? item.id,
        selectedSize: activesize,
        price: finalPrice,
        cartItemCount: quantity,
        cartPurchaseOptionStr: activesize || "",
        getPriceWithDiscount: () => finalPrice,
      },
      quantity
    );
    setWarning("");
    setStockState("Added to cart successfully!");
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      if (stockState === "Added to cart successfully!") {
        setStockState("InStock");
      }
    }, 3000);
  };

  // Buy Now functionality
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (uniqueSizes.length && !activesize) {
      setWarning("⚠️ Please select an option before Buy Now.");
      return;
    }

    // Stock check
    if (item.stock && quantity > item.stock) {
      setStockState("Out of Stock !");
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
          quantity,
          selectedSize: activesize,
          price: finalPrice,
          cartItemCount: quantity,
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
    <div className="product-right product-description-box">
      <h2>{typeof item.name === 'string' ? item.name : typeof item.title === 'string' ? item.title : 'Kit Product'}</h2>
      <div className="product-name mb-2">
        <h4>{typeof item.label === 'string' ? item.label : typeof item.category === 'string' ? item.category : 'Kit Product'}</h4>
      </div>
      <div className="rating three-star mb-2">
        {item.rating ? (
          [...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`fa fa-star ${
                i < (item.rating.calculateRating?.() ?? 0)
                  ? "text-warning"
                  : "fa-star-o text-warning"
              }`}
            ></i>
          ))
        ) : (
          <>
            <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i>
          </>
        )}
      </div>

      {/* Enhanced Price Section */}
      <div className="product-price-section mb-3">
        {finalPrice > 0 ? (
          discount > 0 ? (
            <div>
              <h2>
                <span className="text-danger me-3">-{discount}%</span>
                <del className="text-muted">
                  M.R.P: {symbol}{(basePrice * currencyValue).toFixed(2)}
                </del>
              </h2>
              <h3 className="product-price mb--15 d-block">
                {symbol}{(finalPrice * currencyValue).toFixed(2)}
              </h3>
            </div>
          ) : (
            <h3 className="product-price mb--15 d-block">
              {symbol}{(finalPrice * currencyValue).toFixed(2)}
            </h3>
          )
        ) : (
          <div>
            <h3 className="product-price mb--15 d-block text-muted">
              Price not available
            </h3>
            <small className="text-info">Contact for pricing</small>
          </div>
        )}
      </div>

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

      {/* Quantity Selection */}
      <div className="product-description border-product mb-3">
        {stockState !== "InStock" && stockState !== "Added to cart successfully!" && (
          <span className="instock-cls text-danger">{stockState}</span>
        )}
        {stockState === "Added to cart successfully!" && (
          <span className="instock-cls text-success">{stockState}</span>
        )}
        {/* <h6 className="product-title">quantity</h6> */}
        {/* <div className="qty-box">
          <div className="input-group">
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-left-minus"
                onClick={minusQty}
                disabled={
                  (item?.saleMode === "custom") ||
                  quantity <= (item?.minCount || productInfo?.minCount || 1)
                }
              >
                <i className="ti-angle-left"></i>
              </button>
            </span>
            <input
              type="text"
              name="quantity"
              className="form-control input-number"
              value={item?.saleMode === "custom" ? 1 : quantity}
              onChange={changeQty}
              readOnly={item?.saleMode === "custom"}
            />
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-right-plus"
                onClick={plusQty}
                disabled={
                  (item?.saleMode === "custom") ||
                  quantity >= (item?.maxCount || productInfo?.maxCount)
                }
              >
                <i className="ti-angle-right"></i>
              </button>
            </span>
          </div>
        </div> */}
      </div>

      {/* Action Buttons */}
      {/* <div className="product-buttons mb-4">
        <button
          className="btn btn-solid hover-solid btn-animation me-3"
          onClick={handleAddToCart}
          disabled={finalPrice <= 0 || (item.stock && item.stock <= 0)}
        >
          <i className="fa fa-shopping-cart me-1"></i>
          Add To Cart
        </button>
        <button
          className="btn btn-solid hover-solid btn-animation"
          onClick={handleBuyNow}
          disabled={finalPrice <= 0 || (item.stock && item.stock <= 0)}
        >
          <i className="fa fa-bolt me-1"></i>
          Buy Now
        </button>
      </div> */}

      {/* Wishlist Button */}
      <div className="product-icon mb-3">
        <div className="d-inline-block">
          <button className="wishlist-btn" onClick={() => addToWish(item)}>
            <i className="fa fa-heart"></i>
            <span className="title-font">Add To WishList</span>
          </button>
        </div>
      </div>

      <Row className="product-accordion">
        <Col sm="12">
          <div className="accordion theme-accordion" id="accordionExample">
            <Card>
              <div className="card-header" id="headingOne">
                <h5 className="mb-0">
                  <button className="btn btn-link" type="button" onClick={() => setIsOpen(!isOpen)}>
                    product description
                  </button>
                </h5>
              </div>
              <Collapse isOpen={isOpen} aria-labelledby="headingOne" data-parent="#accordionExample">
                <div className="card-body">
                  <div className="single-product-tables detail-section">
                    <table>
                      <tbody>
                        <tr>
                          <td>Stock Status:</td>
                          <td>{(item.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}</td>
                        </tr>
                        {/* <tr>
                          <td>Available Quantity:</td>
                          <td>{item.stock ?? 0}</td>
                        </tr> */}
                        <tr>
                          <td>Min Order:</td>
                          <td>{item.minCount || 1}</td>
                        </tr>
                        <tr>
                          <td>Max Order:</td>
                          <td>{item.maxCount || 'No limit'}</td>
                        </tr>
                        {item.isReturnable && (
                          <tr>
                            <td>Return Policy:</td>
                            <td>Returnable within 30 days</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Product Description */}
                  {(productInfo?.description?.length || item.description) && (
                    <div className="mt-3">
                      {productInfo?.description?.length ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: typeof productInfo.description[0]?.description === 'string' 
                            ? productInfo.description[0].description.slice(0, 300)
                            : ''
                        }}></div>
                      ) : (
                        <p>{typeof item.description === 'string' ? item.description : JSON.stringify(item.description)}</p>
                      )}
                    </div>
                  )}

                  {/* Additional Product Info */}
                  <ul className="product-description-list mt-3">
                    {item?.brandName && (
                      <li>
                        <strong>Brand:</strong> {typeof item.brandName === 'string' ? item.brandName : 'N/A'}
                      </li>
                    )}
                    {item?.categoryName && (
                      <li>
                        <strong>Category:</strong> {typeof item.categoryName === 'string' ? item.categoryName : 'N/A'}
                      </li>
                    )}
                    {item?.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                      <li>
                        <strong>Tags:</strong> {item.tags.filter(tag => typeof tag === 'string').join(", ")}
                      </li>
                    )}
                  </ul>
                </div>
              </Collapse>
            </Card>
            <Card>
              <div className="card-header" id="headingTwo">
                <h5 className="mb-0">
                  <button className="btn btn-link collapsed" type="button" onClick={() => setIsDetail(!isDetail)}>
                    kit details
                  </button>
                </h5>
              </div>
              <Collapse isOpen={isDetail} id="collapseTwo" aria-labelledby="headingTwo">
                <div className="card-body">
                  {item.kitItems?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm text-center">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Qty</th>
                            <th>Total Count</th>
                            <th>Unit Price</th>
                            <th>Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.kitItems.map((kitItem: OrderKitItems, index: number) => {
                            // More robust price extraction
                            let unitPrice = 0;
                            
                            // Try different price fields and convert to number
                            const priceFields = ['inKitSalePrice', 'salePrice', 'price', 'cost', 'amount'];
                            for (const field of priceFields) {
                              if (kitItem[field] !== undefined && kitItem[field] !== null) {
                                const price = typeof kitItem[field] === 'string' ? parseFloat(kitItem[field]) : Number(kitItem[field]);
                                if (!isNaN(price) && price > 0) {
                                  unitPrice = price;
                                  break;
                                }
                              }
                            }
                            
                            // More robust quantity extraction - get the actual quantity for calculation
                            let quantity = 1;
                            const quantityFields = ['inKitQuantity', 'quantity', 'qty', 'count', 'inKitCount'];
                            for (const field of quantityFields) {
                              if (kitItem[field] !== undefined && kitItem[field] !== null) {
                                const qty = typeof kitItem[field] === 'string' ? parseInt(kitItem[field]) : Number(kitItem[field]);
                                if (!isNaN(qty) && qty > 0) {
                                  quantity = qty;
                                  break;
                                }
                              }
                            }
                            
                            // Force correct calculation: Total Price = Unit Price × Quantity
                            const totalPrice = unitPrice * quantity;
                            
                            // Ensure currency conversion results in valid numbers
                            const displayUnitPrice = unitPrice * currencyValue;
                            const displayTotalPrice = totalPrice * currencyValue;
                            
                            return (
                              <tr key={index}>
                                <td>
                                  {kitItem.img && kitItem.img.length > 0 ? (
                                    <img 
                                      src={kitItem.img[0]} 
                                      alt={kitItem.name} 
                                      className="kit-item-image" 
                                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                                <td>{typeof kitItem.name === 'string' ? kitItem.name : 'N/A'}</td>
                                <td>{quantity}</td>
                                <td>{kitItem.inKitCount || quantity}</td>
                                <td>{symbol}{displayUnitPrice.toFixed(2)}</td>
                                <td>{symbol}{displayTotalPrice.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {item.kitItems.length > 0 && (
                        <div className="text-end mt-2">
                          {(() => {
                            let totalKitValue = 0;
                            
                            item.kitItems.forEach((kitItem: OrderKitItems) => {
                              // More robust price extraction for total calculation
                              let unitPrice = 0;
                              const priceFields = ['inKitSalePrice', 'salePrice', 'price', 'cost', 'amount'];
                              
                              for (const field of priceFields) {
                                if (kitItem[field] !== undefined && kitItem[field] !== null) {
                                  const price = typeof kitItem[field] === 'string' ? parseFloat(kitItem[field]) : Number(kitItem[field]);
                                  if (!isNaN(price) && price > 0) {
                                    unitPrice = price;
                                    break;
                                  }
                                }
                              }
                              
                              // More robust quantity extraction
                              let quantity = 1;
                              const quantityFields = ['inKitQuantity', 'quantity', 'qty', 'count', 'inKitCount'];
                              for (const field of quantityFields) {
                                if (kitItem[field] !== undefined && kitItem[field] !== null) {
                                  const qty = typeof kitItem[field] === 'string' ? parseInt(kitItem[field]) : Number(kitItem[field]);
                                  if (!isNaN(qty) && qty > 0) {
                                    quantity = qty;
                                    break;
                                  }
                                }
                              }
                              
                              const itemTotal = unitPrice * quantity;
                              totalKitValue += itemTotal;
                            });
                            
                            const finalTotal = totalKitValue * currencyValue;
                            
                            return (
                              <strong>
                                Total Kit Value: {symbol}{finalTotal.toFixed(2)}
                              </strong>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center">No kit items available.</p>
                  )}
                </div>
              </Collapse>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default KitDiscription;