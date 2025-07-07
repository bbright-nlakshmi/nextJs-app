/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useContext, useState } from "react";
import { Modal, ModalHeader, ModalBody, Input } from "reactstrap";
import ImageGroup from "./common/ImageGroup";
import CountDownComponent from "@/views/layouts/widgets/CountDownComponent";
import { CartContext } from "@/helpers/cart/cart.context";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import ImageSwatch from "./common/ImageSwatch";
import router, { useRouter } from "next/router";
import { Discount, Product, searchController } from "@/app/globalProvider";
interface ProductRightProps {
  item: Product | Discount;
  changeColorVar: Function | any;
  bundle: boolean;
  swatch: boolean;
}

const ProductDetail: React.FC<ProductRightProps> = ({ item, changeColorVar, bundle, swatch }) => {
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState("InStock");
  const [activesize, setSize] = useState("");
  const { addToWish } = React.useContext(WishlistContext);

  const { addToCart } = useContext(CartContext);

  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;

  //const price = searchController.getDetails(item.productId,'getPrice');
  //const discountedPrice = searchController.getDetails(item.productId,'getPriceWithDiscount');
  const onOpenModal = () => {
    setModal(true);
  };

  const onCloseModal = () => {
    setModal(false);
  };

  const minusQty = () => {
    if (qty > 1) {
      setStock("InStock");
      setQty(qty - 1);
    }
  };

  const plusQty = () => {
    if (item.stock >= qty) {
      setQty(qty + 1);
    } else {
      setStock("Out of Stock !");
    }
  };
  const changeQty = (e: any) => {
    setQty(parseInt(e.target.value));
  };
  // const { id } = router.query; 
  
  const uniqueColor: any[] = [];
  const uniqueSize: any[] = [];
  return (
    <div className="product-right contents">
      <div className="product-status">
        <span className="product-catagory">{item.categoryName}</span>
        <div className="rating-stars-group">
          <div className="rating-star"><i className="fas fa-star"></i></div>
          <div className="rating-star"><i className="fas fa-star"></i></div>
          <div className="rating-star"><i className="fas fa-star-half-alt"></i></div>
          <span>10 Reviews</span>
        </div>
      </div>
      <h2>{item.name}</h2>
      {item.discount ? <h4>
        <del>
          {symbol}
          {item.getProductPrice() * value}
        </del>
        <span>{symbol}{item.getDiscountAmount()} off</span>
      </h4> : ''}
      <h3 className="product-price mb--15 d-block">
        {symbol}
        {(item.getPriceWithDiscount() * value).toFixed(2)}
      </h3>{" "}
      {/* {item.variants &&
        item.variants.map((vari:any) => {
          var findItem = uniqueColor.find((x) => x.color === vari.color);
          if (!findItem && vari.color) uniqueColor.push(vari);
          var findItemSize = uniqueSize.find((x) => x === vari.size);
          if (!findItemSize && vari.size) uniqueSize.push(vari.size);
        })} */}
      {swatch ? <ImageSwatch item={item} changeColorVar={changeColorVar} /> : ""}
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
            )}
        {!!uniqueSize.length && (
          <>
            <h6 className="product-title size-text">
              select size{" "}
              <span>
                <a data-toggle="modal" data-target="#sizemodal" onClick={onOpenModal}>
                  size chart
                </a>
              </span>
            </h6>
            <Modal isOpen={modal} centered={true} toggle={onCloseModal}>
              <ModalHeader>
                Sheer Straight Kurta <i className="fa fa-close modal-close" onClick={onCloseModal}></i>
              </ModalHeader>
              <ModalBody>
                <div className="modal-body">
                  <img src="/images/size-chart.jpg" alt="" className="img-fluid " />
                </div>
              </ModalBody>
            </Modal>

            <div className="size-box">
              <ul>
                {uniqueSize.map((size, i) => (
                  <li className={`${size === activesize ? "active" : ""}`} key={i}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSize(size);
                      }}>
                      {size}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div> */}
      <div className="product-description border-product">
        {stock !== "InStock" ? <span className="instock-cls">{stock}</span> : ""}
        <h6 className="product-title">quantity</h6>
        <div className="qty-box">
          <div className="input-group">
            <span className="input-group-prepend">
              <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="" onClick={minusQty}>
                <i className="ti-angle-left"></i>
              </button>
            </span>
            <Input type="text" name="quantity" className="form-control input-number" value={qty} onChange={changeQty} />
            <span className="input-group-prepend">
              <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="" onClick={plusQty}>
                <i className="ti-angle-right"></i>
              </button>
            </span>
          </div>
        </div>
      </div>
      <div className="product-buttons">
        <a
          href="#"
          data-toggle="modal"
          data-target="#addtocart"
          className="btn btn-normal"
          onClick={(e) => {
            e.preventDefault();
            addToCart(item);
          }}>
          add to cart
        </a>
        <a href="/pages/account/checkout" className="btn btn-normal">
          buy now
        </a>
      </div>
      {/* <div className="border-product"> */}
      {/* <h6 className="product-title">product details</h6> */}
      {/* <p dangerouslySetInnerHTML={{ __html: item?.description[0].description }}> */}
      {/* {item.description.map((d:any) => {return (d.description)})} */}
      {/* {item.description[0]} */}
      {/* </p> */}
      {/* </div> */}
      <div className="product-uniques">
        <span className="sku product-unipue mb--10"><strong>SKU:</strong> BO1D0MX8SJ</span>
        <span className="catagorys product-unipue mb--10"><strong>Categories:</strong> T-Shirts, Tops, Mens</span>
        <span className="tags product-unipue mb--10"><strong>Tags:</strong> fashion, t-shirts, Men</span>
        <span className="tags product-unipue mb--10"><strong>LIFE:</strong> 6 Months</span>
        <span className="tags product-unipue mb--10"><strong>Type:</strong> original</span>
        <span className="tags product-unipue mb--10"><strong>Category:</strong> Beverages, Dairy & Bakery</span>
      </div>
      <div className="border-product">
        <div className="product-icon">
          <ul className="product-social">
            <li>
              <a href="#">
                <i className="fa fa-facebook"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa fa-google-plus"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa fa-twitter"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa fa-instagram"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa fa-rss"></i>
              </a>
            </li>
          </ul>
          <div className="d-inline-block">
            <button
              className="wishlist-btn"
              onClick={() => {
                addToWish(item);
              }}>
              <i className="fa fa-heart"></i>
              <span className="title-font">Add To WishList</span>
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
