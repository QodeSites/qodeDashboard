import React, { useState } from "react";
import Link from "next/link";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const navItems = [
    { name: "My Dashboard", href: "/" },
    { name: "Customer Support", href: "/customer-support" },
    { name: "Strategies", href: "/strategies" },
  ];

  const handleNavClick = () => {
    setIsNavOpen(false);
  };

  return (
    <header className="shadow-lg helvetica-font fixed w-full bg-white z-20 top-0">
      <div className="mx-auto">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="w-1/4">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-black hover:bg-white/10 transition duration-300"
              onClick={() => setIsNavOpen(!isNavOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isNavOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>

          <div className="w-1/2 flex justify-center">
            <Link
              href="/"
              className="text-black text-4xl py-5 helvetica-font font-semibold "
            >
              Qode
            </Link>
          </div>

          <div className="w-1/4"></div>
        </div>
      </div>

      {/* Navigation menu with slide-in animation */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 ${
          isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-gray-900 bg-opacity-50"
          onClick={() => setIsNavOpen(false)}
        ></div>
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white text-black transform transition-transform duration-300 ease-in-out ${
            isNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto">
            <div className="pt-6 pb-4">
              <button
                className="absolute top-4 right-4 text-black"
                onClick={() => setIsNavOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Navigation items */}
              {navItems.map((item) => (
                <div key={item.name} className="pt-10">
                  <Link
                    href={item.href}
                    className="flex justify-between items-center w-full text-left  text-lg font-medium hover:bg-white/10 transition duration-300 text-black hover:before:bg-black relative h-[50px] overflow-hidden bg-white px-3 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-black before:transition-all before:duration-500 hover:text-white hover:before:left-0 hover:before:w-full"
                    onClick={handleNavClick}
                  >
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
