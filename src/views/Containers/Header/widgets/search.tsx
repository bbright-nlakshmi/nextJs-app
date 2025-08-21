import React, { useEffect, useState, useCallback, useRef } from "react";
import { NextPage } from "next";
import {
  Input,
  DropdownToggle,
  DropdownMenu,
  InputGroupText,
  DropdownItem,
  InputGroup,
  ButtonDropdown,
} from "reactstrap";
import { useTranslation } from "react-i18next";
import {
  Category,
  Kit,
  objCache,
  Product,
  searchController,
} from "@/app/globalProvider";
import { SearchResults } from "./search_results";
import { useRouter } from "next/navigation";

function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => setTick((tick) => tick + 1), []);
  return update;
}

const Search: NextPage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const { t } = useTranslation("common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const forceUpdate = useForceUpdate();

  // Clear search results helper
  const clearResults = useCallback(() => {
    setShowResults(false);
    setKits([]);
    setProducts([]);
    setQuery("");
  }, []);

  useEffect(() => {
    const updateListener = () => {
      setKits([...searchController.kits]);
      setProducts([...searchController.products]);
      forceUpdate();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setKits([]);
        setProducts([]);
      }
    };

    // Setup event listeners
    searchController.on("update", updateListener);
    setAllCategories(objCache.allCategories);
    objCache.on("updateAllCategories", setAllCategories);
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      searchController.off("update", updateListener);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [forceUpdate]);

  const onHandleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      searchController.refreshGrid(value);
      setShowResults(true);
    } else {
      setShowResults(false);
      setKits([]);
      setProducts([]);
    }
  }, []);

  const blurEvent = useCallback(() => {
    setTimeout(() => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(document.activeElement)
      ) {
        setKits([]);
        setProducts([]);
        setShowResults(false);
      }
    }, 300);
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    try {
      sessionStorage.setItem("selectedProduct", JSON.stringify(product));
      clearResults();
      router.push(`/product/${product.id}`);
    } catch (error) {
      // Handle storage error silently or with user notification
      clearResults();
      router.push(`/product/${product.id}`);
    }
  }, [clearResults, router]);

  const handleKitClick = useCallback((kit: Kit) => {
    try {
      sessionStorage.setItem("selectedKit", JSON.stringify(kit));
      clearResults();
      router.push(`/kit/${kit.id}`);
    } catch (error) {
      // Handle storage error silently or with user notification
      clearResults();
      router.push(`/kit/${kit.id}`);
    }
  }, [clearResults, router]);

  const toggleDropDown = useCallback(() => setDropdownOpen((prev) => !prev), []);

  const closeMobileSearch = useCallback(() => {
    const searchInput = document.getElementById("searchbar-input");
    searchInput?.classList.remove("open");
    clearResults();
  }, [clearResults]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (products.length > 0) {
        handleProductClick(products[0]);
      } else if (kits.length > 0) {
        handleKitClick(kits[0]);
      }
    }
  }, [products, kits, handleProductClick, handleKitClick]);

  const handleFocus = useCallback(() => {
    if (query.trim()) {
      searchController.refreshGrid(query);
      setShowResults(true);
    }
  }, [query]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    router.push(`/collections/no-sidebar?id=${categoryId}&type=category`);
  }, [router]);

  return (
    <div ref={searchContainerRef} className="search-container" style={{ position: "relative" }}>
      <form className="big-deal-form search-widget-container">
        <InputGroup>
          <InputGroupText>
            <span className="search">
              <i className="fa fa-search" />
            </span>
          </InputGroupText>

          <Input
            ref={inputRef}
            name="query"
            value={query}
            placeholder="Search kits or products..."
            onChange={onHandleSearch}
            onBlur={blurEvent}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            autoComplete="off"
          />
          
          <span
            className="close-mobilesearch d-xl-none"
            onClick={closeMobileSearch}
          >
            <i className="fa fa-times" />
          </span>
          
          <InputGroupText>
            <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
              <DropdownToggle caret className="btn-light">
                <span className="category-label">{t("All Category")}</span>
              </DropdownToggle>
              <DropdownMenu>
                {allCategories.map((cat) => (
                  <DropdownItem
                    key={cat.id}
                    className="custom-dropdown-item cursor-pointer"
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    {cat.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </ButtonDropdown>
          </InputGroupText>
        </InputGroup>
        
        <SearchResults 
          show={showResults} 
          kits={kits} 
          products={products}
          onProductClick={handleProductClick}
          onKitClick={handleKitClick}
        />
      </form>
    </div>
  );
};

export default Search;