import React, { useState, useEffect, useContext, useMemo } from "react";
import { NextPage } from "next";
import { Media, Row, Col, Container } from "reactstrap";
import Breadcrumb from "@/views/Containers/Breadcrumb";
// Update this import path
import { Category, objCache, searchController } from "@/app/globalProvider";
import { useRouter, useSearchParams } from "next/navigation";

import { FilterContext } from "@/helpers/filter/filter.context";

// Define interfaces for type safety
interface BusinessDetails {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  // Add other properties as needed based on your BusinessDetails model
}
const cols = "col-xl-2 col-md-4 col-6 col-grid-box";
const CategoryPage: NextPage = () => {
  const [loading, setLoading] = useState(true);
  const [Categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryType = searchParams.get("type") || "all";

  const { setLeftSidebarOpen, leftSidebarOpen } = useContext(FilterContext);

  const [grid, setGrid] = useState(cols);
  const [pageLimit, setPageLimit] = useState(50);
  const [layout, setLayout] = useState("");

  // Use useMemo to avoid recalculating filtered categories on every render
  const filteredCategories = useMemo(() => {
    return query.trim()
      ? Categories.filter((item) =>
          item.name?.toLowerCase().includes(query.toLowerCase())
        )
      : Categories;
  }, [query, Categories]);

  const paginatedItems = useMemo(() => {
    return filteredCategories.slice(
      (currentPage - 1) * pageLimit,
      currentPage * pageLimit
    );
  }, [filteredCategories, currentPage, pageLimit]);

  const totalPages = Math.ceil(filteredCategories.length / pageLimit);

  useEffect(() => {
    try {
      setLoading(true);
      if (categoryType === "featured") {
        setCategories(objCache.categories);
        objCache.on("updateCategories", (data: Category[]) => {
          setCategories(data);
        });
      }
      if (categoryType === "all") {
        setCategories(objCache.allCategories);
        objCache.on("updateAllCategories", (data: Category[]) => {
          setCategories(data);
        });
      }
    } catch (err) {
      console.error("Error fetching business details:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryType]); // Changed from [query] to [categoryType] since that's what you're using

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="bg-light">
        <Breadcrumb title="Store" parent="home" />
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "400px" }}
        >
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb title="Categories" parent="home" />
      <section className="authentication-page ptb--20">
        <div className="custom-container">
          <section className="search-block">
            <Container>
              <Row>
                <Col lg="6" className="offset-lg-3">
                  <form className="form-header">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Categories......"
                        value={query}
                        onChange={handleSearch}
                      />
                      {/* <div className="input-group-append">
                        <button className="btn btn-normal" type="button">
                          <i className="fa fa-search" /> Search
                        </button>
                      </div> */}
                    </div>
                  </form>
                </Col>
              </Row>
            </Container>
          </section>
        </div>
      </section>

      <div className="product-top-filter">
        <Row>
          {/* <Col xs="12">
            <div className="filter-main-btn">
              <span
                className="filter-btn"
                onClick={() => {
                  setLeftSidebarOpen(!leftSidebarOpen);
                }}
              >
                <i className="fa fa-filter" aria-hidden="true"></i> Filter
              </span>
            </div>
          </Col> */}
          <Col xs="12">
            <div className="product-filter-content">
              <div className="search-count">
                <h5>
                  {Categories
                    ? `Showing Products 1-${Math.min(
                        pageLimit,
                        filteredCategories.length
                      )} of ${filteredCategories.length}`
                    : "loading"}{" "}
                  Result
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
                className="collection-grid-view"
                style={layout === "list-view" ? { opacity: 0 } : { opacity: 1 }}
              >
                <ul>
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
                <select
                  onChange={(e) => setPageLimit(parseInt(e.target.value))}
                >
                  <option value="10" selected={pageLimit === 10}>
                    10 Products Par Page
                  </option>

                  <option value="20" selected={pageLimit === 20}>
                    20 Products Par Page
                  </option>
                  <option value="50" selected={pageLimit === 50}>
                    50 Products Par Page
                  </option>
                  <option value="100" selected={pageLimit === 100}>
                    100 Products Par Page
                  </option>
                  <option
                    value={filteredCategories.length}
                    selected={pageLimit === filteredCategories.length}
                  >
                    Show All
                  </option>
                </select>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <div className="bg-light">
        {/* Categories section */}
        <div className={`product-wrapper-grid ${layout}`}>
          <Row>
            {paginatedItems.map((category) => (
              <div className={grid} key={category.id}>
                <div
                  className="category-item mb-4 p-3 border rounded shadow-sm"
                  onClick={() =>
                    router.push(
                      `/collections/no-sidebar?id=${category.id}&type=category`
                    )
                  }
                >
                  {category.img.length > 0 && (
                    <Media
                      body
                      src={category.img[0] || "/placeholder.jpg"}
                      alt={category.name}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginRight: "10px",
                      }}
                    ></Media>
                  )}
                  <h5>{category.name}</h5>
                </div>
              </div>
            ))}
          </Row>
        </div>
      </div>
    </>
  );
};
export default CategoryPage;
