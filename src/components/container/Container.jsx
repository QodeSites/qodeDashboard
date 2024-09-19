import React from "react";

const Container = ({ children, className = "" }) => (
  <div className={`mx-auto  ${className}`}>{children}</div>
);

export default Container;
