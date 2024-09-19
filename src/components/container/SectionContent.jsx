import React from "react";

const SectionContent = ({ children, className = "", withBorder = false }) => {
  const borderClass = withBorder ? "border border-brown" : "";

  return <div className={`${borderClass} ${className}`}>{children}</div>;
};

export default SectionContent;
