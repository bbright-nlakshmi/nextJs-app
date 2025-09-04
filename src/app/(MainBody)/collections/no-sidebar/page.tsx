"use client";
import { NextPage } from "next";
import { Row } from "reactstrap";
import Layout1 from "@/views/layouts/layout1";
import Collection from "@/views/Collections/Collection";
import { useEffect, useState, useCallback, useRef, useContext } from "react";
import {
  Category,
  CategoryProducts,
  objCache,
  Product,
  searchController,
  Kit
} from "@/app/globalProvider";
import { useSearchParams } from "next/navigation";
import { FaSlidersH } from "react-icons/fa";
import NewProduct from "@/views/Collections/NewProduct";
import { WishlistContext } from "@/helpers/wishlist/wish.context";
import { toast } from "react-toastify";

type ProductItem = Product | Kit;

const NoSidebar: NextPage = () => {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id");
  const categoryType = searchParams.get("type");
  
  const { wishlistItems, addToWish, removeFromWish } = useContext(WishlistContext);
 
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(150);
  const [tempMinPrice, setTempMinPrice] = useState<number>(0);
  const [tempMaxPrice, setTempMaxPrice] = useState<number>(150);
  const [absoluteMinPrice, setAbsoluteMinPrice] = useState<number>(0);
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState<number>(150);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [discountCategories, setDiscountCategories] = useState<Category[]>([]);
  const [selectedCatgeoryProducts, setselectedCatgeoryProducts] = useState<CategoryProducts[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<CategoryProducts[]>([]);
  const [allDiscountProducts, setAllDiscountProducts] = useState<CategoryProducts[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [currentDiscount, setCurrentDiscount] = useState<any>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceFilterApplied, setIsPriceFilterApplied] = useState(false);
 
  const isInitialLoadDone = useRef(false);
  const currentCategoryId = useRef<string | null>(null);
 
  const toggleMobileFilter = () => setIsMobileFilterOpen((prev) => !prev);

  const getPrice = useCallback((item: ProductItem | any): number => {
    if (!item) return 0;
    
    if (item.originalItem) {
      const originalPrice = getPrice(item.originalItem);
      if (originalPrice > 0) return originalPrice;
    }
    
    const priceFields = ['sellingPrice', 'price', 'kitPrice', 'discountPrice', 'salePrice', 'finalPrice', 'currentPrice', 'amount', 'cost', 'value'];
    for (const field of priceFields) {
      if (typeof item[field] === 'number' && item[field] > 0) return item[field];
    }

    const productId = item.productId || item.id;
    if (productId && searchController) {
      try {
        const controllerPrice = searchController.getDetails(productId, "getPrice");
        if (typeof controllerPrice === 'number' && controllerPrice > 0) return controllerPrice;
      } catch (error) {}
    }

    if (typeof item.getProductPrice === 'function') {
      try {
        const price = item.getProductPrice();
        if (typeof price === 'number' && price > 0) return price;
      } catch (error) {}
    }
    
    if (typeof item.getPrice === 'function') {
      try {
        const price = item.getPrice();
        if (typeof price === 'number' && price > 0) return price;
      } catch (error) {}
    }

    const nestedObjects = [item.pricing, item.priceInfo, item.cost, item.priceData];
    for (const nested of nestedObjects) {
      if (typeof nested === 'number' && nested > 0) return nested;
      if (typeof nested === 'object' && nested !== null) {
        const nestedPrice = nested.amount || nested.value || nested.price || nested.final || nested.current;
        if (typeof nestedPrice === 'number' && nestedPrice > 0) return nestedPrice;
      }
    }
    
    return 0;
  }, []);

  const getName = useCallback((item: ProductItem | any): string => {
    if (item.originalItem) {
      const originalName = getName(item.originalItem);
      if (originalName && originalName !== `Product Unknown`) return originalName;
    }
    
    return item?.name || item?.title || `Product ${item?.productId || item?.id || "Unknown"}`;
  }, []);

  const getStock = useCallback((obj: any): number => {
    if (obj?.originalItem) {
      const originalStock = getStock(obj.originalItem);
      if (originalStock > 0) return originalStock;
    }
    
    if (!obj || typeof obj !== "object") return 0;
    
    const stockFields = ['stock', 'quantity', 'inventory', 'stockQuantity', 'availableStock'];
    for (const field of stockFields) {
      if (typeof obj[field] === "number" && obj[field] >= 0) return obj[field];
    }
    return 0;
  }, []);

  const getProductImages = useCallback((obj: any): string[] => {
    if (obj?.originalItem) {
      const originalImages = getProductImages(obj.originalItem);
      if (originalImages[0] !== "/images/placeholder.png") return originalImages;
    }
    
    if (!obj) return ["/images/placeholder.png"];
    
    if (obj?.img && Array.isArray(obj.img) && obj.img.length > 0) return obj.img;
    if (obj?.images && Array.isArray(obj.images) && obj.images.length > 0) return obj.images;
    if (obj?.img && typeof obj.img === "string") return [obj.img];
    if (obj?.image && typeof obj.image === "string") return [obj.image];
    if (obj?.picture && typeof obj.picture === "string") return [obj.picture];
    
    return ["/images/placeholder.png"];
  }, []);

  const isProductInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems?.some(item => 
      item.productId === productId || 
      item.uuid === productId ||
      item.id === productId
    ) || false;
  }, [wishlistItems]);

  const handleWishlistToggle = useCallback((product: any, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const productId = product.productId || product.id;
    if (!productId) {
      toast.error("Invalid product data");
      return;
    }

    const finalPrice = getPrice(product);
    const wishlistProduct = {
      ...product,
      productId: productId,
      title: getName(product),
      img: getProductImages(product),
      price: finalPrice,
      stock: getStock(product),
      id: productId,
      uuid: product.uuid || productId,
    };

    if (isProductInWishlist(productId)) {
      const wishlistItem = wishlistItems.find(item => 
        item.productId === productId || 
        item.uuid === productId ||
        item.id === productId
      );
      if (wishlistItem && removeFromWish) {
        removeFromWish(wishlistItem);
        toast.success(`${getName(product)} removed from wishlist`);
      }
    } else {
      if (addToWish) {
        addToWish(wishlistProduct);
        const message = finalPrice > 0 
          ? `${getName(product)} added to wishlist (₹${finalPrice})`
          : `${getName(product)} added to wishlist`;
        toast.success(message);
      }
    }
  }, [getPrice, getName, getProductImages, getStock, wishlistItems, addToWish, removeFromWish, isProductInWishlist]);

  const EnhancedCollection = ({ categoryProducts, cols, layoutList }: any) => (
    <Collection
      categoryProducts={categoryProducts}
      cols={cols}
      layoutList={layoutList}
      onWishlistToggle={handleWishlistToggle}
      isProductInWishlist={isProductInWishlist}
      wishlistItems={wishlistItems}
      getProductPrice={getPrice}
    />
  );
 
  const updatePriceRangeFromFilteredProducts = useCallback((products: CategoryProducts[]) => {
    if (categoryType === "discount") return;
    
    const prices = products
      .map((prod: any) => getPrice(prod))
      .filter((p): p is number => typeof p === "number" && !isNaN(p) && p > 0);
 
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setAbsoluteMinPrice(min);
      setAbsoluteMaxPrice(max);
     
      if (!isPriceFilterApplied) {
        setMinPrice(min);
        setMaxPrice(max);
        setTempMinPrice(min);
        setTempMaxPrice(max);
      }
    } else {
      const defaults = [0, 150];
      setAbsoluteMinPrice(defaults[0]);
      setAbsoluteMaxPrice(defaults[1]);
      if (!isPriceFilterApplied) {
        setMinPrice(defaults[0]);
        setMaxPrice(defaults[1]);
        setTempMinPrice(defaults[0]);
        setTempMaxPrice(defaults[1]);
      }
    }
  }, [categoryType, isPriceFilterApplied, getPrice]);
 
  const applyPriceFilter = useCallback((products: CategoryProducts[], minPrice: number, maxPrice: number) => {
    return products.filter((prod: any) => {
      const price = getPrice(prod);
      return price >= minPrice && price <= maxPrice;
    });
  }, [getPrice]);
 
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
      const found = objCache.discountList.find((item: any) => item.id === categoryId);
      if (!found) return;
      
      setCurrentDiscount(found);
     
      const allProducts = objCache.allProducstsList || [];
      const productToCategory = new Map<string, string>();
     
      (objCache.allCategories || []).forEach((cat: Category) => {
        (cat.category_products || []).forEach((prod: any) => {
          const pid = String(prod.productId ?? prod.id ?? "");
          if (pid) productToCategory.set(pid, cat.id);
        });
      });

      const items: CategoryProducts[] = (found.discountItems || []).map((item: any) => {
        const pid = String(item.productId ?? item.id ?? "");
        const derivedCatId = item.categoryId || productToCategory.get(pid) || "";
       
        return {
          ...item,
          active: item.active ?? false,
          productId: item.productId ?? item.id,
          categoryId: derivedCatId,
        };
      });

      setAllDiscountProducts(items);

      const categoryIds = new Set<string>(items.map((it: any) => it.categoryId).filter(id => !!id));
      const availableCategories: Category[] = (objCache.allCategories || []).filter(
        (cat: Category) => categoryIds.has(cat.id)
      );
     
      let finalCategories = availableCategories;
      if (availableCategories.length === 0 && items.length > 0) {
        const fallbackCategory: Category = {
          id: 'uncategorized-discount',
          name: 'Discount Products',
          img: [],
          category_products: items,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        finalCategories = [fallbackCategory];
       
        const updatedItems = items.map(item => ({
          ...item,
          categoryId: 'uncategorized-discount'
        }));
        setAllDiscountProducts(updatedItems);
        setselectedCatgeoryProducts(updatedItems);
        setFilteredProducts(updatedItems);
      } else {
        setselectedCatgeoryProducts(items);
        setFilteredProducts(!isPriceFilterApplied ? items : applyPriceFilter(items, minPrice, maxPrice));
      }
     
      setDiscountCategories(finalCategories);
      setSelectedCategories(finalCategories);

      const prices = items.map((prod: any) => getPrice(prod))
        .filter((p): p is number => typeof p === "number" && !isNaN(p) && p > 0);
     
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
      }
      
      currentCategoryId.current = categoryId;
    } else {
      const currentCategories = objCache.allCategories || [];
      const targetCategory = currentCategories.find((cat) => cat.id === categoryId);

      if (targetCategory) {
        setSelectedCategories([targetCategory]);
        const products = targetCategory.category_products || [];

        setselectedCatgeoryProducts(products);
        setFilteredProducts(isPriceFilterApplied ? applyPriceFilter(products, minPrice, maxPrice) : products);
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
  }, [categoryId, categoryType, updatePriceRangeFromFilteredProducts, isPriceFilterApplied, minPrice, maxPrice, applyPriceFilter, getPrice]);
 
  useEffect(() => {
    setAllCategories(objCache.allCategories || []);
 
    if (!isInitialLoadDone.current) {
      loadCategoryData();
    }
 
    const handleCategoriesUpdate = (data: Category[]) => {
      setAllCategories(data);
      if (!currentCategoryId.current || allCategories.length === 0) {
        setTimeout(() => loadCategoryData(), 100);
      }
    };
 
    objCache.on("updateAllCategories", handleCategoriesUpdate);
 
    return () => {
      if (objCache.off) {
        objCache.off("updateAllCategories", handleCategoriesUpdate);
      }
    };
  }, []);
 
  useEffect(() => {
    if (currentCategoryId.current !== categoryId) {
      setIsLoading(true);
      setIsPriceFilterApplied(false);
      const timer = setTimeout(() => loadCategoryData(), 50);
      return () => clearTimeout(timer);
    }
  }, [categoryId, categoryType, loadCategoryData]);
 
  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = applyPriceFilter(selectedCatgeoryProducts, tempMinPrice, tempMaxPrice);
    setFilteredProducts(filtered);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setIsPriceFilterApplied(true);
    if (isMobileFilterOpen) setIsMobileFilterOpen(false);
  };
 
  const resetPriceFilter = () => {
    setFilteredProducts(selectedCatgeoryProducts);
    if (categoryType === "discount") {
      setMinPrice(absoluteMinPrice);
      setMaxPrice(absoluteMaxPrice);
      setTempMinPrice(absoluteMinPrice);
      setTempMaxPrice(absoluteMaxPrice);
    } else {
      const prices = selectedCatgeoryProducts
        .map((prod: any) => getPrice(prod))
        .filter((p): p is number => typeof p === "number" && !isNaN(p) && p > 0);
 
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
 
  const handleCategoryChange = (category: Category) => {
    const isSelected = selectedCategories.some(cat => cat.id === category.id);
    const updatedCategories = isSelected
      ? selectedCategories.filter((cat) => cat.id !== category.id)
      : [...selectedCategories, category];
 
    setSelectedCategories(updatedCategories);
    const updatedProducts = getFilteredByCategoryProducts(updatedCategories);
   
    if (categoryType === "discount" && updatedProducts.length === 0 && updatedCategories.length > 0) {
      setselectedCatgeoryProducts(allDiscountProducts);
      setFilteredProducts(isPriceFilterApplied ? applyPriceFilter(allDiscountProducts, minPrice, maxPrice) : allDiscountProducts);
    } else {
      setselectedCatgeoryProducts(updatedProducts);
      setFilteredProducts(isPriceFilterApplied ? applyPriceFilter(updatedProducts, minPrice, maxPrice) : updatedProducts);
    }
   
    if (categoryType !== "discount") {
      updatePriceRangeFromFilteredProducts(updatedProducts);
    }
 
    currentCategoryId.current = updatedCategories.length > 0 ? updatedCategories[0].id : null;
  };
 
  const getFilteredByCategoryProducts = (catselected: Category[]): CategoryProducts[] => {
    if (categoryType === "discount") {
      if (!catselected.length) return allDiscountProducts;
     
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
     
      const selectedIds = new Set(catselected.map((c) => c.id));
      const filteredProducts: CategoryProducts[] = [];
     
      selectedIds.forEach((catId) => {
        const products = categoryToProducts.get(catId);
        if (products) {
          filteredProducts.push(...products);
        }
      });
     
      return filteredProducts;
    } else {
      return catselected.flatMap(cat => cat.category_products || []);
    }
  };
 
  const getFilteredProductsByCategory = () => {
    if (!isPriceFilterApplied) {
      return selectedCategories.map(category => ({
        ...category,
        category_products: category.category_products || []
      }));
    }
 
    return selectedCategories.map(category => {
      const categoryFilteredProducts = filteredProducts.filter(product => {
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
    }).filter(category => category.category_products.length > 0);
  };
 
  const removeCategoryFromSelection = (categoryId: string) => {
    const updatedCategories = selectedCategories.filter(cat => cat.id !== categoryId);
    setSelectedCategories(updatedCategories);
    const updatedProducts = getFilteredByCategoryProducts(updatedCategories);
   
    if (categoryType === "discount" && updatedProducts.length === 0 && updatedCategories.length > 0) {
      setselectedCatgeoryProducts(allDiscountProducts);
      setFilteredProducts(isPriceFilterApplied ? applyPriceFilter(allDiscountProducts, minPrice, maxPrice) : allDiscountProducts);
    } else {
      setselectedCatgeoryProducts(updatedProducts);
      setFilteredProducts(isPriceFilterApplied ? applyPriceFilter(updatedProducts, minPrice, maxPrice) : updatedProducts);
    }
   
    if (categoryType !== "discount") {
      updatePriceRangeFromFilteredProducts(updatedProducts);
    }
   
    currentCategoryId.current = updatedCategories.length > 0 ? updatedCategories[0].id : null;
  };
 
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
              <span>Price: ₹{tempMinPrice} — ₹{tempMaxPrice}</span>
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
 
      <div className="single-filter-box">
        <h5 className="title">Product Categories</h5>
        <div className="filterbox-body">
          <div className="category-wrapper">
            {(categoryType === "discount" ? discountCategories : allCategories).map((cat, i) => (
              <div className="single-category" key={i}>
                <input
                  id={`cat${i + 1}`}
                  type="checkbox"
                  checked={selectedCategories.some((item) => cat.id === item.id)}
                  onChange={() => handleCategoryChange(cat)}
                />
                <label htmlFor={`cat${i + 1}`}>{cat.name}</label>
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
 
  const categoriesToDisplay = getFilteredProductsByCategory();
  const productsToShow = isPriceFilterApplied ? filteredProducts : selectedCatgeoryProducts;
 
  return (
    <Layout1>
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
              <div className="collection-wrapper1">
                <div className="custom-container section-big-pb-space">
                  {categoryType === "discount" ? (
                    <section className="w-full rts-category-area section-pt-space">
                      <div className="custom-container title-area-between">
                        <h2 className="title-left">
                          {currentDiscount?.name || "Discount Products"}
                          <span className="category-count"> ({productsToShow.length || 0} products)</span>
                        </h2>
                      </div>
                      <div className="custom-container">
                        <Row>
                          <EnhancedCollection
                            categoryProducts={productsToShow}
                            cols="col-xl-3 col-lg-3 col-sm-4 col-md-4 col-6 col-grid-box"
                            layoutList=""
                          />
                        </Row>
                      </div>
                    </section>
                  ) : categoriesToDisplay.length > 0 ? (
                    <>
                      {categoriesToDisplay.map((category) => (
                        <section key={category.id} className="w-full rts-category-area section-pt-space">
                          <div className="custom-container title-area-between">
                            <h2 className="title-left">
                              {category.name}
                              <span className="category-count"> ({category.category_products?.length || 0} products)</span>
                            </h2>
                          </div>
                         
                          <div className="custom-container">
                            <Row>
                              <EnhancedCollection
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
                          <button className="btn btn-primary" onClick={resetPriceFilter}>
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