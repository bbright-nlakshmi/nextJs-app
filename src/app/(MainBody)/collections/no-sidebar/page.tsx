"use client";
import { NextPage } from "next";
import { Row } from "reactstrap";
import Layout1 from "@/views/layouts/layout1";
import Collection from "@/views/Collections/Collection";
import { useEffect, useState } from "react";
import { Category, CategoryProducts, objCache } from "@/app/globalProvider";
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
        setselectedCatgeoryProducts(initialCategory.category_products || []);
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
        return updatedSelected;
      });
    });
  }, []);

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Optional: Filter logic for price
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
    let updatedCategories: Category[];
    if (selectedCategories.find(cat => cat.id === category.id)) {
      updatedCategories = selectedCategories.filter(cat => cat.id !== category.id);
    } else {
      updatedCategories = [...selectedCategories, category];
    }
    setSelectedCategories(updatedCategories);
    const updatedProducts = getFilteredByCategoryProducts(updatedCategories);
    setselectedCatgeoryProducts(updatedProducts);
  };

  const getFilteredByCategoryProducts = (catselected: Category[]): CategoryProducts[] => {
    const catProds: CategoryProducts[] = [];
    catselected.forEach(cat => {
      catProds.push(...(cat.category_products || []));
    });
    return catProds;
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
              min={0}
              max={150}
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
                  checked={selectedCategories.findIndex(item => cat.id === item.id) !== -1}
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
       <div className="sidebar-new-product mt-4">
      <NewProduct />
    </div>
    </>
  );

  return (
    <Layout1>
  {/* Mobile Filter Button */}
  {/* Compact Filter Button with Icon */}
  <div className="mobile-filter-toggle d-block d-lg-none">
    <button className="btn btn-filter-icon" onClick={toggleMobileFilter}>
       <FaSlidersH className="me-2" /> Filter
    </button>
   </div>


      {/* Main Grid */}
      <div className="shop-grid-sidebar-area rts-section-gap">
        <div className="container">
          <div className="row g-0">
            {/* Desktop Sidebar */}
            <div className="col-xl-3 col-lg-12 d-none d-xl-block pr--70 pr_lg--10 pr_sm--10 pr_md--5 rts-sticky-column-item">
              <div className="sidebar-filter-main theiaStickySidebar">
                {renderFilterSidebar()}
              </div>
            </div>

            {/* Products */}
            <div className="col-xl-9 col-lg-12">
              <div className="collection-wrapper">
                <div className="custom-container section-big-pb-space">
                  <Row>
                    <Collection categoryProducts={selectedCatgeoryProducts} cols="col-xl-2 col-lg-3 col-md-4 col-4 col-grid-box" layoutList="" />
                  </Row>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {/* Mobile Overlay */}
<div
  className={`mobile-sidebar-overlay ${isMobileFilterOpen ? "open" : ""}`}
  onClick={toggleMobileFilter}
/>

{/* Mobile Sidebar */}
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
