// pages/index.jsx
"use client";
import React, { useEffect, useState } from "react";
import Portfolio from "./portfolio/page";
import HomePage from "@/components/Home";
import DefaultLayout from "@/components/Layouts/Layouts";

export default function Home() {


  return (
    <DefaultLayout>
      <HomePage />
    </DefaultLayout>

  );
}
