import React from "react";

const Heading = ({ level = 1, children, className = "", ...props }) => {
  const Tag = `h${level}`;
  return (
    <Tag
      className={`font-heading playfair-font-display sm:text-heading text-mobileHeading font-semibold  ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Heading;
