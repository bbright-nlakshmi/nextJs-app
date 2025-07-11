"use client";
import { NextPage } from "next";
import { Row } from "reactstrap";
import Layout1 from "@/views/layouts/layout1";
import Collection from "@/views/Collections/Collection";
import { useEffect, useState } from "react";
import { Category, CategoryProducts, objCache, searchController } from "@/app/globalProvider";
import { useSearchParams } from "next/navigation";
import { FaSlidersH } from "react-icons/fa";
import NewProduct from "@/views/Collections/NewProduct";

const NoSidebar: NextPage = () => {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id");
  const categoryType = searchParams.get("type");

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(150);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCatgeoryProducts, setselectedCatgeoryProducts] = useState<CategoryProducts[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<CategoryProducts[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const toggleMobileFilter = () => setIsMobileFilterOpen(prev => !prev);

  useEffect(() => {
    const initialCategory = objCache.allCategories.find(cat => cat.id === categoryId);
    if (!hasInitialized) {
      setHasInitialized(true);
      if (initialCategory) {
        setSelectedCategories([initialCategory]);
        const products = initialCategory.category_products || [];
        setselectedCatgeoryProducts(products);
        setFilteredProducts(products);
        updatePriceRangeFromFilteredProducts(products);
      }
    }

    objCache.on("updateAllCategories", (data: Category[]) => {
      setAllCategories(data);
      setSelectedCategories((prevSelected) => {
        const updatedSelected = prevSelected
          .map((prevCat) => data.find((newCat) => newCat.id === prevCat.id))
          .filter((cat): cat is Category => !!cat);
        const combinedProducts = getFilteredByCategoryProducts(updatedSelected);
        setselectedCatgeoryProducts(combinedProducts);
        setFilteredProducts(combinedProducts);
        updatePriceRangeFromFilteredProducts(combinedProducts);
        return updatedSelected;
      });
    });
  }, []);

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = selectedCatgeoryProducts.filter(prod => {
      const id = categoryType === "discount" ? prod.id : prod.productId;
      const price = searchController.getDetails(id, "getPrice");
      return typeof price === "number" && price >= minPrice && price <= maxPrice;
    });
    setFilteredProducts(filtered);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setMinPrice(val);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setMaxPrice(val);
  };

  const handleCategoryChange = (category: Category) => {
    const updatedCategories = selectedCategories.find(cat => cat.id === category.id)
      ? selectedCategories.filter(cat => cat.id !== category.id)
      : [...selectedCategories, category];

    setSelectedCategories(updatedCategories);
    const updatedProducts = getFilteredByCategoryProducts(updatedCategories);
    setselectedCatgeoryProducts(updatedProducts);
    setFilteredProducts(updatedProducts);
    updatePriceRangeFromFilteredProducts(updatedProducts);
  };

  const getFilteredByCategoryProducts = (catselected: Category[]): CategoryProducts[] => {
    const catProds: CategoryProducts[] = [];
    catselected.forEach(cat => {
      catProds.push(...(cat.category_products || []));
    });
    return catProds;
  };

  const updatePriceRangeFromFilteredProducts = (products: CategoryProducts[]) => {
    const prices: number[] = products
      .map(prod => {
        const id = categoryType === "discount" ? prod.id : prod.productId;
        return searchController.getDetails(id, "getPrice");
      })
      .filter((p): p is number => typeof p === "number" && !isNaN(p));

    if (prices.length > 0) {
      setMinPrice(Math.min(...prices));
      setMaxPrice(Math.max(...prices));
    } else {
      setMinPrice(0);
      setMaxPrice(150);
    }
  };

  const allBrands = ["Frito Lay", "Nespresso", "Oreo", "Quaker", "Welch's"];

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const renderFilterSidebar = () => (
    <>
      {/* Price Filter */}
      <div className="single-filter-box">
        <h5 className="title">Widget Price Filter</h5>
        <div className="filterbox-body">
          <form className="price-input-area" onSubmit={handlePriceFilterSubmit}>
            <div className="half-input-wrapper">
              <div className="single">
                <label htmlFor="min">Min price</label>
                <input id="min" type="number" value={minPrice} min={0} onChange={handleMinPriceChange} />
              </div>
              <div className="single">
                <label htmlFor="max">Max price</label>
                <input id="max" type="number" value={maxPrice} min={0} onChange={handleMaxPriceChange} />
              </div>
            </div>
            <input
              type="range"
              className="range"
              min={minPrice}
              max={maxPrice}
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
            />
            <div className="filter-value-min-max">
              <span>Price: ${minPrice} — ${maxPrice}</span>
              <button type="submit" className="rts-btn btn-primary">Filter</button>
            </div>
          </form>
        </div>
      </div>

      {/* Categories */}
      <div className="single-filter-box">
        <h5 className="title">Product Categories</h5>
        <div className="filterbox-body">
          <div className="category-wrapper ">
            {allCategories.map((cat, i) => (
              <div className="single-category" key={i}>
                <input
                  id={`cat${i + 1}`}
                  type="checkbox"
                  checked={selectedCategories.some(item => cat.id === item.id)}
                  onChange={() => handleCategoryChange(cat)}
                />
                <label htmlFor={`cat${i + 1}`}>{cat.name}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brands */}
      <div className="single-filter-box">
        <h5 className="title">Select Brands</h5>
        <div className="filterbox-body">
          <div className="category-wrapper">
            {allBrands.map((brand, i) => (
              <div className="single-category" key={i}>
                <input
                  id={`brand${i + 1}`}
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                />
                <label htmlFor={`brand${i + 1}`}>{brand}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Products */}
      <div className="sidebar-new-product mt-4">
        <NewProduct />
      </div>
    </>
  );

  return (
    <Layout1>
      {/* Mobile Filter Toggle */}
      <div className="mobile-filter-toggle d-block d-lg-none">
        <button className="btn btn-filter-icon" onClick={toggleMobileFilter}>
          <FaSlidersH className="me-2" /> Filter
        </button>
      </div>

      <div className="shop-grid-sidebar-area rts-section-gap">
        <div className="container">
          <div className="row g-0">
            <div className="col-xl-3 col-lg-12 d-none d-xl-block pr--70 pr_lg--10 pr_sm--10 pr_md--5 rts-sticky-column-item">
              <div className="sidebar-filter-main theiaStickySidebar">
                {renderFilterSidebar()}
              </div>
            </div>
            <div className="col-xl-9 col-lg-12">
              <div className="collection-wrapper">
                <div className="custom-container section-big-pb-space">
                  <Row>
                    <Collection
                      categoryProducts={filteredProducts}
                      cols="col-xl-2 col-lg-3 col-md-4 col-4 col-grid-box"
                      layoutList=""
                    />
                  </Row>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`mobile-sidebar-overlay ${isMobileFilterOpen ? "open" : ""}`}
        onClick={toggleMobileFilter}
      />
      <div className={`mobile-sidebar ${isMobileFilterOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-header">
          <button className="btn-close" onClick={toggleMobileFilter}>✖</button>
        </div>
        <div className="mobile-sidebar-content">
          {renderFilterSidebar()}
        </div>
      </div>
    </Layout1>
  );
};

export default NoSidebar;
