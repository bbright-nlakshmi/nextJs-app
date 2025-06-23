import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Media } from "reactstrap";
import { useTranslation } from "react-i18next";
import { searchController } from "@/app/globalProvider";

import Link from "next/link";
type LocalProps = {
    show: boolean
}
export const SearchResults: NextPage<LocalProps> = ({ show }) => {
    if (show)
        return (

            <>    <div className="search-results-wrapper   nav-desk">
                <div className="search_results_container">
                    <ul className="search_list nav-cat title-font " >
                        {searchController.products.map(product => {
                            return (
                                <><li>
                                    <a href={`/product-details/${product?.id}`}>
                                        <Media src={product?.img[0]} alt="" className="img-fluid  image_zoom_cls-0" />
                                        {/* ?{product?.name} */}
                                        <h6 className="price-title">{product?.name}</h6>
                                    </a></li></>
                            )
                        }
                        )}

                    </ul>
                </div>
            </div>

            </>

        );
};

export default SearchResults;
