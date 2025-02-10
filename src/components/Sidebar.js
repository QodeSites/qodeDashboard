// SidebarNavigation.jsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faChartPie, faUser, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

const SidebarNavigation = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

  const isLinkActive = (href) => pathname === href;

  return (
    <>
      {/* Mobile header with hamburger */}
      <div className="h-16 flex items-center md:hidden px-4 fixed top-0 left-0 right-0 bg-white dark:bg-black z-40 border-b border-gray-200">
        <button onClick={toggleSidebar} aria-label="Toggle menu">
          <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 bg-white dark:bg-black border-r border-gray-200 transform transition-transform duration-300 z-50 flex flex-col h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-4xl font-bold playfair-display-font">Qode</h1>
          <button onClick={toggleSidebar} aria-label="Close menu" className="md:hidden">
            <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto p-4">
          <ul className="space-y-4">
            <li>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 ${
                  isLinkActive("/") ? "text-green-500 font-bold" : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                <FontAwesomeIcon icon={faHome} className="w-5 h-5" />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link
                href="/portfolio"
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 ${
                  isLinkActive("/portfolio") ? "text-green-500 font-bold" : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                <FontAwesomeIcon icon={faChartPie} className="w-5 h-5" />
                <span>Portfolio</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 ${
                  isLinkActive("/account") ? "text-green-500 font-bold" : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                <span>Account</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="User avatar"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{session?.user?.name || "User"}</p>
              <button onClick={handleLogout} className="text-sm text-green-500 hover:underline">
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default SidebarNavigation;