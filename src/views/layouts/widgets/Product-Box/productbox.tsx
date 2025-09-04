import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Fragment, useContext, useRef, useState } from "react";
import { Media, Modal, ModalBody } from "reactstrap";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import Slider from "react-slick";
import { objCache, Product } from "@/app/globalProvider";
import { CartContext } from "@/helpers/cart/cart.context";
import { getProductFinalPrice } from "@/utils/price.helper";
import { getSizeLabel } from "@/utils/Labels";
import { AnimatePresence, motion } from "framer-motion";
 
interface productType {
  id?: number;
  title?: string;
  newLabel?: boolean;
  sale?: boolean;
  price: number;
  discount?: number;
  stock?: number;
  images?: any;
  layout?: string;
  addCart: Function;
  addWish: Function;
  addCompare: Function;
  hoverEffect?: any;
  item?: any;
  data: any;
  type?: Array<string>;
  name?: string;
  img?: Array<string>;
  rating?: number;
  description?: string;
}
// { layout, id, item, title, newLabel, sale, price, discount, stock, images, addCart, addCompare, addWish, hoverEffect }
const ProductBox: NextPage<productType> = ({
  layout,
  hoverEffect,
  price,
  data,
  item,
  description,
  addCart,
  addCompare,
  addWish,
}) => {
  const currencyContext = useContext(CurrencyContext);
  const { selectedCurr } = useContext(CurrencyContext);
  const { addToCart, cartItems } = useContext(CartContext);

  const slider2 = useRef<Slider | null>(null);
  const [nav1, setNav1] = useState<Slider | null>();
  const router = useRouter();

  const [modal, setModal] = useState(false);
  const [stockState, setStockState] = useState("InStock");
  const titleProps = data?.name.split(" ").join("");
  const [warning, setWarning] = useState<string>("");

  const productInfo = objCache.getProductById(data?.productId);

  const [quantity, setQuantity] = useState(
    data?.minCount || item?.minCount || productInfo?.minCount || 1
  );

  const uniqueSizes: string[] =
    data?.sellingDisplayOptions || productInfo?.sellingDisplayOptions || [];
  const uniqueSize: string | null =
    data?.sellingDisplayOption || productInfo?.sellingDisplayOption || null;

  const sizePrices: number[] =
    data?.sellingPrices || productInfo?.sellingPrices || [];
  const sizePrice: number =
    data?.sellingPrice || productInfo?.sellingPrice || [];

  const uniqueColor: any[] = [];

  const [activesize, setActiveSize] = useState<string | null>(
    uniqueSizes.length ? uniqueSizes[0] : uniqueSize
  );

  const availableStock = data?.stock ?? item?.stock ?? productInfo?.stock ?? 0;
  const isOutOfStock = availableStock <= 0;

  const productId = data?.productId ?? data?.id;
  const isCustomMode =
    (item?.saleMode || data?.saleMode || productInfo?.saleMode) === "custom";

  const optionKey =
    activesize ||
    data?.sellingDisplayOptions ||
    productInfo?.sellingDisplayOptions ||
    data?.sellingDisplayOption ||
    productInfo?.sellingDisplayOption ||
    "default";

  const cartItemId = `${productId}-${optionKey}`;

  const isAddedToCart = React.useMemo(() => {
    return cartItems.some((cartItem) => cartItem.cartItemId === cartItemId);
  }, [cartItems, cartItemId]);

  const handleGoToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/pages/account/cart"); // Adjust path if your cart page differs
  };

  React.useEffect(() => {
    if (!activesize) {
      if (uniqueSizes.length) {
        setActiveSize(uniqueSizes[0]);
      } else if (uniqueSize) {
        setActiveSize(uniqueSize);
      }
    }
  }, [uniqueSizes, uniqueSize]);

  const changeColorVar = (img_id: number) => {
    slider2.current?.slickGoTo(img_id);
  };

  const onOpenModal = () => {
    setModal(true);
  };

  const onCloseModal = () => {
    setModal(false);
  };

  const minusQty = () => {
    if (
      quantity > (data?.minCount || item?.minCount || productInfo?.minCount || 1)
    ) {
      setQuantity(quantity - 1);
      setStockState("InStock");
    } else {
      setStockState("Minimum limit reached");
    }
  };

  const plusQty = () => {
    if (quantity < (data?.maxCount || item?.maxCount || productInfo?.maxCount)) {
      setQuantity(quantity + 1);
      setStockState("InStock");
    } else {
      setStockState("Maximum limit reached");
    }
  };

  const changeQty = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value) || 1;

    if (val < (data?.minCount || item?.minCount || productInfo?.minCount || 1)) {
      val = (data.minCount || item?.minCount || productInfo?.minCount || 1);
      setStockState("Minimum limit reached");
    } else if (val > (data?.maxCount || item?.maxCount || productInfo?.maxCount)) {
      val = data.maxCount || item?.maxCount || productInfo?.maxCount;
      setStockState("Maximum limit reached");
    } else {
      setStockState("InStock");
    }
    setQuantity(val);
  };

  const QuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal(true);
  };

  const getFinalPrice = () => {
    return getProductFinalPrice({
      price: sizePrice,
      discount: data?.discount,
      sellingPrices: sizePrices,
      activeIndex: activesize ? uniqueSizes.indexOf(activesize) : 0,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    if (uniqueSizes.length && !activesize) {
      setWarning("⚠️ Please select an option before adding to cart.");
      return;
    }

    const optionKey =
      activesize ||
      data?.sellingDisplayOption ||
      productInfo?.sellingDisplayOption ||
      item?.sellingDisplayOption ||
      "";

    const cartItemId = `${productId}-${optionKey}`;
    const existingItem = cartItems.find(
      (cartItem) => cartItem.cartItemId === cartItemId
    );

    const totalQty = (existingItem?.qty || 0) + quantity;

    if (availableStock > 0 && totalQty > availableStock) {
      setWarning(`⚠️ Only ${availableStock} item(s) available in stock.`);
      return;
    }

    // ✅ Custom saleMode check
    if (isCustomMode && existingItem) {
      handleGoToCart(e);
      return;
    }

    const finalPrice = getFinalPrice();

    const added = addToCart(
      {
        id: productId.toString(),
        productId,
        saleMode: data.saleMode || item?.saleMode,
        name: data.name,
        img: data.img,
        selectedSize: activesize,
        price: finalPrice,
        cartItemCount: quantity,
        purchaseOptionStr: optionKey,
        cartPurchaseOptionStr: optionKey,
        getPriceWithDiscount: () => finalPrice,
        qty: isCustomMode ? 1 : quantity,
        cartItemId,
        stock: availableStock,
      },
      quantity
    );

    if (!added) {
      // stock exceeded → show inline warning
      setWarning(`⚠️ Only ${availableStock} item(s) available in stock.`);
      return;
    }

    setWarning("");
    // setModal(false);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();

    if (uniqueSizes.length && !activesize) {
      setWarning("⚠️ Please select an option before Buy Now.");
      setModal(true);
      return;
    }

    // stock check
    if (data.stock && quantity > data.stock) {
      setStockState("Out of Stock !");
      return;
    }

    const finalPrice = getFinalPrice();

    try {
      sessionStorage.setItem(
        "buyNowProduct",
        JSON.stringify({
          id: (data.id ?? data.productId)?.toString(),
          productId: data.productId ?? data.id,
          name: data.name,
          img: data.img,
          saleMode: data.saleMode || item?.saleMode,
          quantity: isCustomMode ? 1 : quantity,
          selectedSize: activesize,
          price: finalPrice,
          cartItemCount: quantity,
          purchaseOptionStr: activesize || "",
          getPriceWithDiscount: () => finalPrice,
        })
      );
      sessionStorage.setItem("checkoutMode", "buyNow");
    } catch (err) {
      console.error("Session storage error:", err);
    }

    setWarning("");
    setModal(false);
    router.push("/pages/account/checkout");
  };

  // update price when size changes
  const handleSelectSize = (size: string) => {
    setActiveSize(size);
    setWarning("");
  };

  const clickProductDetail = () => {
    const id = data?.productId ?? data?.id;
    router.push(
      data.type === "kit"
        ? `/product-details/thumbnail-left/${id}`
        : `/product-details/${id}`
    );
  };
 
  return (
    <Fragment>
      <div
        className="product-box single-shopping-card-one"
        onClick={clickProductDetail}
      >
        <div className="product-imgbox image-and-action-area-wrapper">
          {data?.discount && data.discount > 0 && (
            <div className="discount-badge-pb">
              <span className="discount-percent">-{data.discount}%</span>
              <span className="discount-off">OFF</span>
            </div>
          )}        
          {data?.img?.length > 1 ? (
            <Slider
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={1}
              slidesToScroll={1}
              arrows={false}
              autoplay={true}          
              autoplaySpeed={1000}      
              pauseOnHover={true}
            >
              {data.img.map((src: string, idx: number) => (
                <div key={idx}>
                  <a className="thumbnail-preview">
                    <Media
                      src={src}
                      alt=""
                      className={`img-fluid image_zoom_cls-0 ${isOutOfStock ? "grayscale" : ""}`}
                    />
                  </a>
                </div>
              ))}
            </Slider>
          ) : (
            <a className="thumbnail-preview">
              <Media
                src={data?.img?.[0]}
                alt=""
                className="img-fluid image_zoom_cls-0"
            />
          </a>
          )}
 
          <div className={`product-icon ${hoverEffect} ${isOutOfStock ? "out-of-stock-mode" : ""}`}>
            {isOutOfStock ? (
              <button disabled title="Out of Stock" className="out-of-stock-btn">
                <i className="ti-na"></i>
              </button>
            ) : !isAddedToCart ? (
              <button title="Add to Cart" onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}>
                <i className="ti-shopping-cart"></i>
              </button>
            ) : (
              <button title="Go to Cart" onClick={(e) => { e.stopPropagation(); handleGoToCart(e); }}>
                <i className="ti-bag"></i>
              </button>
            )}
            <a
              title="Add to Wishlist"
              onClick={(e) => {
                e.stopPropagation();
                addWish(e);
              }}
            >
              <i className="ti-heart" aria-hidden="true"></i>
            </a>
            <a title="Quick View" onClick={(e) => QuickView(e)}>
              <i className="ti-search" aria-hidden="true"></i>
            </a>
            {!isOutOfStock && (
              <a
                title="Checkout"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuyNow(e);
                }}
              >
              <i className="ti-credit-card" aria-hidden="true"></i>
            </a>
            )}
          </div>
          {/* {newLabel && (
            <div className="new-label1">
              <div>new</div>
            </div>
          )} */}
          {/* {sale && <div className="on-sale1">on sale</div>} */}
        </div>
        <div className="product-detail detail-inline ">
          <div className="detail-title">
            <div className="detail-left">
              <Link href="#">
                <h6 className="price-title truncate-text"
                    title={data?.name}
                  > {data?.name}
                </h6>
              </Link>
            </div>
 
            {/* <div className="check-price">
                {selectedCurr.symbol}
                {(getPrice(data.productId) * selectedCurr.value).toFixed(2)}{" "}
              </div> */}
            <div className="detail-right flex items-center justify-between gap-3">
              <div className="price">
                <div className="theme-color">
                  {selectedCurr.symbol}
                  {(getFinalPrice() * selectedCurr.value).toFixed(2)}
                </div>
              </div>
              {(data.saleMode || productInfo?.saleMode) !=='range' ? (
                <div className="size-dropdown"
                onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={activesize || ""}
                    onChange={(e) => e.target.value && handleSelectSize(e.target.value)}
                  >
                    {uniqueSizes.map((size, i) => (
                      <option key={i} value={size} className="dropdown-list">
                        {getSizeLabel(size)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
              <div className="size-value theme-color truncate-text"
              title={String(uniqueSize)}>
                {uniqueSize}
              </div>
              )}
            </div>
            <div className="rating-star mt-2">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`fa fa-star ${
                    i <
                    (data.rating
                      ? data.rating.calculateRating()
                      : 0)
                      ? "text-warning"
                      : "fa-star-o text-warning"
                  }`}
                ></i>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Modal
        className="fade bd-example-modal-lg theme-modal show quick-view-modal"
        isOpen={modal}
        toggle={() => setModal(!modal)}
        centered
        size="lg"
      >
        <button
            type="button"
            className="quickview-close mb-2"
            onClick={() => setModal(!modal)}
          >
            <span>&times;</span>
          </button>
        <ModalBody>
          <div className="row">
            <div className="col-lg-6 col-xs-12">
              {data?.img?.length > 1 ? (
                <Slider
                  dots={true}
                  infinite={true}
                  speed={500}
                  slidesToShow={1}
                  slidesToScroll={1}
                  arrows={false}
                  autoplay={true}
                  autoplaySpeed={1000}
                  pauseOnHover={true}
                >
                  {data.img.map((img: string, idx: number) => (
                    <div key={idx} className="product-image-slide">
                      <Media
                        src={img}
                        alt=""
                        className="img-fluid  image_zoom_cls-0"
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="product-image-slide">
                  <Media
                    src={data?.img?.[0]}
                    alt=""
                    className="img-fluid image_zoom_cls-0"
                  />
                </div>
              )}
            </div>
            <div className="col-lg-6 rtl-text">
              <div className="product-right">
                <h2>{data?.name}</h2>
                {/* <div className="rating-star mb-2">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fa fa-star ${
                        i < (data.rating ? data.rating.calculateRating() : 0)
                          ? "text-warning"
                          : "fa-star-o text-warning"
                      }`}
                    ></i>
                  ))}
                </div> */}
                <h3 className="price theme-color">
                  {selectedCurr.symbol}
                  {(getFinalPrice() * selectedCurr.value).toFixed(2)}
                </h3>
                <ul className="color-variant">
                  {uniqueColor.map((vari, i) => {
                    return (
                      <li
                        className={vari.color}
                        key={i}
                        title={vari.color}
                        onClick={() => changeColorVar(i)}
                      ></li>
                    );
                  })}
                </ul>
                <div className="border-product">
                  <h6 className="product-title">product details</h6>
                  {/* <p>{item?.description}</p> */}
                  {productInfo?.description?.length ? (
                    <div dangerouslySetInnerHTML={{ __html: productInfo.description[0]?.description.slice(0, 150) }}></div>
                  ) : null}
                  <ul className="product-description-list">
                    {data?.brandName && (
                      <li>
                        <strong>Brand:</strong> {data.brandName}
                      </li>
                    )}
                    {data?.categoryName && (
                      <li>
                        <strong>Category:</strong> {data.categoryName}
                      </li>
                    )}
                    {/* <li>
                      <strong>Type:</strong> Original
                    </li> */}
                    {data?.tags && data.tags.length > 0 && (
                      <li>
                        <strong>Tags:</strong> {data.tags.join(", ")}
                      </li>
                    )}
                  </ul>
                </div>
                <div className="product-description border-product">
                  {(!!uniqueSizes.length || !!uniqueSize) && (
                    <div className="display-options">
                      {(data.saleMode || productInfo?.saleMode) !== "range" ? (
                        <>
                          {uniqueSizes.length > 0 && (
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
                                    {size}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}                          
                          {uniqueSizes.length === 0 && uniqueSize && (
                            <div className="size-value mb-4">{uniqueSize}</div>
                          )}
                        </>
                      ) : (
                        <div className="size-value mb-4">{uniqueSize}</div>
                      )}
                    </div>
                  )}                  
                  {warning && (
                    <div className="warning-message text-danger mb-2 mt-1">
                      {warning}
                    </div>
                  )}
                  {stockState !== "InStock" && <span className="instock-cls">{stockState}</span>}
                  <h6 className="product-title">quantity</h6>
                  <div className="qty-box">
                    <div className="input-group">
                      <span className="input-group-prepend">
                        <button
                          type="button"
                          className="btn quantity-left-minus"
                          onClick={minusQty}
                          disabled={isCustomMode ||quantity <= (data?.minCount || item?.minCount || productInfo?.minCount || 1)}
                        >
                          <i className="ti-angle-left"></i>
                        </button>
                      </span>
                      <input
                        type="text"
                        name="quantity"
                        className="form-control input-number"
                        value={isCustomMode?  1 : quantity}
                        min={productInfo?.minCount || 1}
                        max={availableStock} 
                        onChange={changeQty}
                        readOnly={isCustomMode}
                      />
                      <span className="input-group-prepend">
                        <button
                          type="button"
                          className="btn quantity-right-plus"
                          onClick={plusQty}
                          disabled={isCustomMode || quantity >= Math.min( availableStock, item?.maxCount || data?.maxCount || productInfo?.maxCount || availableStock)}
                        >
                          <i className="ti-angle-right"></i>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="product-buttons">
                  <AnimatePresence mode="wait">
                    {isOutOfStock ? (
                      <motion.a
                        key="out-of-stock"
                        href="#"
                        className="btn btn-normal disabled-btn"
                        onClick={(e) => e.preventDefault()}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        OUT OF STOCK
                      </motion.a>
                    ) : !isAddedToCart ? (
                      <motion.a
                        key="add-to-cart"
                        href="#"
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
                  <a
                    href="#"
                    className="btn btn-normal"
                    onClick={() => clickProductDetail()}
                  >
                    view details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </Fragment>
  );
};
export default ProductBox;
 