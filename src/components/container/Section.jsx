import React from "react";
import Container from "./Container";
import GrayContainer from "./GrayContainer";

const Section = ({
  children,
  gray = false,
  className = "",
  containerClassName = "",
  withBorder = false,
  innerBorder = false,
  padding = "", // Prop for padding
  fullWidth = false, // New prop for width
}) => {
  const BaseComponent = gray ? GrayContainer : "div";
  const borderClass = withBorder ? "border border-brown" : "";
  const innerBorderClass = innerBorder ? "border border-brown" : "";

  // Define padding classes
  const paddingClasses = {
    none: "p-0",
    small: "p-2",
    normal: "sm:p-4 p-1",
    large: "p-5",
    extralarge: "sm:p-7 p-3 py-5 sm:py-7",
  };

  const paddingClass = paddingClasses[padding] || "";

  // Define width class
  const widthClass = fullWidth ? "w-full" : "max-w-[93%] sm:max-w-[1386px]";

  // Check if the className contains any explicit margin classes for top or bottom
  const hasMarginTop = /mt-\d+/.test(className);
  const hasMarginBottom = /mb-\d+/.test(className);

  // Default margin bottom class if not explicitly defined
  const defaultMarginBottom = hasMarginBottom ? "" : "sm:mb-8 mb-5 ";

  return (
    <BaseComponent className={`${className}`}>
      <Container
        className={`${widthClass} mx-auto ${defaultMarginBottom} ${paddingClass} ${borderClass} ${containerClassName}`}
      >
        <div className={`${innerBorderClass}`}>{children}</div>
      </Container>
    </BaseComponent>
  );
};

export default Section;
