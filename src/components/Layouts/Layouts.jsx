// DefaultLayout.jsx
"use client";
import React from "react";
import Sidebar from "@/components/Sidebar";
import Section from "../container/Section";

export default function DefaultLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {" "}
      {/* Set the main layout background to black */}
      <Sidebar />
      <div className="flex-1 bg-black overflow-x-hidden overflow-y-auto text-white">
        {" "}
        {/* Ensure content area matches the theme */}
        <Section withBorder padding="normal" className="mt-9">
          {children}
        </Section>
      </div>
    </div>
  );
}
