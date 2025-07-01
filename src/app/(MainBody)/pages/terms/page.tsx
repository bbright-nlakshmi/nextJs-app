"use client"
import React from "react";
import { NextPage } from "next";
import Layout1 from "@/views/layouts/layout1";
import TermsPage from "@/views/pages/terms&conditions";

const Terms: NextPage = () => {
  return (
    <Layout1>
      <TermsPage />
    </Layout1>
  );
};

export default Terms;