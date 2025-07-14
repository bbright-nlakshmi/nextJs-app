import React, { useEffect, useState, useCallback } from "react";
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
import { Category, Kit, objCache, Product, searchController } from "@/app/globalProvider";
import { SearchResults } from "./search_results";

// ✅ Hook to force a re-render
function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => setTick((tick) => tick + 1), []);
  return update;
  
}

const Search: NextPage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const { t } = useTranslation("common");

  const [query, setQuery] = useState("");
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);

  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const updateListener = () => {
      

      // Force React state update
      setKits([...searchController.kits]);
      
      setProducts([...searchController.products]);

      const hasResults = searchController.kits.length > 0 || searchController.products.length > 0;
      setShowResults(hasResults);
   console.log("🔁 UI re-rendering from controller");
      forceUpdate(); // 💡 Ensure UI reflects changes
    };

    searchController.on("update", updateListener);
    setAllCategories(objCache.allCategories);
    objCache.on("updateAllCategories", (data: Category[]) => setAllCategories(data));

    return () => {
      searchController.off("update", updateListener);
    };
  }, [forceUpdate]);

  const onHandleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchController.refreshGrid(value);
    setShowResults(true); // Immediately show results while typing
  };

  const blurEvent = () => {
    setTimeout(() => {
      setKits([]);
      setProducts([]);
      setShowResults(false);
    }, 150);
  };

  const toggleDropDown = () => setDropdownOpen((prev) => !prev);

  return (
    <form className="big-deal-form" style={{ position: "relative", zIndex: 100 }}>
      <InputGroup>
        <InputGroupText>
          <span className="search">
            <i className="fa fa-search" />
          </span>
        </InputGroupText>

        <Input
          name="query"
          value={query}
          placeholder="Search kits or products..."
          onChange={onHandleSearch}
          onBlur={blurEvent}
          onFocus={() => {
            if (query.trim()) {
              searchController.refreshGrid(query);
              setShowResults(true);
            }
          }}
        />

        <SearchResults show={showResults} kits={kits} products={products} />

        <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
          <DropdownToggle caret>
            <span className="category-label">{t("All Category")}</span>
          </DropdownToggle>
          <DropdownMenu>
            {/* <DropdownItem key="all">{t("All Category")}</DropdownItem> */}
            {allCategories.map((cat) => (
              <DropdownItem key={cat.id}  className="custom-dropdown-item">
                <a href={`/collections/no-sidebar?category=${encodeURIComponent(cat.name)}`}>
                {cat.name}
                </a>
              </DropdownItem>
            ))}
          </DropdownMenu>
        </ButtonDropdown>
      </InputGroup>
    </form>
  );
};

export default Search;

