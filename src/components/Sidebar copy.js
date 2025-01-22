'use client'
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Heading from "./common/Heading";
import Button from "./common/Button";
import { useRouter } from "next/navigation";
const HeaderNavigation = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const navItems = [
    // { name: "Blogs", href: "/blogs" },
  ];

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="w-full bg-black border-b border-brown fixed top-0 left-0 z-40  font-body">
        <div className="flex justify-between items-center sm:px-1 px-1 md:max-w-[1066px] xl:max-w-[1386px] mx-auto">
          <Heading href="/" className="flex items-center">
            <p className="text-beige sm:text-3xl text-2xl font-heading">
              Qode
            </p>
          </Heading>

          <nav className="flex justify-center items-center space-x-5">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-beige text-body transition duration-300 hover:text-beige"
              >
                {item.name}
              </Link>
            ))}

            <div className="relative flex justify-between items-center">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center text-white transition duration-300 hover:text-beige"
              >
                <svg
                  version="1.1"
                  x="0px"
                  y="0px"
                  viewBox="0 0 100 100"
                  className="h-3 w-3 sm:mr-1 "
                  fill="#d1a47b"
                  stroke="#d1a47b"
                  strokeWidth="3"
                >
                  <g>
                    <path d="M50,50.5c10.6,0,19.2-8.6,19.2-19.2S60.6,12.2,50,12.2s-19.2,8.6-19.2,19.2S39.4,50.5,50,50.5z M50,15.9   c8.5,0,15.4,6.9,15.4,15.4S58.5,46.7,50,46.7s-15.4-6.9-15.4-15.4S41.5,15.9,50,15.9z" />
                    <path d="M50,55.1c-2.1,0-4.2,0.2-6.2,0.6c-7.3,1.4-13.9,5.3-18.7,10.9c-5,5.9-7.8,13.4-7.8,21.2H21c0-6.9,2.5-13.5,6.9-18.8   c4.3-5,10.1-8.4,16.6-9.7c1.8-0.3,3.7-0.5,5.5-0.5c16,0,29,13,29,29h3.8C82.8,69.8,68.1,55.1,50,55.1z" />
                  </g>
                </svg>
              </button>

              {isUserDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-2 mt-9 w-44 bg-black border-beige border z-50  "
                >
                  {/* <Link
                    href="/user-details"
                    className="block px-3 py-1 text-beige hover:bg-lightGrey transition duration-300"
                  >
                    User Menu
                  </Link> */}
                  <hr className="border-beige" />
                  <Button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1 text-beige hover:bg-lightGrey transition duration-300"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </nav>

        </div>
      </header>

      {/* Full-screen backdrop */}
      {isUserDropdownOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-30"
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}
    </>
  );
};

export default HeaderNavigation;