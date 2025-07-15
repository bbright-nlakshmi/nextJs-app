"use client"
import React from "react";
import { NextPage } from "next";
import Layout1 from "@/views/layouts/layout1";
import ContactUsPage from "@/views/pages/contactus";

const ContactUs: NextPage = () => {
  return (
    <Layout1>
      <ContactUsPage />
    </Layout1>
  );
};

export default ContactUs;