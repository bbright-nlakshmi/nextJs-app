"use client";
import React from "react";
import { NextPage } from "next";
import Layout1 from "@/views/layouts/layout1";
import CategoryPage from "@/views/pages/categories";

const Search: NextPage = () => {
  return (
    <Layout1>
      <CategoryPage />
    </Layout1>
  );
};

export default Search;
