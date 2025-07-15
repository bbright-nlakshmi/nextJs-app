"use client"
import React from "react";
import { NextPage } from "next";
import Layout1 from "@/views/layouts/layout1";
import StorePage from "../../../../views/pages/store"; // Adjust the import path as necessary

const Store: NextPage = () => {
  return (
    <Layout1>
      <StorePage />
    </Layout1>
  );
};

export default Store;