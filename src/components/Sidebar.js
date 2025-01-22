"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "./common/Button";
import Heading from "./common/Heading";
import { useTheme } from "@/components/ThemeContext";
import { Menu, X } from "lucide-react";

const SidebarNavigation = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Button: Position it top-left, above the content */}
      <div className="absolute top-1 left-1 md:hidden z-50">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="w-1 h-1" />
        </button>
      </div>

      {/* Sidebar itself: fixed, so it overlays the content */}
      <aside
        className={`
          fixed top-0 left-0 w-64
          bg-white dark:bg-black
          border-r border-gray-200 dark:border-brown
          transform transition-transform duration-300
          z-50 p-1
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          flex flex-col min-h-screen
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-2 py-2">
            <Heading href="/" className="text-brown dark:text-beige">
              Qode
            </Heading>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Close menu"
            >
              <X className="w-1 h-1" />
            </button>
          </div>

          <nav className="flex-grow mt-2 overflow-y-auto px-2">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  className="block p-2 text-gray-700 dark:text-beige 
                             hover:bg-gray-100 dark:hover:bg-gray-800 
                             hover:text-gray-900 dark:hover:text-white rounded-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="block p-2 text-gray-700 dark:text-beige 
                             hover:bg-gray-100 dark:hover:bg-gray-800 
                             hover:text-gray-900 dark:hover:text-white rounded-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-2">
            <Button
              onClick={handleLogout}
              className="w-full text-gray-900 dark:text-beige 
                         border border-brown dark:border-brown
                         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Dark overlay when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 
                     md:hidden z-40 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default SidebarNavigation;
