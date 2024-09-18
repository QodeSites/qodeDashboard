import React from "react";

const Heading = ({ level = 1, children, className = "", ...props }) => {
  const Tag = `h${level}`;
  return (
    <Tag
      className={`font-heading playfair-font-display text-heading font-semibold  ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Heading;
