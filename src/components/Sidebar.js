"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faChartPie, faUser, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

const SidebarNavigation = () => {
  const { data: session } = useSession();
  const router = useRouter();
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

  return (
    <>
      {/* Hamburger Button for mobile */}
      <div className="absolute top-4 left-4 md:hidden z-50">
        <button onClick={toggleSidebar} aria-label="Toggle menu">
          <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 z-50 flex flex-col min-h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold playfair-display-font">Qode</h1>
          <button onClick={toggleSidebar} aria-label="Close menu" className="md:hidden">
            <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-grow p-4">
          <ul className="space-y-4">
            <li>
              <Link
                href="/"
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                <FontAwesomeIcon icon={faHome} className="w-5 h-5" />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                <FontAwesomeIcon icon={faChartPie} className="w-5 h-5" />
                <span>Portfolio</span>
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
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
              <p className="text-gray-700 font-medium">{session?.user?.name || "User"}</p>
              <button onClick={handleLogout} className="text-sm text-blue-500 hover:underline">
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
