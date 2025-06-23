import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Input, DropdownToggle, DropdownMenu, InputGroupText, DropdownItem, InputGroup, ButtonDropdown, Form, Col, FormGroup, Media } from "reactstrap";
import { useTranslation } from "react-i18next";
import { Category, objCache, searchController } from "@/app/globalProvider";
import ProductBox from "@/views/layouts/widgets/Product-Box/productbox";
import Link from "next/link";
import { SearchResults } from './search_results';
const Search: NextPage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropDown = () => setDropdownOpen(!dropdownOpen);
  const { t } = useTranslation("common");
  const [showResults, setShowResults] = useState(false);


  const [query, setQuery] = useState<string>('')
  const onHandleSearch = (e) => {
    setQuery(e.target.value)

    searchController.refreshGrid(e.target.value);
    if (query && searchController.products.length) {
      setShowResults(true);
    } else
      setShowResults(false);

  }
  const blurEvent = () => { setShowResults(false) }
  const [allCategories, setAllCategories] = useState<Category[]>();
  useEffect(() => {
    objCache.on('updateAllCategories', (data: Category[]) => {
      console.log(data);
      setAllCategories(data);


    });
  }, []);

  return (

    <>
      <form className=" big-deal-form">
        <InputGroup>
          <InputGroupText>
            <span className="search">
              <i
                className="fa 
                       fa-search"></i>
            </span>
          </InputGroupText>
          <Input name="query" value={query} onChange={(event) => onHandleSearch(event)} onBlur={blurEvent} onFocus={(event) => onHandleSearch(event)} />
          <SearchResults show={showResults} />
          <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
            <DropdownToggle key={"search-menu-toggle"} caret>
              {t("All Category")}
            </DropdownToggle>
            <DropdownMenu key={"search-menu"}>
              <DropdownItem>All Category</DropdownItem>
              {allCategories && allCategories.map((item: Category) => <DropdownItem>{item.name}</DropdownItem>)}


            </DropdownMenu>
          </ButtonDropdown>
        </InputGroup>
      </form>
    </>

  );
};

export default Search;
