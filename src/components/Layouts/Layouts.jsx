

// DefaultLayout.jsx
"use client";
import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import SidebarNavigation from "../Sidebar";

export default function DefaultLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black transition-colors">
      <SidebarNavigation />
      
      {/* Main content area with proper mobile spacing */}
      <div className="w-full lg:ml-64 overflow-y-auto bg-gray-50 dark:bg-black">
        {/* Add top padding on mobile to account for header */}
        <div className="mt-16 md:pt-0">
          <main className="w-full p-4 mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}