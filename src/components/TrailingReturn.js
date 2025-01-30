import React from "react";
import { Spinner } from "@material-tailwind/react";
import Text from "./common/Text";
import Heading from "./common/Heading";

const TrailingReturns = ({ data, isLoading, error, benchmarkData }) => {
  if (isLoading)
    return (
      <div className="text-start flex justify-center items-center">
        <Spinner className="text-gray-700 dark:text-gray-300" />
      </div>
    );
  if (error) return <div>Error: {error}</div>;
  if (!data || !data.dailyNAV || !benchmarkData ) return null;

  // Extract NAV values
  const navValues = data.dailyNAV.map((entry) => parseFloat(entry.nav));
  const benchmarkValues = Array.isArray(benchmarkData)
  ? benchmarkData.map((entry) => parseFloat(entry.nav))
  : benchmarkData && typeof benchmarkData.nav !== 'undefined'
  ? [parseFloat(benchmarkData.nav)]
  : [];


  // Helper function to calculate trailing returns
  const calculateTrailingReturn = (values, periodInDays) => {
    if (values.length < periodInDays) return null;

    const recentNav = values[values.length - 1];
    const pastNav = values[values.length - 1 - periodInDays];

    if (!recentNav || !pastNav) return null;

    return ((recentNav - pastNav) / pastNav) * 100;
  };

  // Calculate Maximum Drawdown and Current Drawdown
  const calculateDrawdowns = (values) => {
    let maxDrawdown = 0;
    let peak = values[0];
    let currentPeak = values[0];
    
    // Find the highest peak up to current point and calculate MDD
    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((peak - value) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Calculate current drawdown from the most recent peak
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] > currentPeak) {
        currentPeak = values[i];
      }
    }
    const currentValue = values[values.length - 1];
    const currentDrawdown = ((currentPeak - currentValue) / currentPeak) * 100;

    return {
      maxDrawdown,
      currentDrawdown
    };
  };

  // Calculate drawdowns for both portfolio and benchmark
  const portfolioDrawdowns = calculateDrawdowns(navValues);
  const benchmarkDrawdowns = calculateDrawdowns(benchmarkValues);

  // Define base periods in days
  const basePeriods = [
    { key: "d10", label: "10D", days: 10 },
    { key: "m1", label: "1M", days: 30 },
    // { key: "m3", label: "3M", days: 90 },
    // { key: "m6", label: "6M", days: 180 },
    // { key: "y1", label: "1Y", days: 365 },
    // { key: "y2", label: "2Y", days: 730 },
    // { key: "y5", label: "5Y", days: 1825 },
  ];

  // Add since inception period for portfolio and benchmark separately
  const portfolioPeriods = [
    ...basePeriods,
    { key: "since_inception", label: "Inception", days: navValues.length - 1 },
  ];

  const benchmarkPeriods = benchmarkValues.length ? [
    ...basePeriods,
    { key: "since_inception", label: "Inception", days: benchmarkValues.length - 1 },
  ] : basePeriods;

  // Format value for display
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return `${value.toFixed(1)}%`;
  };

  // Calculate trailing returns for portfolio and benchmark
  const portfolioReturns = portfolioPeriods.map((period) => ({
    ...period,
    value: calculateTrailingReturn(navValues, period.days),
  }));

  const benchmarkReturns = benchmarkPeriods.map((period) => ({
    ...period,
    value: calculateTrailingReturn(benchmarkValues, period.days),
  }));

  // Use portfolioPeriods for display since it will always have all periods
  const displayPeriods = portfolioPeriods;

  // Horizontal Table (Desktop/Tablet)
  const HorizontalTable = () => (
    <div className="overflow-x-auto">
      <div className="relative rounded-lg border border-brown overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
        <table className="w-full text-center min-w-[640px] border-collapse">
          <thead>
            <tr className="border border-brown dark:border-gray-700 bg-lightBeige dark:bg-gray-900">
              <th className="sticky -left-18 p-1 font-body text-sm text-gray-900 dark:text-gray-100 bg-lightBeige dark:bg-black">
                <div className="absolute inset-y-0 right-0 w-[1px] bg-lightBeige " />
                Strategy
              </th>
              {displayPeriods.map(({ label }) => (
                <th
                  key={label}
                  className="p-1 font-body text-sm text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700"
                >
                  {label}
                </th>
              ))}
              <th className="p-1 text-center font-body text-sm text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700">
                MDD
              </th>
              <th className="p-1 text-center font-body text-sm text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700">
                Current Drawdown
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border border-brown dark:border-gray-700 text-xs text-center">
              <td className="sticky -left-18 p-1 bg-white dark:bg-black">
                <div className="absolute inset-y-0 right-0 w-[1px] bg-gray-200 dark:bg-gray-700" />
                Portfolio
              </td>
              {portfolioReturns.map(({ key, value }) => (
                <td
                  key={key}
                  className="p-1 text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700"
                >
                  {formatValue(value)}
                </td>
              ))}
              <td className="p-1 text-center text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700">
                {formatValue(portfolioDrawdowns.maxDrawdown)}
              </td>
              <td className="p-1 text-center text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700">
                {formatValue(portfolioDrawdowns.currentDrawdown)}
              </td>
            </tr>
            {benchmarkData && (
              <tr className="border border-brown dark:border-gray-700 text-xs text-center">
                <td className="sticky -left-18 p-1 bg-white dark:bg-black">
                  <div className="absolute inset-y-0 right-0 w-[1px] bg-gray-200 dark:bg-gray-700" />
                  {benchmarkData[0]?.indices || 'Benchmark'}
                </td>
                {displayPeriods.map((period) => {
                  const benchmarkReturn = benchmarkReturns.find(r => r.key === period.key);
                  return (
                    <td
                      key={period.key}
                      className="p-1 text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700"
                    >
                      {formatValue(benchmarkReturn?.value)}
                    </td>
                  );
                })}
                <td className="p-1 text-center text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700">
                  {formatValue(benchmarkDrawdowns.maxDrawdown)}
                </td>
                <td className="p-1 text-center text-gray-900 dark:text-gray-100 border-l border-brown dark:border-gray-700">
                  {formatValue(benchmarkDrawdowns.currentDrawdown)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  

  // Mobile Table (Vertical)
  const MobileTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-brown dark:border-gray-700 bg-beige dark:bg-gray-900">
        <tbody className="bg-white dark:bg-black">
          {/* Portfolio section */}
          <tr className="border-b border-brown dark:border-brown bg-lightBeige">
            <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
              Strategy
            </td>
            <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
              Portfolio
            </td>
          </tr>
          {portfolioReturns.map(({ key, label, value }) => (
            <tr key={key} className="border-b border-brown dark:border-gray-700">
              <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
                {label}
              </td>
              <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
                {formatValue(value)}
              </td>
            </tr>
          ))}
          <tr className="border-b border-brown dark:border-gray-700">
            <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
              MDD
            </td>
            <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
              {formatValue(portfolioDrawdowns.maxDrawdown)}
            </td>
          </tr>
          <tr className="border-b border-brown dark:border-gray-700">
            <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
              Current Drawdown
            </td>
            <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
              {formatValue(portfolioDrawdowns.currentDrawdown)}
            </td>
          </tr>

          {/* Benchmark section */}
          {benchmarkData && (
            <>
              <tr className="border-b border-brown dark:border-brown bg-lightBeige">
                <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
                  Strategy
                </td>
                <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
                  {benchmarkData[0]?.indices || 'Benchmark'}
                </td>
              </tr>
              {displayPeriods.map((period) => {
                const benchmarkReturn = benchmarkReturns.find(r => r.key === period.key);
                return (
                  <tr key={period.key} className="border-b border-brown dark:border-gray-700">
                    <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
                      {period.label}
                    </td>
                    <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
                      {formatValue(benchmarkReturn?.value)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-b border-brown dark:border-gray-700">
                <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
                  MDD
                </td>
                <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
                  {formatValue(benchmarkDrawdowns.maxDrawdown)}
                </td>
              </tr>
              <tr className="border-b border-brown dark:border-gray-700">
                <td className="p-1 text-xs border-r border-brown text-black dark:text-gray-400 w-1/2">
                  Current Drawdown
                </td>
                <td className="p-1 text-sm font-medium text-gray-900 dark:text-gray-100 w-1/2">
                  {formatValue(benchmarkDrawdowns.currentDrawdown)}
                </td>
              </tr>
            </>
          )}
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
        Current Drawdown: {formatValue(portfolioDrawdowns.currentDrawdown)}
      </Text>
    </div>
  );
};

export default TrailingReturns;