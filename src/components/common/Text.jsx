import React from "react";

const Text = ({ children, className = "", ...props }) => (
  <p className={`font-body text-body dm-sans-font ${className}`} {...props}>
    {children}
  </p>
);

export default Text;
