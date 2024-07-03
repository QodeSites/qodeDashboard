"use client";
import React from "react";
import Sidebar from "@/components/Sidebar";

export default function DefaultLayout({ children }) {
  return (
    <>
      <div className="flex bg-gray-100 h-screen overflow-hidden">
        <Sidebar />
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main>
            <div className="mx-auto p-4 md:p-6 2xl:p-10">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
