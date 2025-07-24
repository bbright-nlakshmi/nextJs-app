//import Img from "@/utils/BgImgRatio";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Fragment, useContext, useRef, useState } from "react";
import { Media, Modal, ModalBody } from "reactstrap";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import Slider from "react-slick";
import { objCache } from "@/app/globalProvider";

interface productType {
  id?: Number;
  title?: string;
  newLabel?: boolean;
  sale?: Boolean;
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
  const { selectedCurr } = currencyContext;
  const [imgsrc, setImgsrc] = useState("");
  const imgChange = (src: React.SetStateAction<string>) => {
    setImgsrc(src);
  };

  const slider2 = useRef<Slider | null>(null);
  const [nav1, setNav1] = useState<Slider | null>();
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stockState, setStockState] = useState("InStock");
  const uniqueSize: any[] = [];
  const uniqueColor: any[] = [];
  const titleProps = data?.name.split(" ").join("");

  const productInfo = objCache.getProductById(data?.productId);

  const changeColorVar = (img_id: number) => {
    slider2.current?.slickGoTo(img_id);
  };

  const minusQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setStockState("InStock");
    }
  };

  const plusQty = () => {
    if (data.active) setQuantity(quantity + 1);
    else setStockState("Out of Stock !");
  };

  const changeQty = (e: { target: { value: string } }) => {
    setQuantity(parseInt(e.target.value));
  };

  const QuickView = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.stopPropagation();
    setModal(!modal);
  };

  const clickProductDetail = () => {
    if (data.type === "kit") {
      router.push(
        `/product-details/thumbnail-left/${
          data?.productId ? data?.productId : data?.id
        }`
      );
    } else
      router.push(
        `/product-details/${data?.productId ? data?.productId : data?.id}`
      );
  };

  return (
    <Fragment>
      <div
        className="product-box single-shopping-card-one"
        onClick={clickProductDetail}
      >
        <div className="product-imgbox image-and-action-area-wrapper">
          <a className="thumbnail-preview">
            <Media
              src={data?.img[0]}
              alt=""
              className="img-fluid  image_zoom_cls-0"
            />
          </a>

          <div className={`product-icon ${hoverEffect}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addCart(data);
              }}
            >
              <i className="ti-bag"></i>
            </button>
            <a
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
              href="#"
              title="Compare"
              onClick={(e) => {
                e.stopPropagation();
                addCompare(e);
              }}
            >
              <i className="ti-reload" aria-hidden="true"></i>
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
                <h6 className="price-title">{data?.name}</h6>
              </Link>
              <ul className="rating-star">
                <i className="fa fa-star"></i>
                <i className="fa fa-star"></i>
                <i className="fa fa-star"></i>
                <i className="fa fa-star"></i>
                <i className="fa fa-star"></i>
              </ul>
            </div>

            {/* <div className="check-price">
                {selectedCurr.symbol}
                {(getPrice(data.productId) * selectedCurr.value).toFixed(2)}{" "}
              </div> */}
            <div className="detail-right">
              <div className="price">
                <div className="price">
                  {selectedCurr.symbol}
                  {(price * selectedCurr.value).toFixed(2)}
                </div>
              </div>
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
              {/* <Slider asNavFor={nav1!} ref={(slider1) => setNav1(slider1)}> */}
              {data &&
                data.img.map((img: any, i: any) => {
                  return (
                    <div key={i}>
                      <Media
                        src={img}
                        alt=""
                        className="img-fluid  image_zoom_cls-0"
                      />
                    </div>
                  );
                })}
              {/* </Slider> */}
            </div>
            <div className="col-lg-6 rtl-text">
              <div className="product-right">
                <h2>{data?.name}</h2>
                <h3 className="theme-color price-tag">
                  {" "}
                  {selectedCurr.symbol}
                  {(price * selectedCurr.value).toFixed(2)}
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
                  <ul className="product-description-list">
                    {productInfo?.description?.length ? (
                      <>
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              productInfo.description[0]?.description.slice(
                                0,
                                150
                              ),
                          }}
                        ></div>
                      </>
                    ) : (
                      ""
                    )}
                    {/* {data?.brandName && (
                      <li>
                        <strong>Brand:</strong> {data.brandName}
                      </li>
                    )} */}
                    {data?.categoryName && (
                      <li>
                        <strong>Category:</strong> {data.categoryName}
                      </li>
                    )}
                    {/* <li>
                      <strong>Type:</strong> Original
                    </li> */}
                    {/* {data?.tags && data.tags.length > 0 && (
                      <li>
                        <strong>Tags:</strong> {data.tags.join(", ")}
                      </li>
                    )} */}
                  </ul>
                </div>
                <div className="product-description border-product">
                  <div className="size-box">
                    <ul>
                      {uniqueSize.map((size, i) => (
                        <li key={i}>
                          <a href="#" onClick={(e) => e.preventDefault()}>
                            {size}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {stockState !== "InStock" ? (
                    <span className="instock-cls">{stockState}</span>
                  ) : (
                    ""
                  )}
                  <h6 className="product-title">quantity</h6>
                  <div className="qty-box">
                    <div className="input-group">
                      <span className="input-group-prepend">
                        <button
                          type="button"
                          className="btn quantity-left-minus"
                          onClick={minusQty}
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
                    onClick={() => {
                      addCart(data, quantity);
                      setModal(!modal);
                    }}
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
