import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Container, Row, Col } from "reactstrap";
import { searchController, SearchPageControl } from "@/app/globalProvider";
import Link from "next/link";

const localSearch = new SearchPageControl();
const ITEMS_PER_PAGE = 12;



const ProductList: React.FC<{ item: any }> = ({ item }) => {
  const imageSrc1 = item?.img?.[0] || "/placeholder.png";
  const imageSrc2 = item?.img?.[1] || imageSrc1;
  const title = item.name || item.title || "Untitled";
  const price = item.getBasePriceInCart?.() ?? item.price ?? "$0.00";
  const discount = item.getDiscount?.() ?? item.discount ?? "$0.00";

  const isKit = item?.type === "kit"; // Ensure this is set in your data
  const detailPath = isKit ? "/product-details" : "/product-details/thumbnail-left";
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
              <button title="Add to cart"><i className="ti-bag" /></button>
              <a href="#" title="Wishlist"><i className="ti-heart" /></a>
              <a href="#" title="Quick View"><i className="ti-search" /></a>
              <a href="#" title="Compare"><i className="fa fa-exchange" /></a>
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

  // Initial load (show all items)
  useEffect(() => {
    localSearch.clearText();
    searchController.searchInput = "";
    searchController.showEmptySearchResult = false;

    // Load all data initially
    localSearch.refreshGrid(""); // empty query to load everything

    const updateItems = () => {
      const combined = [...localSearch.products, ...localSearch.kits];
      setAllItems(combined);
      setFilteredItems(combined);
      setCurrentPage(1);
    };

    localSearch.on("update", updateItems);
    return () => {
      localSearch.off("update", updateItems);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setCurrentPage(1);
    localSearch.refreshGrid(value);
  };

  // Update filteredItems when query changes and new data comes
  useEffect(() => {
    const combined = [...localSearch.products, ...localSearch.kits];
    const filtered = query.trim()
      ? combined.filter((item) =>
          item.name?.toLowerCase().includes(query.toLowerCase())
        )
      : combined;
    setFilteredItems(filtered);
  }, [query, localSearch.products, localSearch.kits]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <section className="authentication-page section-big-pt-space bg-light">
        <div className="custom-containe">
          <section className="search-block">
            <Container>
              <Row>
                <Col lg="6" className="offset-lg-3">
                  <form className="form-header">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Products......"
                        value={query}
                        onChange={handleSearch}
                      />
                      <div className="input-group-append">
                        <button className="btn btn-normal" type="button">
                          <i className="fa fa-search" /> Search
                        </button>
                      </div>
                    </div>
                  </form>
                </Col>
              </Row>
            </Container>
          </section>
        </div>
      </section>

      <section className="section-big-py-space ratio_asos bg-light">
        <div className="custom-container">
          <div className="row search-product related-pro1">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, index) => (
                <ProductList item={item} key={index} />
              ))
            ) : (
              <Col className="text-center w-100">
                <p>No matching products or kits found.</p>
              </Col>
            )}
          </div>

          {filteredItems.length > ITEMS_PER_PAGE && (
            <div className="pagination-bar text-center mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li
                    key={i}
                    className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                  >
                    Next
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default SearchPage;
