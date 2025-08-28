/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useContext, useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, Input } from "reactstrap";
import ImageGroup from "./common/ImageGroup";
import CountDownComponent from "@/views/layouts/widgets/CountDownComponent";
import { CartContext } from "@/helpers/cart/cart.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import ImageSwatch from "./common/ImageSwatch";
import { Discount, Product, searchController } from "@/app/globalProvider";
import { useRouter} from "next/navigation";
import { getProductFinalPrice } from "@/utils/price.helper";
import { set } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

interface ProductRightProps {
  item: Product | Discount;
  changeColorVar: Function | any;
  bundle: boolean;
  swatch: boolean;
}

const ProductDetail: React.FC<ProductRightProps> = ({
  item,
  changeColorVar,
  bundle,
  swatch,
}) => {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState<number>(1);
  const [stock, setStock] = useState("InStock");
  const [activesize, setSize] = useState("");
  const uniqueColor: any[] = [];
  const uniqueSizes: string[] = item?.sellingDisplayOptions || [];
  const uniqueSize: string[] = item?.sellingDisplayOption || [];
  const sizePrices: number[] = item?.sellingPrices || [];
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [warning, setWarning] = useState<string>("");
  const activeIndex = activesize ? uniqueSizes.indexOf(activesize) : null;
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const finalPrice = getProductFinalPrice({
  price: item.getProductPrice(),
  discount: item.discount ? item.getDiscount() : 0,
  sellingPrices: sizePrices,
  activeIndex: activeIndex,
});

  // Ensure product details persist after refresh
  React.useEffect(() => {
    if (item) {
      try {
        sessionStorage.setItem("productDetail", JSON.stringify(item));
      } catch {}
    }
  }, [item]);

  //const price = searchController.getDetails(item.productId,'getPrice');
  //const discountedPrice = searchController.getDetails(item.productId,'getPriceWithDiscount');
  const onOpenModal = () => {
    setModal(true);
  };

  const onCloseModal = () => {
    setModal(false);
  };

  const minusQty = () => {
    if (qty > (item.minCount || 1)) {
      setStock("InStock");
      setQty(qty - 1);
      } else {
    setStock(`Minimum quantity is ${item.minCount}`); 
    }
  };

  const plusQty = () => {
    if (qty < (item.maxCount || item.stock)) {
      setQty(qty + 1);
    } else {
      setStock(`Maximum quantity is ${item.maxCount || item.stock}`); 
    }
  };

  const changeQty = (e: any) => {
  const newQty = parseInt(e.target.value);
  if (!isNaN(newQty)) {
    if (newQty < (item.minCount || 1)) {
      setQty(item.minCount || 1);
      setStock(`Minimum quantity is ${item.minCount}`);
    } else if (newQty > (item.maxCount || item.stock)) {
      setQty(item.maxCount || item.stock);
      setStock(`Maximum quantity is ${item.maxCount || item.stock}`);
    } else {
      setQty(newQty);
      setStock("InStock");
    }
  }
};


  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (uniqueSizes.length && !activesize) {
    setWarning("⚠️ Please select an option before adding to cart.");
    return;
  }
    // Check stock before adding
    if (item.stock && qty > item.stock) {
      setStock("Out of Stock !");
      return;
    }


    addToCart(
      {
        id: item.id,
        name: item.name,
        img:item.img,
        selectedSize: activesize,
        price: finalPrice,
        cartItemCount: qty, 
        cartPurchaseOptionStr: activesize || "",
        getPriceWithDiscount: () => finalPrice,
      },
      qty
    );
    setWarning("");
    setIsAddedToCart(true);
  };
  const handleGoToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/pages/account/cart");   
  };

  // Buy Now handler: store product in sessionStorage and set checkout mode
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (uniqueSizes.length && !activesize) {
    setWarning("⚠️ Please select an option before proceeding to checkout.");
    return;
  }
    try {
      sessionStorage.setItem(
        "buyNowProduct",
         JSON.stringify({
          id: item.id,
          name: item.name,
          img:item.img,
          qty,
          selectedSize: activesize,
          price: finalPrice,
          cartItemCount: qty, 
          cartPurchaseOptionStr: activesize || "",
          getPriceWithDiscount: () => finalPrice,
          
        })
      );
      sessionStorage.setItem("checkoutMode", "buyNow");
    } catch {}
    setWarning("");
    router.push("/pages/account/checkout"); 
  };

  // const { id } = router.query;
  
  // update price when size changes
  const handleSelectSize = (size: string, index: number) => {
    setSize(size);
    setWarning("");
  };

  return (
    <div className="product-right contents">
      <div className="product-status">
        <span className="product-catagory">{item.categoryName}</span>
        <div className="rating-star">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`fa fa-star ${
                i <
                (item.rating
                  ? item.rating.calculateRating?.() ?? 0
                  : 0)
                  ? "text-warning"
                  : "fa-star-o text-warning"
              }`}
            ></i>
           ))}
        </div>                              
      </div>
      <h2>{item.name}</h2>
      <div className="product-price-section">
        {item.discount ? (
          <div>
            <h2>
              <span className="text-danger me-3">-{item.getDiscount()}%</span>
              <del className="text-muted">
                M.R.P: {symbol}{activeIndex !== null
                  ? (sizePrices[activeIndex] * value).toFixed(2)
                  : (item.getProductPrice() * value).toFixed(2)}
              </del>
            </h2>
            <h3 className="product-price mb--15 d-block">
              {symbol}{(finalPrice * value).toFixed(2)}
            </h3>
          </div>
        ) : (
          <h3 className="product-price mb--15 d-block">
            {symbol}{(finalPrice * value).toFixed(2)}
          </h3>
        )}
      </div>
      {/* {item.variants &&
        item.variants.map((vari:any) => {
          var findItem = uniqueColor.find((x) => x.color === vari.color);
          if (!findItem && vari.color) uniqueColor.push(vari);
          var findItemSize = uniqueSize.find((x) => x === vari.size);
          if (!findItemSize && vari.size) uniqueSize.push(vari.size);
        })} */}
      {swatch ? (
        <ImageSwatch item={item} changeColorVar={changeColorVar} />
      ) : (
        ""
      )}
      {/* <div className="product-description border-product">
        <h6 className="product-title">select color</h6>
        {changeColorVar === undefined
          ? !!uniqueColor.length && (
              <ul className="color-variant">
                {uniqueColor.map((vari, i) => {
                  return <li className={vari.color} key={i} title={vari.color}></li>;
                })}
              </ul>
            )
          : !!uniqueColor.length && (
              <ul className="color-variant">
                {uniqueColor.map((vari, i) => {
                  return <li className={vari.color} key={i} title={vari.color} onClick={() => changeColorVar(i)}></li>;
                })}
              </ul>
            )} */}
        {(!!uniqueSizes.length || uniqueSize.length) && (
          <>
            <h6 className="product-title size-text">
              <span>
                <a data-toggle="modal" data-target="#sizemodal" onClick={onOpenModal}></a>
              </span>
            </h6>
            <Modal isOpen={modal} centered={true} toggle={onCloseModal}>
              <ModalHeader>
                {" "} <i className="fa fa-close modal-close" onClick={onCloseModal}></i>
              </ModalHeader>
              <ModalBody>
                <div className="modal-body">
                  <img src="/images/size-chart.jpg" alt="" className="img-fluid " />
                </div>
              </ModalBody>
            </Modal>

            <div className="your-size-list">
              {(item.saleMode !== "range") ? (
                <>
                  <ul>
                    {uniqueSizes.map((size, i) => (
                      <li className={`${size === activesize ? "active" : ""}`} key={i}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectSize(size, i);
                            setWarning(""); 
                          }}>
                          {size}
                        </a>
                      </li>
                    ))}
                  </ul>

                  {/* warning only for multiple sizes */}
                  {warning && (
                    <p className="warning-message text-danger">{warning}</p>
                  )}
                </>
              ) : (
                <div className="title-font mb-4">{uniqueSize}</div>
              )}
            </div>
          </>
        )}


      <div className="product-description border-product">
        {stock !== "InStock" ? (
          <span className="instock-cls">{stock}</span>
        ) : (
          ""
        )}
        <h6 className="product-title">quantity</h6>
      </div>
      <div className="flex-block">
        <div className="qty-box contents">
          <div className="input-group">
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-left-minus"
                data-type="minus"
                data-field=""
                onClick={minusQty}
                disabled={item.saleMode === "custom" || qty <= (item.minCount || 1)}
              >
                <i className="ti-angle-left"></i>
              </button>
            </span>
            <Input
              type="text"
              name="quantity"
              className="form-control input-number"
              value={item.saleMode === "custom" ? 1 : qty}
              onChange={changeQty}
              readOnly={item.saleMode === "custom"} // prevent manual typing
            />
            <span className="input-group-prepend">
              <button
                type="button"
                className="btn quantity-right-plus"
                data-type="plus"
                data-field=""
                onClick={plusQty}
                disabled={item.saleMode === "custom" || qty >= (item.maxCount)}
              >
                <i className="ti-angle-right"></i>
              </button>
            </span>
          </div>
        </div>

        <div className="product-buttons">
          <AnimatePresence mode="wait">
            {!isAddedToCart ? (
              <motion.a
                key="add-to-cart"
                href="#"
                data-toggle="modal"
                data-target="#addtocart"
                className="btn btn-normal"
                onClick={handleAddToCart}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                add to cart
              </motion.a>
            ) : (
              <motion.a
                key="go-to-cart"
                href="#"
                className="btn btn-normal"
                onClick={handleGoToCart}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                GO TO CART
              </motion.a>
            )}
          </AnimatePresence>
          {/* Keep Buy Now separate so it animates only on page load */}
          <motion.a
            href="#"
            className="btn btn-normal"
            onClick={handleBuyNow}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            buy now
          </motion.a>
        </div>
      </div>
      {/* <div className="border-product"> */}
      {/* <h6 className="product-title">product details</h6> */}
      {/* <p dangerouslySetInnerHTML={{ __html: item?.description[0].description }}> */}
      {/* {item.description.map((d:any) => {return (d.description)})} */}
      {/* {item.description[0]} */}
      {/* </p> */}
      {/* </div> */}
      <div className="product-uniques">
        {/* <span className="sku product-unipue mb--10"><strong>SKU:</strong> BO1D0MX8SJ</span> */}
        {/* <span className="catagorys product-unipue mb--10">
          <strong>Categories:</strong>
        </span> */}
        {item.tags.length ? (
          <span className="tags product-unipue mb--10 ">
            <strong>Tags:</strong>
            {item.tags.join(", ")}
          </span>
        ) : (
          ""
        )}
        <span className="tags product-unipue mb--10">
          {/* <strong>LIFE:</strong> 6 Months */}
        </span>
        <span className="tags product-unipue mb--10">
          {/* <strong>Type:</strong> original */}
        </span>
        {item.brandName ? (
          <span className="tags product-unipue mb--10">
            <strong>Brand Name: </strong>
            {item.brandName}
          </span>
        ) : (
          <></>
        )}
      </div>
      <div className="border-product ">
        <div className="product-icon">
          <div className="d-inline-block ">
            <button
              className="wishlist-btn p-4 center"
              onClick={() => {
                addToWish(item);
              }}
            >
              <i className="fa fa-heart"></i>
              <span className="title-font ">Add To WishList</span>
            </button>
          </div>
        </div>
      </div>
      {bundle && <ImageGroup />}
      <div className="border-product pb-0">
        <h6 className="product-title">Time Reminder</h6>
        <CountDownComponent />
      </div>
    </div>
  );
};

export default ProductDetail;
