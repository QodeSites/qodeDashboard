"use client";
import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import SidebarNavigation from "../Sidebar";

export default function DefaultLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black transition-colors relative">
      {/* 
        Remove "hidden lg:block" so SidebarNavigation is always in the DOM. 
        Let SidebarNavigation itself decide how to show/hide on mobile.
      */}
      <aside className="lg:fixed lg:inset-y-0 lg:w-64 lg:bg-white lg:dark:bg-black">
        <SidebarNavigation />
      </aside>

      {/* MAIN CONTENT */}
      {/* We still push content right on large screens with lg:ml-64 */}
      <div className="w-full lg:ml-64 overflow-y-auto p-1 text-gray-900 dark:text-white bg-white dark:bg-black">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <main className="w-full max-w-screen-2xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
