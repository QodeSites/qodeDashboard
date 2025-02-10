import React from "react";
import { Spinner } from "@material-tailwind/react";
import Text from "./common/Text";
import Heading from "./common/Heading";

const TrailingReturns = ({ data, isLoading, error, benchmarkData }) => {
  if (isLoading)
    return (
      <div className="flex justify-center items-center p-4">
        <Spinner className="text-gray-700 " />
      </div>
    );
  if (error)
    return <div className="text-red-500 text-xs p-2">Error: {error}</div>;
  if (!data || !data.dailyNAV || !benchmarkData) return null;

  // Parse NAV values
  const navValues = data.dailyNAV.map((entry) => parseFloat(entry.nav));
  const benchmarkValues = Array.isArray(benchmarkData)
    ? benchmarkData.map((entry) => parseFloat(entry.nav))
    : benchmarkData && typeof benchmarkData.nav !== "undefined"
    ? [parseFloat(benchmarkData.nav)]
    : [];

  // Calculate trailing return given a period (in days)
  const calculateTrailingReturn = (values, periodInDays) => {
    if (values.length < periodInDays + 1) return null;
    const recentNav = values[values.length - 1];
    const pastNav = values[values.length - 1 - periodInDays];
    if (!recentNav || !pastNav) return null;
    return ((recentNav - pastNav) / pastNav) * 100;
  };

  // Calculate maximum and current drawdown
  const calculateDrawdowns = (values) => {
    let maxDrawdown = 0;
    let peak = values[0];
    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((peak - value) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    let currentPeak = values[0];
    for (let i = 0; i < values.length; i++) {
      if (values[i] > currentPeak) {
        currentPeak = values[i];
      }
    }
    const currentValue = values[values.length - 1];
    const currentDrawdown = ((currentPeak - currentValue) / currentPeak) * 100;
    return { maxDrawdown, currentDrawdown };
  };

  const portfolioDrawdowns = calculateDrawdowns(navValues);
  const benchmarkDrawdowns = calculateDrawdowns(benchmarkValues);

  // Define the periods for which we calculate trailing returns.
  const basePeriods = [
    { key: "5d", label: "5D", days: 5 },
    { key: "10d", label: "10D", days: 10 },
    { key: "15d", label: "15D", days: 15 },
    { key: "1m", label: "1M", days: 30 },
    { key: "1y", label: "1Y", days: 365 },
    { key: "2y", label: "2Y", days: 730 },
    { key: "3y", label: "3Y", days: 1095 }
  ];

  const portfolioPeriods = [
    ...basePeriods,
    { key: "since_inception", label: "Inception", days: navValues.length - 1 }
  ];

  const benchmarkPeriods = benchmarkValues.length
    ? [
        ...basePeriods,
        { key: "since_inception", label: "Inception", days: benchmarkValues.length - 1 }
      ]
    : basePeriods;

  // Compute trailing returns for portfolio and benchmark
  const portfolioReturns = portfolioPeriods.map((period) => ({
    key: period.key,
    label: period.label,
    value: calculateTrailingReturn(navValues, period.days)
  }));

  const benchmarkReturns = benchmarkPeriods.map((period) => ({
    key: period.key,
    label: period.label,
    value: calculateTrailingReturn(benchmarkValues, period.days)
  }));

  return (
    <div className="p-4 bg-white mb-6 rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Trailing Returns
          </h3>
        </div>
        <div
          data-cmid="portfolios:button|download_trailing_return"
          data-reach-tooltip-trigger=""
        >
          {/* Download button placeholder */}
        </div>
      </div>

      {/* Table container */}
      <div className="flex flex-col mt-4">
        <div className="overflow-x-auto">
          <div className="align-middle inline-block min-w-full">
            <div className="overflow-hidden rounded-lg">
              <table
                role="table"
                className="min-w-full divide-y divide-gray-200 table-fixed"
              >
                <thead>
                  <tr role="row">
                    {/* Fixed width for Name column */}
                    <th className="w-32 text-left px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                      Name
                    </th>
                    {/* Each trailing return column gets a fixed width */}
                    {portfolioPeriods.map((period) => (
                      <th
                        key={period.key}
                        className="w-24 text-center px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      >
                        {period.label}
                      </th>
                    ))}
                    {/* Fixed width for drawdown columns */}
                    <th className="w-20 text-center px-2 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-l-2 border-gray-300 cursor-pointer">
                      Current DD
                    </th>
                    <th className="w-20 text-center px-2 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                      Max DD
                    </th>
                  </tr>
                </thead>
                <tbody
                  role="rowgroup"
                  className="bg-white divide-y divide-gray-200"
                >
                  {/* Portfolio Row */}
                  <tr role="row">
                    <td className="w-32 text-left px-4 py-2 whitespace-nowrap text-sm text-gray-900 capitalize">
                      Scheme (%)
                    </td>
                    {portfolioReturns.map((period) => (
                      <td
                        key={period.key}
                        className="w-24 text-center px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                      >
                        {period.value !== null ? period.value.toFixed(2) : "-"}
                      </td>
                    ))}
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm border-l-2 border-gray-300 text-gray-900">
                      {portfolioDrawdowns.currentDrawdown !== null
                        ? portfolioDrawdowns.currentDrawdown.toFixed(2)
                        : "-"}
                    </td>
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {portfolioDrawdowns.maxDrawdown !== null
                        ? portfolioDrawdowns.maxDrawdown.toFixed(2)
                        : "-"}
                    </td>
                  </tr>
                  {/* Benchmark Row */}
                  <tr role="row">
                    <td className="w-32 text-left px-4 py-2 whitespace-nowrap text-sm text-gray-900 capitalize">
                      Benchmark (%)
                    </td>
                    {benchmarkReturns.map((period) => (
                      <td
                        key={period.key}
                        className="w-24 text-center px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                      >
                        {benchmarkData && period.value !== null
                          ? period.value.toFixed(2)
                          : "-"}
                      </td>
                    ))}
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm border-l-2 border-gray-300 text-gray-900">
                      {benchmarkData && benchmarkDrawdowns.currentDrawdown !== null
                        ? benchmarkDrawdowns.currentDrawdown.toFixed(2)
                        : "-"}
                    </td>
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {benchmarkData && benchmarkDrawdowns.maxDrawdown !== null
                        ? benchmarkDrawdowns.maxDrawdown.toFixed(2)
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs my-1 font-light text-gray-500">
        Note: Returns above 1 year are annualised.
      </p>
    </div>
  );
};

export default TrailingReturns;
