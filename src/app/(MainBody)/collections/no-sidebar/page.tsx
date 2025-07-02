"use client"
import { NextPage } from "next";
import { Row } from "reactstrap";
import Layout1 from "@/views/layouts/layout1";
import Collection from "@/views/Collections/Collection";
import Breadcrumb from "@/views/Containers/Breadcrumb";
import { useEffect, useState } from "react";
import { Category, CategoryProducts, objCache, Product } from "@/app/globalProvider";
import { useSearchParams } from "next/navigation";

const NoSidebar: NextPage = () => {

  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id");
  const categoryType = searchParams.get("type");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(selectedCategory?[selectedCategory]:[]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);  // <-- new state for brands
  // New state for price filter
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(150);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const [selectedCatgeoryProducts, setselectedCatgeoryProducts] = useState<CategoryProducts[]>([]);

  var selectedCategory = objCache.allCategories.find(cat => cat.id === categoryId);

  useEffect(() => {
    setAllCategories(objCache.allCategories);
    objCache.on('updateAllCategories', (data: Category[]) => {
        setAllCategories(data);
        selectedCategory = data.find(cat => cat.id === categoryId);;
    })
    }, []);
  


  const handlePriceFilterSubmit = () => { }
  const allBrands = ["Frito Lay", "Nespresso", "Oreo", "Quaker", "Welch's"];

  // Price inputs handlers
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setMinPrice(val);
  };
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setMaxPrice(val);
  };


  const handleCategoryChange = (category: Category) => {
    
    setSelectedCategories(getSelectedCategories(category));
    
    setselectedCatgeoryProducts(getFilteredByCategoryProducts())
 
  };

  const getSelectedCategories = (category:Category) => {
    
    return [...selectedCategories,category];
  }

  // Filter products by selected categories
  const getFilteredByCategoryProducts = (): CategoryProducts[] => {
    var catProds:CategoryProducts[] = [];
    if (selectedCategories.length) {
      
      selectedCategories.map(cat => {
        if(cat.category_products.length)
        catProds.push(...cat.category_products);
    });
    
      return catProds;
    }
    else return [];

  };


  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  return (
    <Layout1>
      {/* <Breadcrumb parent="Category" title="No Sidebar" /> */}

      <div className="shop-grid-sidebar-area rts-section-gap">
        <div className="container">
          <div className="row g-0">
            {/* Sidebar */}
            <div className="col-xl-3 col-lg-12 pr--70 pr_lg--10 pr_sm--10 pr_md--5 rts-sticky-column-item">
              <div className="sidebar-filter-main theiaStickySidebar">

                {/* Price Filter */}
                <div className="single-filter-box">
                  <h5 className="title">Widget Price Filter</h5>
                  <div className="filterbox-body">
                    <form
                      action="#"
                      className="price-input-area"
                      onSubmit={handlePriceFilterSubmit}
                    >
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
                        min={0}
                        max={150}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                      />
                      <div className="filter-value-min-max">
                        <span>
                          Price: ${minPrice} — ${maxPrice}
                        </span>
                        <button type="submit" className="rts-btn btn-primary">
                          Filter
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Categories (Interactive) */}
                <div className="single-filter-box">
                  <h5 className="title">Product Categories</h5>
                  <div className="filterbox-body">
                    <div className="category-wrapper ">
                      {allCategories.map((cat, i) => (
                        <div className="single-category" key={i}>
                          <input
                            id={`cat${i + 1}`}
                            type="checkbox"
                            checked={selectedCategories.findIndex(item =>  cat.id === item.id ) != -1}
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
              </div>
            </div>
            <div className="col-xl-9 col-lg-12">
              <div className="collection-wrapper">
                <div className="custom-container section-big-pb-space">
                  <Row>
                    {/* Collection */}
                    <Collection categoryProducts={selectedCatgeoryProducts} cols="col-xl-2 col-lg-3 col-md-4 col-4 col-grid-box" layoutList="" />
                  </Row>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout1>
  );
}

export default NoSidebar;
