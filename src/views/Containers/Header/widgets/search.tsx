"use client";

import React, { useEffect, useState } from "react";
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
import { Category as ICategory } from "@/app/globalProvider";
import { centralDataCollector } from "@/app/services/central_data_control";

const Search: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const { t } = useTranslation("common");

  const toggleDropDown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const unsubscribe = centralDataCollector.categoryStream.subscribe(
      (data: ICategory[]) => {
        setCategories(data);
      }
    );

    // Trigger data fetch if not already triggered
    centralDataCollector.getData();
    centralDataCollector.scheduleGetData();

    return () => {
      unsubscribe(); // this is a function, not an object with .unsubscribe()
    };
  }, []);

  return (
    <div className="input-block">
      <div className="input-box">
        <form className="big-deal-form">
          <InputGroup>
            <InputGroupText>
              <span className="search">
                <i className="fa fa-search" />
              </span>
            </InputGroupText>
            <Input placeholder="Search products..." />
            <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropDown}>
              <DropdownToggle caret>
                {t("All Category")}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem key="all">{t("All Category")}</DropdownItem>
                {categories.map((cat) => (
                  <DropdownItem key={cat.id}>{cat.name}</DropdownItem>
                ))}
              </DropdownMenu>
            </ButtonDropdown>
          </InputGroup>
        </form>
      </div>
    </div>
  );
};

export default Search;
