import React, { useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import { Container, Row, Col } from "reactstrap";
import { Product, searchController } from "@/app/globalProvider";
import Link from "next/link";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { CartContext } from "@/helpers/cart/cart.context";
import { CompareContext } from "@/helpers/compare/compare.context";
import PostLoader from "@/common/postLoader";

const ITEMS_PER_PAGE = 50;

const ProductList: React.FC<{ item: any }> = ({ item }) => {
  const imageSrc1 = item?.img?.[0] || "/placeholder.png";
  const imageSrc2 = item?.img?.[1] || imageSrc1;
  const title = item.name || item.title || "Untitled";
  const price = item.getBasePriceInCart?.() ?? item.price ?? "$0.00";
  const discount = item.getDiscount?.() ?? item.discount ?? "$0.00";

  const isKit = item?.type === "kit";
  const detailPath = isKit
    ? "/product-details"
    : "/product-details/thumbnail-left";
  const detailQuery = { id: item.id };

  return (
    <Col xl="3" md="4" sm="6">
      <div className="product">
        <div className="product-box">
          <Link href={{ pathname: detailPath, query: detailQuery }}>
            <div className="product-imgbox cursor-pointer">
              <div className="product-front">
                <img src={imageSrc1} className="img-fluid" alt="product" />
              </div>
              <div className="product-back">
                <img src={imageSrc2} className="img-fluid" alt="product" />
              </div>
            </div>
          </Link>
          <div className="product-detail detail-center">
            <div className="detail-title">
              <div className="detail-left">
                <div className="rating-star">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fa fa-star" />
                  ))}
                </div>
                <Link href={{ pathname: detailPath, query: detailQuery }}>
                  <h6 className="price-title cursor-pointer">{title}</h6>
                </Link>
              </div>
              <div className="detail-right">
                <div className="check-price">{price}</div>
                <div className="price">{discount}</div>
              </div>
            </div>
            <div className="icon-detail">
              <button title="Add to cart">
                <i className="ti-bag" />
              </button>
              <a href="#" title="Wishlist">
                <i className="ti-heart" />
              </a>
              <a href="#" title="Quick View">
                <i className="ti-search" />
              </a>
              <a href="#" title="Compare">
                <i className="fa fa-exchange" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Col>
  );
};

const SearchPage: NextPage = () => {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);

  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  
  const cols = "col-xl-2 col-md-4 col-6 col-grid-box";
  const [grid, setGrid] = useState(cols);
  const [layout, setLayout] = useState("");
  const [currentRange, setCurrentRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState("ASC_ORDER");

  const defaultRangeSize = 100;
  const maxRanges = useMemo(() => {
    return Math.ceil(filteredItems.length / defaultRangeSize);
  }, [filteredItems.length]);

  useEffect(() => {
    setLoading(true);
    searchController.clearText();
    searchController.searchInput = "";
    searchController.showEmptySearchResult = false;
    searchController.refreshGrid("");

    const updateItems = () => {
      const combined = [...searchController.products, ...searchController.kits];
      setAllItems(combined);
      setFilteredItems(combined);
      setCurrentPage(1);
      setLoading(false);
    };

    searchController.on("update", updateItems);
    return () => {
      searchController.off("update", updateItems);
    };
  }, []);

  const handleAddToCart = (item: any, qty = 1) => {
    const cartItem = {
      ...item,
      price: item.getPrice(),
      id: item.productId,
    };
    addToCart(cartItem, qty);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setCurrentPage(1);
    searchController.refreshGrid(value);
  };

  useEffect(() => {
    const combined = [...searchController.products, ...searchController.kits];
    const filtered = query.trim()
      ? combined.filter((item) =>
          item.name?.toLowerCase().includes(query.toLowerCase())
        )
      : combined;
    setFilteredItems(filtered);
  }, [query, searchController.products, searchController.kits]);

  const rangeOptions = useMemo(() => {
    const ranges: Array<{ label: string; value: [number, number] }> = [];
    const rangeCount = Math.min(
      Math.ceil(filteredItems.length / defaultRangeSize),
      maxRanges
    );

    for (let i = 0; i < rangeCount; i++) {
      const start = i * defaultRangeSize;
      const end = Math.min((i + 1) * defaultRangeSize, filteredItems.length);
      ranges.push({
        label: `${start}-${end}`,
        value: [start, end],
      });
    }

    if (rangeCount > 1) {
      ranges.push({
        label: `Show All (0-${filteredItems.length})`,
        value: [0, filteredItems.length],
      });
    }

    return ranges;
  }, [filteredItems.length, defaultRangeSize, maxRanges]);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = e.target.selectedIndex;
    const selectedRange = rangeOptions[selectedIndex].value;
    setCurrentRange(selectedRange);
  };

  const sortProducts = (products: any[], sortOption: string) => {
    const sorted = [...products];
    switch (sortOption) {
      case "HIGH_TO_LOW":
        return sorted.sort(
          (a, b) => (b.getPrice?.() || 0) - (a.getPrice?.() || 0)
        );
      case "LOW_TO_HIGH":
        return sorted.sort(
          (a, b) => (a.getPrice?.() || 0) - (b.getPrice?.() || 0)
        );
      case "NEWEST":
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
      case "DESC_ORDER":
        return sorted.sort((a, b) => b.name?.localeCompare(a.name || "") || 0);
      case "ASC_ORDER":
      default:
        return sorted.sort((a, b) => a.name?.localeCompare(b.name || "") || 0);
    }
  };

  const sortedItems = useMemo(() => {
    return sortProducts(filteredItems, sortBy);
  }, [filteredItems, sortBy]);

  const paginatedItems = useMemo(() => {
    return sortedItems.slice(...currentRange);
  }, [sortedItems, currentRange]);

  return (
    <>
      <section className="enhanced-search-section">
        <div className="custom-container">
          <div className="search-container">
            <form className="enhanced-search-form">
              <div className="enhanced-search-group">
                <input
                  type="text"
                  className="enhanced-search-input"
                  placeholder="Search for products, brands, categories..."
                  value={query}
                  onChange={handleSearch}
                  autoComplete="off"
                />
                <i className="fa fa-search search-icon" />
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="product-top-filter">
        <Row>
          <Col xs="12">
            <div className="product-filter-content">
              <div className="search-count">
                <h5>
                  {filteredItems
                    ? `Showing Products ${currentRange[0]}-${currentRange[1]} of ${filteredItems.length}`
                    : "loading"}{" "}
                  Results
                </h5>
              </div>
              <div className="collection-view">
                <ul>
                  <li
                    onClick={() => {
                      setLayout("");
                      setGrid(cols);
                    }}
                  >
                    <i className="fa fa-th grid-layout-view"></i>
                  </li>
                  <li
                    className="d-sm-block d-lg-none"
                    onClick={() => {
                      setLayout("list-view");
                      setGrid("col-lg-12");
                    }}
                  >
                    <i className="fa fa-list-ul list-layout-view"></i>
                  </li>
                </ul>
              </div>
              <div
                className="collection-grid-view d-sm-none d-lg-block"
                style={layout === "list-view" ? { opacity: 0 } : { opacity: 1 }}
              >
                <ul className="d-sm-none d-lg-block">
                  <li onClick={() => setGrid("col-lg-6 col-sm-6")}>
                    <img
                      src="/images/category/icon/2.png"
                      alt=""
                      className="product-2-layout-view"
                    />
                  </li>
                  <li onClick={() => setGrid("col-lg-4 col-sm-4")}>
                    <img
                      src="/images/category/icon/3.png"
                      alt=""
                      className="product-3-layout-view"
                    />
                  </li>
                  <li onClick={() => setGrid("col-lg-3 col-sm-3")}>
                    <img
                      src="/images/category/icon/4.png"
                      alt=""
                      className="product-4-layout-view"
                    />
                  </li>
                </ul>
              </div>
              <div className="product-page-per-view">
                <select name="pagination" onChange={handleRangeChange}>
                  {rangeOptions.map((option, index) => (
                    <option key={index} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="product-page-filter">
                <select
                  name="filter"
                  onChange={(e) => {
                    setIsSorting(true);
                    const selectedSort = e.target.value;
                    setSortBy(selectedSort);
                    setTimeout(() => setIsSorting(false), 500);
                  }}
                >
                  <option value="">Sorting items</option>
                  <option value="HIGH_TO_LOW">High To Low</option>
                  <option value="LOW_TO_HIGH">Low To High</option>
                  <option value="NEWEST">Newest</option>
                  <option value="ASC_ORDER">Asc Order</option>
                  <option value="DESC_ORDER">Desc Order</option>
                </select>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <section className="section-big-py-space ratio_asos">
        <div className="custom-container">
          {loading ? (
            <Row>
              <PostLoader count={20} />
            </Row>
          ) : (
            <>
              {isSorting && (
                <div className="d-flex justify-content-center align-items-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Sorting...</span>
                  </div>
                </div>
              )}
              <div className="row search-product related-pro1">
                <div
                  className={`product product-slide-6 product-m no-arrow ${layout}`}
                >
                  <Row>
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item: Product) => (
                        <div className={grid} key={item.id}>
                          <ProductBox
                            layout="layout-one"
                            price={item.getPrice()}
                            hoverEffect={"icon-inline"}
                            data={item}
                            addCart={handleAddToCart}
                            addCompare={() => addToCompare(item)}
                            addWish={() => addToWish(item)}
                          />
                        </div>
                      ))
                    ) : (
                      <Col className="text-center w-100">
                        <p>No matching products or kits found.</p>
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default SearchPage;