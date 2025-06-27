"use client";

import React, { useState, useContext, useRef, Fragment } from "react";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Media, Modal, ModalBody } from "reactstrap";
import { CurrencyContext } from "@/helpers/currency/CurrencyContext";
import Slider from "react-slick";

<<<<<<< HEAD
interface productType {
  img?: any;
  id?: number;
  title?: string;
  newLabel?: boolean;
  sale?: Boolean;
  stock: number;
  price: number;
  item: any;
=======
interface ProductBox2Props {
  id?: number;
  title?: string;
  newLabel?: boolean;
  sale?: boolean;
  price?: number;
>>>>>>> eb7ec620693a61b2be87979865f698de83be118f
  discount?: number;
  stock?: number;
  images?: any[];
  layout?: string;
  addCart?: Function;
  addWish?: Function;
  addCompare?: Function;
  hoverEffect?: any;
  data: any;
  type?: Array<string>;
  img?: string;
  className?: string;
}

const ProductBox2: NextPage<ProductBox2Props> = ({
  layout,
  hoverEffect,
  price,
  data,
  newLabel,
  addCart,
  addCompare,
  addWish,
  img,
  className = "",
}) => {
  const currencyContext = useContext(CurrencyContext);
  const { selectedCurr } = currencyContext;
  const [imgsrc, setImgsrc] = useState("");
  const [modal, setModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stockState, setStockState] = useState("InStock");
  
  const slider2 = useRef<Slider | null>(null);
  const [nav1, setNav1] = useState<Slider | null>();
  const router = useRouter();

  const titleProps = data?.name?.split(" ").join("") || "";

  // Image change handler
  const imgChange = (src: React.SetStateAction<string>) => {
    setImgsrc(src);
  };

  // Color variant change handler
  const changeColorVar = (img_id: number) => {
    slider2.current?.slickGoTo(img_id);
  };

  // Quantity handlers
  const minusQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setStockState("InStock");
    }
  };

  const plusQty = () => {
    if (data?.active) setQuantity(quantity + 1);
    else setStockState("Out of Stock !");
  };

  const changeQty = (e: { target: { value: string } }) => {
    setQuantity(parseInt(e.target.value));
  };

  // Quick view modal toggle
  const QuickView = () => {
    setModal(!modal);
  };

  // Navigate to product detail
  const clickProductDetail = () => {
    if (data?.productId) {
      router.push(`/product-details/${data.productId}`);
    }
  };

  // Format price display
  const formatPrice = (priceValue: number | undefined): string => {
    if (!priceValue && priceValue !== 0) return "Price unavailable";
    return `${selectedCurr.symbol}${(priceValue * selectedCurr.value).toFixed(2)}`;
  };

  // Get product image
  const getProductImage = () => {
    if (img) return img;
    if (data?.img && Array.isArray(data.img) && data.img.length > 0) return data.img[0];
    if (data?.image) return data.image;
    return "/images/default.jpg";
  };

  // Render star rating
  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={i} className="fa fa-star"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="fa fa-star-half-o"></i>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="fa fa-star"></i>);
    }
    
    return stars;
  };

  const productImage = getProductImage();
  const productName = data?.name || data?.title || "Product";
  const productRating = data?.rating || 4.5;

  return (
    <Fragment>
      <div className={`product-box ${className}`}>
        <div className="product-imgbox">
          <div className="product-front" onClick={clickProductDetail}>
            <a>
              <Media 
                src={productImage}
                alt={productName}
                className="img-fluid image_zoom_cls-0"
              />
            </a>
          </div>

          <div className={`product-icon ${hoverEffect}`}>
            <button onClick={() => addCart && addCart()}>
              <i className="ti-bag"></i>
            </button>
            <a onClick={() => addWish && addWish()}>
              <i className="ti-heart" aria-hidden="true"></i>
            </a>
            <a href="#" title="Quick View" onClick={(e) => {
              e.preventDefault();
              QuickView();
            }}>
              <i className="ti-search" aria-hidden="true"></i>
            </a>
            <a href="#" title="Compare" onClick={(e) => {
              e.preventDefault();
              addCompare && addCompare();
            }}>
              <i className="ti-reload" aria-hidden="true"></i>
            </a>
          </div>

          {newLabel && (
            <div className="new-label1">
              <div>new</div>
            </div>
          )}
          {data?.sale && <div className="on-sale1">on sale</div>}
        </div>

        <div className="product-detail detail-inline">
          <div className="detail-title">
            <div className="detail-left">
              <ul className="rating-star">
                {renderStars(productRating)}
              </ul>
              
              {layout === "list-view" && (
                <p>
                  {data?.description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book"}
                </p>
              )}

              <Link href={`/product-details/${data?.productId}${titleProps ? '-' + titleProps : ''}`}>
                <h6 className="price-title">{productName}</h6>
              </Link>
            </div>
            
            <div className="detail-right">
              <div className="price">
                <div className="price">
                  {formatPrice(price)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <Modal 
        className="fade bd-example-modal-lg theme-modal show quick-view-modal" 
        isOpen={modal} 
        toggle={() => setModal(!modal)} 
        centered 
        size="lg"
      >
        <ModalBody>
          <button type="button" className="close" onClick={() => setModal(!modal)}>
            <span>&times;</span>
          </button>
          <div className="row">
            <div className="col-lg-6 col-xs-12">
              {data?.img && Array.isArray(data.img) && data.img.length > 1 ? (
                <Slider asNavFor={nav1!} ref={(slider1) => setNav1(slider1)}>
                  {data.img.map((image: any, i: number) => (
                    <div key={i}>
                      <Media 
                        src={image} 
                        alt={`${productName} ${i + 1}`} 
                        className="img-fluid image_zoom_cls-0" 
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <Media 
                  src={productImage} 
                  alt={productName} 
                  className="img-fluid image_zoom_cls-0" 
                />
              )}
            </div>
            <div className="col-lg-6 rtl-text">
              <div className="product-right">
                <h2>{productName}</h2>
                <h3>{formatPrice(price)}</h3>
                
                <ul className="rating-star">
                  {renderStars(productRating)}
                </ul>
                
                <div className="border-product">
                  <h6 className="product-title">product details</h6>
                  <p>{data?.description || "High-quality product with excellent features and durability."}</p>
                </div>
                
                <div className="product-description border-product">
                  {stockState !== "InStock" && (
                    <span className="instock-cls">{stockState}</span>
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
                    onClick={(e) => {
                      e.preventDefault();
                      if (addCart) addCart(data, quantity);
                    }}
                  >
                    add to cart
                  </a>
                  <a 
                    href="#" 
                    className="btn btn-normal" 
                    onClick={(e) => {
                      e.preventDefault();
                      clickProductDetail();
                    }}
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

export default ProductBox2;