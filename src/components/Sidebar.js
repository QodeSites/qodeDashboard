import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const Sidebar = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const navItems = [
    { name: "My Dashboard", href: "/" },
    // { name: "Customer Support", href: "/customer-support" },
    // { name: "Strategies", href: "/strategies" },
  ];

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 z-20 fixed left-0 top-0 sophia-pro-font">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <p className="text-red-600 text-2xl font-bold playfair-disply-font">
              Qode
            </p>
          </Link>
        </div>

        <nav className="flex-grow py-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-red-600 transition duration-300"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <Link href={'/user-details'}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center w-full text-left px-2 py-2 text-gray-600 hover:bg-gray-100 rounded transition duration-300"
              >
                <svg
                  className="h-6 w-6 mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                User Menu
              </button>
            </Link>

          </div>
        </div>

        {/* Separate Logout button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;