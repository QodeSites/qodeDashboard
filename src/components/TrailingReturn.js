import React from "react";
import { Spinner } from "@material-tailwind/react";
import Text from "./common/Text";
import Heading from "./common/Heading";

const TrailingReturns = ({ data, isLoading, error }) => {
  if (isLoading)
    return (
      <div className="text-start flex justify-center items-center">
        <Spinner className="text-gray-700 dark:text-gray-300" />
      </div>
    );
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  const periods = [
    { key: "d10", label: "10D" },
    { key: "m1", label: "1M" },
    { key: "m3", label: "3M" },
    { key: "m6", label: "6M" },
    { key: "y1", label: "1Y" },
    { key: "y2", label: "2Y" },
    { key: "y5", label: "5Y" },
    { key: "since_inception", label: "Inception" },
  ];

  const formatValue = (value) => {
    if (!value || value === "nan") return "-";
    return `${parseFloat(value).toFixed(1)}%`;
  };

  // -------------------------
  // 1) Horizontal Table (Desktop/Tablet)
  // -------------------------
  const HorizontalTable = () => (
    <div className="overflow-x-auto">
      <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 rounded-lg dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
        <table className="w-full text-center min-w-[640px] border-collapse">
          <thead>
            <tr className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <th
                className="
                  sticky -left-18 p-1 font-body text-sm
                  text-gray-900 dark:text-gray-100
                  bg-white dark:bg-black
                "
              >
                <div className="absolute inset-y-0 right-0 w-[1px] bg-gray-200 dark:bg-gray-700" />
                Strategy
              </th>
              {periods.map(({ label }) => (
                <th
                  key={label}
                  className="p-1 font-body text-sm text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700"
                >
                  {label}
                </th>
              ))}
              <th className="p-1 text-center font-body text-sm text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700">
                MDD
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border border-gray-200 dark:border-gray-700 text-xs text-center">
              <td className="sticky -left-18 p-1 bg-white dark:bg-black">
                <div className="absolute inset-y-0 right-0 w-[1px] bg-gray-200 dark:bg-gray-700" />
                {data.name}
              </td>
              {periods.map(({ key }) => (
                <td
                  key={key}
                  className="p-1 text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700"
                >
                  {formatValue(data[key])}
                </td>
              ))}
              <td className="p-1 text-center text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700">
                {formatValue(data.mdd)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // -------------------------
  // 2) Mobile Table (Vertical but in a proper <table>)
  // -------------------------
  const MobileTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-brown dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* <thead> */}
          {/* <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="p-1 text-sm text-left text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
              Field
            </th>
            <th className="p-1 text-sm text-left text-gray-900 dark:text-gray-100">
              Value
            </th>
          </tr> */}
        {/* </thead> */}
        <tbody className="bg-white dark:bg-black">
          {/* Strategy row */}
          <tr className="border-b border-brown dark:border-brown bg-lightBeige">
            <td className="p-1 text-xs border-r border-brown text-gray-500 dark:text-gray-400 w-1/2">
              Strategy
            </td>
            <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
              {data.name}
            </td>
          </tr>

          {/* Periods (10D,1M,3M,6M,1Y,2Y,5Y,Inception) */}
          {periods.map(({ key, label }) => (
            <tr
              key={key}
              className="border-b  border-brown dark:border-gray-700"
            >
              <td className="p-1 text-xs border-r border-brown text-gray-500 dark:text-gray-400 w-1/2">
                {label}
              </td>
              <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
                {formatValue(data[key])}
              </td>
            </tr>
          ))}

          {/* MDD row */}
          <tr className="border-b border-brown dark:border-gray-700">
            <td className="p-1 text-xs border-r border-brown text-gray-500 dark:text-gray-400 w-1/2">
              MDD
            </td>
            <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
              {formatValue(data.mdd)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-brown mb-4">
        Returns
      </Heading>

      {/* Desktop/Tablet: Horizontal table */}
      <div className="hidden sm:block">
        <HorizontalTable />
      </div>

      {/* Mobile: "proper" table layout */}
      <div className="block sm:hidden">
        <MobileTable />
      </div>

      <Text className="text-gray-700 dark:text-gray-300 text-sm font-body mt-2">
        MDD (Maximum Drawdown) refers to the maximum loss an investment can incur from its highest point.
        Current Drawdown: {formatValue(data.current_drawdown)}
      </Text>
    </div>
  );
};

export default TrailingReturns;
