//import Img from "@/utils/BgImgRatio";
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
  const { addToCart } = useContext(CartContext);
  const slider2 = useRef<Slider | null>(null);
  const [nav1, setNav1] = useState<Slider | null>();
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [quantity, setQuantity] = useState(data?.minCount || 1);
  const [stockState, setStockState] = useState("InStock");
  const titleProps = data?.name.split(" ").join("");
  const [warning, setWarning] = useState<string>("");
  const productInfo = objCache.getProductById(data?.productId);
  const uniqueSize: string[] = data?.sellingDisplayOptions || productInfo?.sellingDisplayOptions || [];
  const sizePrices: number[] = data?.sellingPrices || productInfo?.sellingPrices || [];
  const sizePrice: number = data?.sellingPrice || productInfo?.sellingPrice || [];
  const uniqueColor: any[] = [];
  const [activesize, setActiveSize] = useState<string | null>(
    uniqueSize.length ? uniqueSize[0] : null
  );
  React.useEffect(() => {
  if (uniqueSize.length && !activesize) {
    setActiveSize(uniqueSize[0]);
  }
}, [uniqueSize]);

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
  if (quantity > (data?.minCount || item?.minCount || productInfo?.minCount || 1)) {
    setQuantity(quantity - 1);
    setStockState("InStock");
  } else {
    setStockState("Minimum limit reached");
  }
};

const plusQty = () => {
  if (quantity < (data?.maxCount || item?.maxCount|| productInfo?.maxCount)) {
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
    val = (data.maxCount || item?.maxCount || productInfo?.maxCount);
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
      activeIndex: activesize ? uniqueSize.indexOf(activesize) : 0,
    }); 
  };
   const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (uniqueSize.length && !activesize) {
      setWarning("⚠️ Please select an option before adding to cart.");
      return;
    }
      // Check stock before adding
    if (data.stock && quantity > data.stock) {
      setStockState("Out of Stock !");
      return;
    }

    const finalPrice = getFinalPrice();

    addToCart(
      {
        ...data,
        id: data.productId ?? data.id, 
        selectedSize: activesize,
        price: finalPrice,
        cartItemCount: quantity, 
        cartPurchaseOptionStr: activesize || "",
        getPriceWithDiscount: () => finalPrice,
      },
      quantity
    );
    setWarning("");
    setModal(false);
  };
  const handleBuyNow = (e: React.MouseEvent) => {
  e.preventDefault();
  if (uniqueSize.length && !activesize) {
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
        id:data.id,
        name: data.name,
        img: data.img,        
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
    router.push(data.type === "kit" ? `/product-details/thumbnail-left/${id}` : `/product-details/${id}`);
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
                      className="img-fluid image_zoom_cls-0"
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

          <div className={`product-icon ${hoverEffect}`}>
            <button
              title="Add to Cart"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(e);
              }}
            >
              <i className="ti-shopping-cart"></i>
            </button>
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
            <a
              title="Checkout"
              onClick={(e) => {
                e.stopPropagation();
                // if (uniqueSize.length && !activesize) {
                //   // Instead of going straight to checkout, open QuickView modal
                //   setModal(true);
                //   setWarning("⚠️ Please select a size before checkout.");
                //   return;
                // }
                // ✅ Use getFinalPrice to ensure correct price calculation     
                // ✅ Always use `data`, not `item`
                handleBuyNow(e);
              }}
              >
              <i className="ti-credit-card" aria-hidden="true"></i>
            </a>
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
              {!!uniqueSize.length && (
                <div className="size-dropdown"
                onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={activesize || ""}
                    onChange={(e) => e.target.value && handleSelectSize(e.target.value)}
                  >
                    {uniqueSize.map((size, i) => (
                      <option key={i} value={size}>
                        {getSizeLabel(size)}
                      </option>
                    ))}
                  </select>
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
        <ModalBody>
          <button
            type="button"
            className="close"
            onClick={() => setModal(!modal)}
          >
            <span>&times;</span>
          </button>
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
                  {!!uniqueSize.length && (
                    <div className="size-box">
                      <h6 className="product-title">select size</h6>
                      <ul>
                      {uniqueSize.map((size, i) => (
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
                    {/* Show warning only if Add to Cart was clicked */}
                    {warning && (
                      <div className="warning-message text-danger mb-2 mt-1">
                        {warning}
                      </div>
                    )}
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
                          disabled={quantity <= (data?.minCount || item?.minCount || productInfo?.minCount || 1)}
                        >
                          <i className="ti-angle-left"></i>
                        </button>
                      </span>
                      <input
                        type="text"
                        name="quantity"
                        className="form-control input-number"
                        value={quantity}
                        onChange={changeQty}
                      />
                      <span className="input-group-prepend">
                        <button
                          type="button"
                          className="btn quantity-right-plus"
                          onClick={plusQty}
                          disabled={quantity >= (data?.maxCount || item?.maxCount || productInfo?.maxCount)}
                        >
                          <i className="ti-angle-right"></i>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="product-buttons">
                  <a
                    href="#"
                    className="btn btn-normal"
                    onClick={handleAddToCart}                                          
                  >
                    add to cart
                  </a>
                  <a
                    href="#"
                    className="btn btn-normal"
                    onClick={() => clickProductDetail()}
                  >
                    view detail
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
