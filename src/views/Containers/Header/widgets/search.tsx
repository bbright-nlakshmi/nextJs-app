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
  const [categories, setCategories] = useState<Category[]>([]);
  const { t } = useTranslation("common");
  const [showResults, setShowResults] = useState(false);


  const [query, setQuery] = useState<string>('')
  const onHandleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)

    searchController.refreshGrid(e.target.value);
    if (query && searchController.products.length) {
      setShowResults(true);
    } else
      setShowResults(false);

  }
  const blurEvent = () => { setShowResults(false) }
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  useEffect(() => {
    objCache.on('updateAllCategories', (data: Category[]) => {
      
      setAllCategories(data);
    });
  }, []);

  const toggleDropDown = () => setDropdownOpen(!dropdownOpen);


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
              <DropdownToggle caret>
                {t("All Category")}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem key="all">{t("All Category")}</DropdownItem>
                {allCategories.map((cat) => (
                  <DropdownItem key={cat.id}>{cat.name}</DropdownItem>
                ))}
              </DropdownMenu>
            </ButtonDropdown>
        </InputGroup>
      </form>
    </>

  );
};

export default Search;
