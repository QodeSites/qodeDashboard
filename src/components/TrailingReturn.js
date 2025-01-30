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
  if (!data || !data.dailyNAV) return null;

  // Extract NAV values
  const navValues = data.dailyNAV.map((entry) => parseFloat(entry.nav));

  // Helper function to calculate trailing returns
  const calculateTrailingReturn = (periodInDays) => {
    if (navValues.length < periodInDays) return null; // Not enough data

    const recentNav = navValues[navValues.length - 1];
    const pastNav = navValues[navValues.length - 1 - periodInDays];

    if (!recentNav || !pastNav) return null;

    return ((recentNav - pastNav) / pastNav) * 100;
  };

  // Define periods in days
  const periods = [
    { key: "d10", label: "10D", days: 10 },
    { key: "m1", label: "1M", days: 30 },
    { key: "m3", label: "3M", days: 90 },
    { key: "m6", label: "6M", days: 180 },
    { key: "y1", label: "1Y", days: 365 },
    { key: "y2", label: "2Y", days: 730 },
    { key: "y5", label: "5Y", days: 1825 },
    { key: "since_inception", label: "Inception", days: navValues.length - 1 },
  ];

  // Format value for display
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return `${value.toFixed(1)}%`;
  };

  // Calculate trailing returns for each period
  const trailingReturns = periods.map((period) => ({
    ...period,
    value: calculateTrailingReturn(period.days),
  }));

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
                {data?.portfolioDetails?.name}
              </td>
              {trailingReturns.map(({ key, value }) => (
                <td
                  key={key}
                  className="p-1 text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700"
                >
                  {formatValue(value)}
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
        <tbody className="bg-white dark:bg-black">
          {/* Strategy row */}
          <tr className="border-b border-brown dark:border-brown bg-lightBeige">
            <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
              Strategy
            </td>
            <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
              {data?.portfolioDetails?.name}
            </td>
          </tr>

          {/* Periods (10D,1M,3M,6M,1Y,2Y,5Y,Inception) */}
          {trailingReturns.map(({ key, label, value }) => (
            <tr
              key={key}
              className="border-b border-brown dark:border-gray-700"
            >
              <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
                {label}
              </td>
              <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
                {formatValue(value)}
              </td>
            </tr>
          ))}

          {/* MDD row */}
          <tr className="border-b border-brown dark:border-gray-700">
            <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
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