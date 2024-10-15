import React from "react";
import Container from "./Container";
import GrayContainer from "./GrayContainer";

const Section = ({
  children,
  gray = false,
  className = "",
  containerClassName = "",
  innerBorder = false,
  padding = "",
  fullWidth = false,
}) => {
  const BaseComponent = gray ? GrayContainer : "div";
  const innerBorderClass = innerBorder ? "border border-brown" : "";

  const paddingClasses = {
    none: "p-0",
    small: "p-2",
    normal: "p-2 sm:p-4",
    large: "p-2 sm:p-5",
    extralarge: "md:p-7 p-2 py-5 sm:py-4",
  };

  const paddingClass = paddingClasses[padding] || "";

  // Adjust width classes based on gray and fullWidth props
  const widthClass = fullWidth
    ? "w-full"
    : "max-w-[93%] md:max-w-[1066px] xl:max-w-[1386px]";

  // Ensure margin is conditionally applied
  const hasMarginTop = /mt-\d+/.test(className);
  const hasMarginBottom = /mb-\d+/.test(className);
  const defaultMargin = `${hasMarginTop ? "" : "mt-5 "} ${
    hasMarginBottom ? "" : "sm:mb-5 mb-2 "
  }`;

  return (
    <BaseComponent
      className={`${className} ${widthClass} mx-auto ${defaultMargin}`}
    >
      <div
        className={`${paddingClass} ${containerClassName} ${innerBorderClass}`}
      >
        {children}
      </div>
    </BaseComponent>
  );
};

export default Section;
