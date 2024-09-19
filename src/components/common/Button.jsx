import React from "react";
import Link from "next/link";
import CustomLink from "./CustomLink";

const Button = ({
  children,
  onClick,
  to,
  href,
  className = "",
  disabled = false,
  type = "button",
  isLoading = false,
  target,
  rel,
}) => {
  const baseClassName = "dm-sans-font transition-colors";

  // Check for padding classes in className prop
  const hasPadding =
    /\bp-\d+|\bpy-\d+|\bpx-\d+|\bpt-\d+|\bpb-\d+|\bpl-\d+|\bpr-\d+/.test(
      className
    );

  // Default padding if no padding classes are explicitly provided
  const defaultPadding = hasPadding ? "" : "py-18 px-1";

  const defaultClassName = `${baseClassName} hover:bg-opacity-90 ${defaultPadding} text-body`;
  const fullClassName = `${defaultClassName} ${className}`;

  const content = isLoading ? (
    <>
      <svg
        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Loading...
    </>
  ) : (
    children
  );

  if (to) {
    return (
      <CustomLink to={to} className={fullClassName}>
        {content}
      </CustomLink>
    );
  }

  if (href) {
    return (
      <a href={href} className={fullClassName} target={target} rel={rel}>
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={fullClassName}
      disabled={disabled || isLoading}
      type={type}
    >
      {content}
    </button>
  );
};

export default Button;
