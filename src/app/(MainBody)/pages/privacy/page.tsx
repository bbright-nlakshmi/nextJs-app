"use client"
import React from "react";
import { NextPage } from "next";
import Layout1 from "@/views/layouts/layout1";
import PrivacyPage from "@/views/pages/privacypolicy";

const Privacy: NextPage = () => {
  return (
    <Layout1>
      <PrivacyPage />
    </Layout1>
  );
};

export default Privacy;