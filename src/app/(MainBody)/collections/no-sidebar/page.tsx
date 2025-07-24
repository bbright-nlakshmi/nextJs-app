"use client";
import { NextPage } from "next";
import { Row } from "reactstrap";
import Layout1 from "@/views/layouts/layout1";
import Collection from "@/views/Collections/Collection";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Category,
  CategoryProducts,
  objCache,
  searchController,
} from "@/app/globalProvider";
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
  const [selectedCatgeoryProducts, setselectedCatgeoryProducts] = useState<
    CategoryProducts[]
  >([]);
  const [filteredProducts, setFilteredProducts] = useState<CategoryProducts[]>(
    []
  );
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add refs to track if data has been loaded to prevent unnecessary reloads
  const isInitialLoadDone = useRef(false);
  const currentCategoryId = useRef<string | null>(null);

  const toggleMobileFilter = () => setIsMobileFilterOpen((prev) => !prev);

  // Function to update price range from products
  const updatePriceRangeFromFilteredProducts = useCallback(
    (products: CategoryProducts[]) => {
      const prices: number[] = products
        .map((prod: any) => {
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
    },
    [categoryType]
  );

  // Function to load category data based on current URL parameters
  const loadCategoryData = useCallback(() => {
    if (!categoryId) {
      setSelectedCategories([]);
      setselectedCatgeoryProducts([]);
      setFilteredProducts([]);
      setMinPrice(0);
      setMaxPrice(150);
      setIsLoading(false);
      currentCategoryId.current = null;
      return;
    }

    // Get the latest categories from objCache
    const currentCategories = objCache.allCategories || [];

    const targetCategory = currentCategories.find(
      (cat) => cat.id === categoryId
    );

    if (targetCategory) {
      setSelectedCategories([targetCategory]);
      const products = targetCategory.category_products || [];

      setselectedCatgeoryProducts(products);
      setFilteredProducts(products);
      updatePriceRangeFromFilteredProducts(products);
      currentCategoryId.current = categoryId;
    } else {
      setSelectedCategories([]);
      setselectedCatgeoryProducts([]);
      setFilteredProducts([]);
      setMinPrice(0);
      setMaxPrice(150);
      currentCategoryId.current = null;
    }

    setIsLoading(false);
    isInitialLoadDone.current = true;
  }, [categoryId, categoryType, updatePriceRangeFromFilteredProducts]);

  // Initial setup and objCache listener
  useEffect(() => {
    // Set initial categories
    setAllCategories(objCache.allCategories || []);

    // Load initial data only if not already loaded
    if (!isInitialLoadDone.current) {
      loadCategoryData();
    }

    // Listen for category updates - but don't reload if we're already showing a category
    const handleCategoriesUpdate = (data: Category[]) => {
      setAllCategories(data);

      // Only reload if we don't have a current category selected or if the categories were empty before
      if (!currentCategoryId.current || allCategories.length === 0) {
        setTimeout(() => loadCategoryData(), 100);
      } else {
        // Just update the categories list without reloading the current selection
      }
    };

    objCache.on("updateAllCategories", handleCategoriesUpdate);

    // Cleanup
    return () => {
      // If objCache has an off method, use it
      if (objCache.off) {
        objCache.off("updateAllCategories", handleCategoriesUpdate);
      }
    };
  }, []); // Empty dependency array for setup only

  // Handle URL parameter changes - only reload when URL actually changes
  useEffect(() => {
    // Only reload if the category ID actually changed
    if (currentCategoryId.current !== categoryId) {
      setIsLoading(true);
      // Small delay to ensure any navigation state is settled
      const timer = setTimeout(() => {
        loadCategoryData();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [categoryId, categoryType, loadCategoryData]);

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = selectedCatgeoryProducts.filter((prod: any) => {
      const id = categoryType === "discount" ? prod.id : prod.productId;
      const price = searchController.getDetails(id, "getPrice");
      return (
        typeof price === "number" && price >= minPrice && price <= maxPrice
      );
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
    const updatedCategories = selectedCategories.find(
      (cat) => cat.id === category.id
    )
      ? selectedCategories.filter((cat) => cat.id !== category.id)
      : [...selectedCategories, category];

    setSelectedCategories(updatedCategories);
    const updatedProducts = getFilteredByCategoryProducts(updatedCategories);
    setselectedCatgeoryProducts(updatedProducts);
    setFilteredProducts(updatedProducts);
    updatePriceRangeFromFilteredProducts(updatedProducts);

    // Update current category tracking
    if (updatedCategories.length > 0) {
      currentCategoryId.current = updatedCategories[0].id;
    } else {
      currentCategoryId.current = null;
    }
  };

  const getFilteredByCategoryProducts = (
    catselected: Category[]
  ): CategoryProducts[] => {
    const catProds: CategoryProducts[] = [];
    catselected.forEach((cat) => {
      catProds.push(...(cat.category_products || []));
    });
    return catProds;
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
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
                <input
                  id="min"
                  type="number"
                  value={minPrice}
                  min={0}
                  onChange={handleMinPriceChange}
                />
              </div>
              <div className="single">
                <label htmlFor="max">Max price</label>
                <input
                  id="max"
                  type="number"
                  value={maxPrice}
                  min={0}
                  onChange={handleMaxPriceChange}
                />
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
              <span>
                Price: ₹{minPrice} — ₹{maxPrice}
              </span>
              <button type="submit" className="rts-btn btn-primary">
                Filter
              </button>
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
                  checked={selectedCategories.some(
                    (item) => cat.id === item.id
                  )}
                  onChange={() => handleCategoryChange(cat)}
                />
                <label htmlFor={`cat${i + 1}`}>{cat.name}</label>
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

  // Show loading state
  if (isLoading) {
    return (
      <Layout1>
        <div className="shop-grid-sidebar-area rts-section-gap">
          <div className="container">
            <div className="text-center py-5">
              <div>Loading...</div>
            </div>
          </div>
        </div>
      </Layout1>
    );
  }

  return (
    <Layout1>
      {/* Mobile Filter Toggle */}
      <div className="mobile-filter-toggle d-block d-xl-none">
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
                    {filteredProducts.length > 0 ? (
                      <Collection
                        categoryProducts={filteredProducts}
                        cols="col-xl-3 col-lg-3 col-sm-4 col-md-4 col-6 col-grid-box"
                        layoutList=""
                      />
                    ) : (
                      <div className="col-12 text-center py-5">
                        <h4>No products found for this category</h4>
                        <p>
                          Please select a different category or check back
                          later.
                        </p>
                      </div>
                    )}
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
          <button className="btn-close" onClick={toggleMobileFilter}>
            ✖
          </button>
        </div>
        <div className="mobile-sidebar-content">{renderFilterSidebar()}</div>
      </div>
    </Layout1>
  );
};

export default NoSidebar;
