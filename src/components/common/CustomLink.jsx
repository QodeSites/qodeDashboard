import React from "react";
import Link from "next/link";
const CustomLink = ({ to, children, className = "", ...props }) => {
  return (
    <Link
      to={to}
      className={`dm-sans-font text-body hover:text-primary transition-colors ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
};

export default CustomLink;
