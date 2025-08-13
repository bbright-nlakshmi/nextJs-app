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
  Product,
  searchController,
} from "@/app/globalProvider";
import { useSearchParams } from "next/navigation";
import { FaSlidersH, FaTimes } from "react-icons/fa";
import NewProduct from "@/views/Collections/NewProduct";

const NoSidebar: NextPage = () => {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id");
  const categoryType = searchParams.get("type");

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(150);
  const [tempMinPrice, setTempMinPrice] = useState<number>(0);
  const [tempMaxPrice, setTempMaxPrice] = useState<number>(150);
  const [absoluteMinPrice, setAbsoluteMinPrice] = useState<number>(0);
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState<number>(150);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [discountCategories, setDiscountCategories] = useState<Category[]>([]);
  const [selectedCatgeoryProducts, setselectedCatgeoryProducts] = useState<
    CategoryProducts[]
  >([]);
  const [filteredProducts, setFilteredProducts] = useState<CategoryProducts[]>(
    []
  );
  const [allDiscountProducts, setAllDiscountProducts] = useState<
    CategoryProducts[]
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [currentDiscount, setCurrentDiscount] = useState<any>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state to track if price filter is applied
  const [isPriceFilterApplied, setIsPriceFilterApplied] = useState(false);
  
  // Add refs to track if data has been loaded to prevent unnecessary reloads
  const isInitialLoadDone = useRef(false);
  const currentCategoryId = useRef<string | null>(null);

  const toggleMobileFilter = () => setIsMobileFilterOpen((prev) => !prev);

  // Function to update price range from products
  const updatePriceRangeFromFilteredProducts = useCallback((
    products: CategoryProducts[]
  ) => {
    // For discount pages, keep absolute min/max from all discounted products; don't override on per-category updates
    if (categoryType === "discount") {
      return;
    }
    const prices: number[] = products
      .map((prod: any) => {
        const id = categoryType === "discount" ? prod.id : prod.productId;
        return searchController.getDetails(id, "getPrice");
      })
      .filter((p): p is number => typeof p === "number" && !isNaN(p));

    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setAbsoluteMinPrice(min);
      setAbsoluteMaxPrice(max);
      
      // Only reset price filters if no price filter is currently applied
      if (!isPriceFilterApplied) {
        setMinPrice(min);
        setMaxPrice(max);
        setTempMinPrice(min);
        setTempMaxPrice(max);
      }
    } else {
      setAbsoluteMinPrice(0);
      setAbsoluteMaxPrice(150);
      if (!isPriceFilterApplied) {
        setMinPrice(0);
        setMaxPrice(150);
        setTempMinPrice(0);
        setTempMaxPrice(150);
      }
    }
  }, [categoryType, isPriceFilterApplied]);

  // Function to apply price filter
  const applyPriceFilter = useCallback((products: CategoryProducts[], minPrice: number, maxPrice: number) => {
    return products.filter((prod: any) => {
      const id = categoryType === "discount" ? prod.id : prod.productId;
      const price = searchController.getDetails(id, "getPrice");
      return (
        typeof price === "number" && price >= minPrice && price <= maxPrice
      );
    });
  }, [categoryType]);

  // Function to load category data based on current URL parameters
  const loadCategoryData = useCallback(() => {
    if (!categoryId) {
      setSelectedCategories([]);
      setselectedCatgeoryProducts([]);
      setFilteredProducts([]);
      setMinPrice(0);
      setMaxPrice(150);
      setIsPriceFilterApplied(false);
      setIsLoading(false);
      currentCategoryId.current = null;
      return;
    }

    if (categoryType === "discount") {
      // For discount type, prepare discount-specific categories and products
      const found = objCache.discountList.find((item: any) => item.id === categoryId);
      if (found) {
        setCurrentDiscount(found);
        
        // Get all products from objCache to build a comprehensive mapping
        const allProducts = objCache.allProducstsList || [];
        const productToCategory = new Map<string, string>();
        
        // Build productId -> categoryId map from all categories
        (objCache.allCategories || []).forEach((cat: Category) => {
          (cat.category_products || []).forEach((prod: any) => {
            const pid = String(prod.productId ?? prod.id ?? "");
            if (pid) productToCategory.set(pid, cat.id);
          });
        });
        
        // Also try to map by product name as fallback
        allProducts.forEach((prod: any) => {
          const pid = String(prod.productId ?? prod.id ?? "");
          if (pid && !productToCategory.has(pid)) {
            // Try to find category by product name
            const matchingCategory = (objCache.allCategories || []).find((cat: Category) => {
              return (cat.category_products || []).some((catProd: any) => 
                catProd.name === prod.name || catProd.title === prod.title
              );
            });
            if (matchingCategory) {
              productToCategory.set(pid, matchingCategory.id);
            }
          }
        });

        // Normalize discount items into CategoryProducts-like objects
        const items: CategoryProducts[] = (found.discountItems || []).map((item: any) => {
          const pid = String(item.productId ?? item.id ?? "");
          const derivedCatId = item.categoryId || productToCategory.get(pid) || "";
          
          // Debug logging for category mapping
          console.log('Mapping discount item:', {
            itemId: item.id,
            productId: item.productId,
            name: item.name,
            originalCategoryId: item.categoryId,
            derivedCategoryId: derivedCatId,
            mappedFromProductId: productToCategory.get(pid)
          });
          
          return {
            ...item,
            active: item.active ?? false,
            productId: item.productId ?? item.id,
            categoryId: derivedCatId,
          };
        });

        setAllDiscountProducts(items);

        // Build categories list that have discounted products
        const categoryIds = new Set<string>(items.map((it: any) => it.categoryId).filter((id: any) => !!id));
        const availableCategories: Category[] = (objCache.allCategories || []).filter(
          (cat: Category) => categoryIds.has(cat.id)
        );
        
        // If no categories found, create a fallback category to ensure products are shown
        let finalCategories = availableCategories;
        if (availableCategories.length === 0 && items.length > 0) {
          // Create a fallback category for uncategorized discount products
          const fallbackCategory: Category = {
            id: 'uncategorized-discount',
            name: 'Discount Products',
            img: [],
            category_products: items,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          finalCategories = [fallbackCategory];
          
          // Update items to use the fallback category
          const updatedItems = items.map(item => ({
            ...item,
            categoryId: 'uncategorized-discount'
          }));
          setAllDiscountProducts(updatedItems);
          setselectedCatgeoryProducts(updatedItems);
          setFilteredProducts(updatedItems);
        } else {
          setAllDiscountProducts(items);
          setselectedCatgeoryProducts(items);
          setFilteredProducts(!isPriceFilterApplied ? items : applyPriceFilter(items, minPrice, maxPrice));
        }
        
        setDiscountCategories(finalCategories);

        // Default selection: all categories that have discount products
        setSelectedCategories(finalCategories);

        // Calculate absolute min/max price from all discounted products with rounding
        const prices: number[] = (finalCategories.length === 0 ? items : items).map((prod: any) => 
          searchController.getDetails(prod.id, "getPrice")
        ).filter((p): p is number => typeof p === "number" && !isNaN(p));
        
        if (prices.length > 0) {
          const min = Math.floor(Math.min(...prices));
          const max = Math.ceil(Math.max(...prices));
          setAbsoluteMinPrice(min);
          setAbsoluteMaxPrice(max);
          if (!isPriceFilterApplied) {
            setMinPrice(min);
            setMaxPrice(max);
            setTempMinPrice(min);
            setTempMaxPrice(max);
          }
        } else {
          setAbsoluteMinPrice(0);
          setAbsoluteMaxPrice(150);
          if (!isPriceFilterApplied) {
            setMinPrice(0);
            setMaxPrice(150);
            setTempMinPrice(0);
            setTempMaxPrice(150);
          }
        }
      } else {
        setDiscountCategories([]);
        setSelectedCategories([]);
        setAllDiscountProducts([]);
        setselectedCatgeoryProducts([]);
        setFilteredProducts([]);
      }
      currentCategoryId.current = categoryId;
    } else {

      // Get the latest categories from objCache
      const currentCategories = objCache.allCategories || [];

      const targetCategory = currentCategories.find(
        (cat) => cat.id === categoryId
      );

      if (targetCategory) {
        setSelectedCategories([targetCategory]);
        const products = targetCategory.category_products || [];

        setselectedCatgeoryProducts(products);
        
        // Apply price filter if it was previously applied
        if (isPriceFilterApplied) {
          const filtered = applyPriceFilter(products, minPrice, maxPrice);
          setFilteredProducts(filtered);
        } else {
          setFilteredProducts(products);
        }
        
        updatePriceRangeFromFilteredProducts(products);
        currentCategoryId.current = categoryId;
      } else {
        setSelectedCategories([]);
        setselectedCatgeoryProducts([]);
        setFilteredProducts([]);
        setMinPrice(0);
        setMaxPrice(150);
        setIsPriceFilterApplied(false);
        currentCategoryId.current = null;
      }
    }

    setIsLoading(false);
    isInitialLoadDone.current = true;
  }, [categoryId, categoryType, updatePriceRangeFromFilteredProducts, isPriceFilterApplied, minPrice, maxPrice, applyPriceFilter]);

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
      setIsPriceFilterApplied(false); // Reset price filter when category changes
      // Small delay to ensure any navigation state is settled
      const timer = setTimeout(() => {
        loadCategoryData();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [categoryId, categoryType, loadCategoryData]);

  // FIXED: Price filter submit handler
  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply price filter to the selected category products
    const filtered = applyPriceFilter(selectedCatgeoryProducts, tempMinPrice, tempMaxPrice);
    
    setFilteredProducts(filtered);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setIsPriceFilterApplied(true);
    
    // Close mobile filter if open
    if (isMobileFilterOpen) {
      setIsMobileFilterOpen(false);
    }
  };

  // FIXED: Reset price filter function
  const resetPriceFilter = () => {
    setFilteredProducts(selectedCatgeoryProducts);
    if (categoryType === "discount") {
      // Reset to absolute min/max derived from all discounted products
      setMinPrice(absoluteMinPrice);
      setMaxPrice(absoluteMaxPrice);
      setTempMinPrice(absoluteMinPrice);
      setTempMaxPrice(absoluteMaxPrice);
    } else {
      const prices: number[] = selectedCatgeoryProducts
        .map((prod: any) => {
          const id = prod.productId;
          return searchController.getDetails(id, "getPrice");
        })
        .filter((p): p is number => typeof p === "number" && !isNaN(p));

      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setMinPrice(min);
        setMaxPrice(max);
        setTempMinPrice(min);
        setTempMaxPrice(max);
      }
    }
    setIsPriceFilterApplied(false);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setTempMinPrice(val);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setTempMaxPrice(val);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setTempMaxPrice(val);
  };

  // FIXED: Use the simpler category handling logic from the second file
  const handleCategoryChange = (category: Category) => {
    const updatedCategories = selectedCategories.find(
      (cat) => cat.id === category.id
    )
      ? selectedCategories.filter((cat) => cat.id !== category.id)
      : [...selectedCategories, category];

    setSelectedCategories(updatedCategories);
    const updatedProducts = getFilteredByCategoryProducts(updatedCategories);
    
    // Ensure we always have products for discount mode
    if (categoryType === "discount" && updatedProducts.length === 0 && updatedCategories.length > 0) {
      // If no products found but categories are selected, fall back to all discount products
      setselectedCatgeoryProducts(allDiscountProducts);
      setFilteredProducts(isPriceFilterApplied ? applyPriceFilter(allDiscountProducts, minPrice, maxPrice) : allDiscountProducts);
    } else {
      setselectedCatgeoryProducts(updatedProducts);
      
      // Apply price filter if it was previously applied
      if (isPriceFilterApplied) {
        const filtered = applyPriceFilter(updatedProducts, minPrice, maxPrice);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(updatedProducts);
      }
    }
    
    if (categoryType !== "discount") {
      updatePriceRangeFromFilteredProducts(updatedProducts);
    }

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
    if (categoryType === "discount") {
      // Filter all discounted items by selected categories
      if (!catselected.length) return allDiscountProducts;
      
      // Build a map of category ID to products for efficient filtering
      const categoryToProducts = new Map<string, CategoryProducts[]>();
      allDiscountProducts.forEach((prod: any) => {
        const catId = prod.categoryId;
        if (catId) {
          if (!categoryToProducts.has(catId)) {
            categoryToProducts.set(catId, []);
          }
          categoryToProducts.get(catId)!.push(prod);
        }
      });
      
      // Get products from selected categories
      const selectedIds = new Set(catselected.map((c) => c.id));
      const filteredProducts: CategoryProducts[] = [];
      
      selectedIds.forEach((catId) => {
        const products = categoryToProducts.get(catId);
        if (products) {
          filteredProducts.push(...products);
        }
      });
      
      // Debug logging
      console.log('Discount filtering:', {
        selectedCategories: catselected.map(c => c.name),
        selectedIds: Array.from(selectedIds),
        categoryToProducts: Object.fromEntries(categoryToProducts),
        filteredProductsCount: filteredProducts.length,
        allDiscountProductsCount: allDiscountProducts.length
      });
      
      return filteredProducts;
    } else {
      const catProds: CategoryProducts[] = [];
      catselected.forEach((cat) => {
        catProds.push(...(cat.category_products || []));
      });
      return catProds;
    }
  };

  // FIXED: Group filtered products by category for display
  const getFilteredProductsByCategory = () => {
    if (!isPriceFilterApplied) {
      return selectedCategories.map(category => ({
        ...category,
        category_products: category.category_products || []
      }));
    }

    // When price filter is applied, we need to group the filtered products back by category
          return selectedCategories.map(category => {
        const categoryFilteredProducts = filteredProducts.filter(product => {
          // Check if this product belongs to this category
          return (category.category_products || []).some(catProduct => {
            const productId1 = categoryType === "discount" ? (product as any).id : product.productId;
            const productId2 = categoryType === "discount" ? (catProduct as any).id : catProduct.productId;
            return productId1 === productId2;
          });
        });

      return {
        ...category,
        category_products: categoryFilteredProducts
      };
    }).filter(category => category.category_products.length > 0); // Only show categories that have products after filtering
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Function to remove a specific category from selection
  const removeCategoryFromSelection = (categoryId: string) => {
    const updatedCategories = selectedCategories.filter(cat => cat.id !== categoryId);
    setSelectedCategories(updatedCategories);
    const updatedProducts = getFilteredByCategoryProducts(updatedCategories);
    
    // Ensure we always have products for discount mode
    if (categoryType === "discount" && updatedProducts.length === 0 && updatedCategories.length > 0) {
      // If no products found but categories are selected, fall back to all discount products
      setselectedCatgeoryProducts(allDiscountProducts);
      setFilteredProducts(isPriceFilterApplied ? applyPriceFilter(allDiscountProducts, minPrice, maxPrice) : allDiscountProducts);
    } else {
      setselectedCatgeoryProducts(updatedProducts);
      
      // Apply price filter if it was previously applied
      if (isPriceFilterApplied) {
        const filtered = applyPriceFilter(updatedProducts, minPrice, maxPrice);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(updatedProducts);
      }
    }
    
    if (categoryType !== "discount") {
      updatePriceRangeFromFilteredProducts(updatedProducts);
    }
    
    // Update current category tracking
    if (updatedCategories.length > 0) {
      currentCategoryId.current = updatedCategories[0].id;
    } else {
      currentCategoryId.current = null;
    }
  };

  // Function to render dynamic rating stars
  const renderRatingStars = (productId: string | number) => {
    const rating = searchController.getDetails(String(productId), "getRating") || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="rating-star">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <i key={i} className="fa fa-star text-warning"></i>;
          } else if (i === fullStars && hasHalfStar) {
            return <i key={i} className="fa fa-star-half-o text-warning"></i>;
          } else {
            return <i key={i} className="fa fa-star-o text-warning"></i>;
          }
        })}
        <span className="ms-2 text-muted">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const renderFilterSidebar = () => (
    <>
      {/* IMPROVED Price Filter */}
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
                  value={tempMinPrice}
                  min={absoluteMinPrice}
                  max={absoluteMaxPrice}
                  onChange={handleMinPriceChange}
                  className="price-input"
                />
              </div>
              <div className="single">
                <label htmlFor="max">Max price</label>
                <input
                  id="max"
                  type="number"
                  value={tempMaxPrice}
                  min={absoluteMinPrice}
                  max={absoluteMaxPrice}
                  onChange={handleMaxPriceChange}
                  className="price-input"
                />
              </div>
            </div>
            
            {/* FIXED: Dual Range Slider */}
            <div className="range-slider-container">
              <div className="range-slider-wrapper">
                <input
                  type="range"
                  className="range-slider range-min"
                  min={absoluteMinPrice}
                  max={absoluteMaxPrice}
                  value={tempMinPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val <= tempMaxPrice) {
                      setTempMinPrice(val);
                    }
                  }}
                />
                <input
                  type="range"
                  className="range-slider range-max"
                  min={absoluteMinPrice}
                  max={absoluteMaxPrice}
                  value={tempMaxPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val >= tempMinPrice) {
                      setTempMaxPrice(val);
                    }
                  }}
                />
                <div className="slider-track"></div>
                <div 
                  className="slider-range"
                  style={{
                    left: `${((tempMinPrice - absoluteMinPrice) / (absoluteMaxPrice - absoluteMinPrice)) * 100}%`,
                    width: `${((tempMaxPrice - tempMinPrice) / (absoluteMaxPrice - absoluteMinPrice)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div className="filter-value-min-max">
              <span>
                Price: ₹{tempMinPrice} — ₹{tempMaxPrice}
              </span>
              <div className="filter-buttons">
                <button type="submit" className="rts-btn btn-primary">
                  Filter
                </button>
                {isPriceFilterApplied && (
                  <button 
                    type="button" 
                    className="rts-btn btn-secondary ml-2"
                    onClick={resetPriceFilter}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Categories */}
      <div className="single-filter-box">
        <h5 className="title">Product Categories</h5>
        <div className="filterbox-body">
          <div className="category-wrapper">
            {(categoryType === "discount" ? discountCategories : allCategories).map((cat, i) => (
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

  // Get categories with filtered products for display
  const categoriesToDisplay = getFilteredProductsByCategory();

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
                  {categoryType === "discount" ? (
                    // For discount type, show filtered discount products
                    <section className="w-full rts-category-area section-pt-space">
                      <div className="custom-container title-area-between">
                        <h2 className="title-left">
                          {currentDiscount?.name || "Discount Products"}
                          <span className="category-count"> ({(isPriceFilterApplied ? filteredProducts.length : selectedCatgeoryProducts.length) || 0} products)</span>
                        </h2>
                      </div>
                      <div className="custom-container">
                        <Row>
                          <Collection
                            categoryProducts={isPriceFilterApplied ? filteredProducts : selectedCatgeoryProducts}
                            cols="col-xl-3 col-lg-3 col-sm-4 col-md-4 col-6 col-grid-box"
                            layoutList=""
                          />
                        </Row>
                      </div>
                    </section>
                  ) : categoriesToDisplay.length > 0 ? (
                    <>
                      {categoriesToDisplay.map((category, index) => (
                        <section key={category.id} className="w-full rts-category-area section-pt-space">
                          <div className="custom-container title-area-between">
                            <h2 className="title-left">
                              {category.name}
                              <span className="category-count"> ({category.category_products?.length || 0} products)</span>
                            </h2>
                          </div>
                          
                          {/* Products for this category */}
                          <div className="custom-container">
                            <Row>
                              <Collection
                                categoryProducts={category.category_products || []}
                                cols="col-xl-3 col-lg-3 col-sm-4 col-md-4 col-6 col-grid-box"
                                layoutList=""
                              />
                            </Row>
                          </div>
                        </section>
                      ))}
                    </>
                  ) : (
                    <div className="col-12 text-center py-5">
                      <h4>No products found</h4>
                      {isPriceFilterApplied ? (
                        <div>
                          <p>No products found in the price range ₹{minPrice} - ₹{maxPrice}</p>
                          <button 
                            className="btn btn-primary"
                            onClick={resetPriceFilter}
                          >
                            Reset Price Filter
                          </button>
                        </div>
                      ) : (
                        <p>Please select a category from the sidebar to view products.</p>
                      )}
                    </div>
                  )}
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