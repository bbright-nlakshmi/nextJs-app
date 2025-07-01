import React, { useState, useEffect } from "react";

import { NextPage } from "next";

import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Media } from "reactstrap";
import ProductBox from "../Product-Box/productbox";

import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import { Skeleton } from "../../../../common/skeleton";
import { Category, CategoryProducts, Product, searchController } from '@/app/globalProvider';

// Swiper components, modules and styles
import { Autoplay, Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";



type TabProductProps = {
    effect?: any;
    categories?: Category[];
};

const CategoryProducts: NextPage<TabProductProps> = ({ effect, categories }) => {

    const { addToWish } = React.useContext(WishlistContext);
    const { addToCart } = React.useContext(CartContext);
    const { addToCompare } = React.useContext(CompareContext);
    const [activeTab, setActiveTab] = useState(0);


    const getPrice = (productId: string) => {
        const price = searchController.getDetails(productId, 'getProductPrice');

        return price;
    }
    if (categories)
        return (
            <>
                <section className="section-pt-space">
                    <div className="custom-container">
                        <div className="category-view">


                            {categories.map((c: any, i: any) =>
                            (
                                <><div className="category-item"><div className="category-rounded">
                                    <a className="thumbnail-preview">
                                        <Media src={c?.img[0]} alt="" className="img-fluid  image_zoom_cls-0" />
                                    </a>
                                </div><div className="text-xs lg:text-sm pt-3 w-full justify-center items-center flex">{c.name}</div>
                                </div>
                                </>
                            ))
                            }

                        </div>
                    </div>
                </section>


            </>
        );
};

export default CategoryProducts;
