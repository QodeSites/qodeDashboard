"use client";
import React from "react";
import Sidebar from "@/components/Sidebar";

export default function DefaultLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-[#fafafa] overflow-x-hidden overflow-y-auto">
        <main className="ml-64 p-4 md:p-6 2xl:p-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
