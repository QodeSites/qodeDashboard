import React from "react";
import Link from "next/link";
import CustomLink from "./CustomLink";
import Text from "./Text";

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
  const baseClassName = "dm-sans-font transition-colors ";

  // Check for padding classes in className prop
  const hasPadding =
    /\bp-\d+|\bpy-\d+|\bpx-\d+|\bpt-\d+|\bpb-\d+|\bpl-\d+|\bpr-\d+/.test(
      className
    );

  // Default padding if no padding classes are explicitly provided
  const defaultPadding = hasPadding ? "" : "py-18 px-1";

  const defaultClassName = `${baseClassName} hover:bg-opacity-90 capitalize ${defaultPadding} text-body`;
  const fullClassName = `${defaultClassName} ${className}`;

  const content = isLoading ? (
    <>
      <Text>
        <span className="inline-flex items-center">Loading...</span>
      </Text>
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
