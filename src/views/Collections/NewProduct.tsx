"use client";
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { Media } from "reactstrap";
import { useRouter } from "next/navigation"; // ✅ For client-side navigation
import { objCache, Product } from "@/app/globalProvider";

const bestSellerSetting = {
  dots: false,
  infinite: true,
  speed: 300,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
  autoplay: true,
  autoplaySpeed: 2000,
  pauseonHover: true,

  responsive: [
    {
      breakpoint: 1400,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        pauseOnHover: true,
      },
    },
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        pauseonHover: true,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 2000,
        pauseOnHover: true,
      },
    },
  ],
};

const NewProduct: React.FC = () => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    const products = objCache.getRecentlyAddedProducts(8);
    setRecentProducts(products);

    const updateHandler = () => {
      const updatedProducts = objCache.getRecentlyAddedProducts(8);
      setRecentProducts(updatedProducts);
    };

    objCache.on("update", updateHandler);
    return () => {
      objCache.off("update", updateHandler);
    };
  }, []);

  // Group products into chunks of 3 for each slide
  const chunkedProducts = recentProducts.reduce<Product[][]>(
    (result, product, index) => {
      const chunkIndex = Math.floor(index / 3);
      if (!result[chunkIndex]) result[chunkIndex] = [];
      result[chunkIndex].push(product);
      return result;
    },
    []
  );

  const handleProductClick = (id: number | string) => {
    router.push(`/product-details/${id}`);
  };

  return (
    <div className="theme-card creative-card creative-inner">
      <h5 className="title-border">New Products</h5>
      <div className="offer-slider slide-1">
        <Slider {...bestSellerSetting}>
          {chunkedProducts.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.map((product) => (
                <div
                  className="media cursor-pointer product-thumbnail flex-shrink-0 img.align-self-center p-3"
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  style={{ cursor: "pointer" }}
                >
                  <a>
                    <Media
                      className="img-fluid product-thumbnail.img p-2 h-100"
                      src={product.img[0]}
                      alt={product.name}
                    />
                  </a>
                  <div className="media-body align-self-center ms-4 ">                    
                    <h6 className="mb-2">{product.name}</h6>
                    <div className="rating-star mb-2">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fa fa-star ${
                            i <
                            (product.rating
                              ? product.rating.calculateRating()
                              : 0)
                              ? "text-warning"
                              : "fa-star-o text-warning"
                          }`}
                        ></i>
                      ))}
                    </div>
                    <h5 className="mb-0 ">${product.sellingPrice.toFixed(2)}</h5>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default NewProduct;
