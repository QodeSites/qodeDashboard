import React from "react";
import { Spinner } from "@material-tailwind/react";

const TrailingReturns = ({ data, isLoading, error, benchmarkData }) => {



  if (error) {
    return <div className="text-red-500 text-xs p-2">Error: {error}</div>;
  }

  // Determine the nav data.
  const navData = Array.isArray(data) ? data : data?.dailyNAV;
  if (!navData || !benchmarkData) {
    return null;
  }

  // Create a Set of valid trading days from benchmark data
  const benchmarkArray = Array.isArray(benchmarkData)
    ? benchmarkData
    : benchmarkData.dailyNAV; // <-- fallback if benchmarkData is an object

  const validTradingDays = new Set(
    Array.isArray(benchmarkArray)
      ? benchmarkArray.map(entry =>
          new Date(entry.date).toISOString().split("T")[0]
        )
      : []
  );

  // Filter scheme data to only include valid trading days
  const filteredSchemeData = navData.filter(entry =>
    validTradingDays.has(new Date(entry.date).toISOString().split("T")[0])
  );

  // Helper functions (addDays, subtractMonths, findClosestData) remain unchanged...
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function findClosestData(sortedData, targetDate) {
    let closest = null;
    let minDiff = Infinity;

    // First try to find exact match or closest previous date
    for (let i = sortedData.length - 1; i >= 0; i--) {
      const currentDate = new Date(sortedData[i].date);
      const diff = targetDate - currentDate;

      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        closest = sortedData[i];
      }
    }

    // If no previous date found, take the earliest available date
    if (!closest && sortedData.length > 0) {
      closest = sortedData[0];
    }

    return closest ? { ...closest, date: new Date(closest.date) } : null;
  }

  function subtractMonths(date, months) {
    const result = new Date(date);
    const targetMonth = result.getMonth() - months;
    const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);

    // Calculate the target month properly, handling negative months
    const normalizedTargetMonth = ((targetMonth % 12) + 12) % 12;

    result.setFullYear(targetYear);
    result.setMonth(normalizedTargetMonth);

    // Handle end-of-month cases
    const originalDate = date.getDate();
    const newLastDay = new Date(targetYear, normalizedTargetMonth + 1, 0).getDate();

    // Set to the last day of month if original date is greater than last day of target month
    result.setDate(Math.min(originalDate, newLastDay));

    return result;
  }

  const calculateReturns = (navData, period) => {
    if (!navData || navData.length === 0) return "-";
    const sortedData = navData.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentEntry = sortedData[sortedData.length - 1];
    const currentValue = parseFloat(currentEntry.nav);
    const currentDate = new Date(currentEntry.date);

    if (period === "Since Inception") {
      const inceptionData = sortedData[0];
      if (!inceptionData?.nav) return "-";

      const yearDiff = (currentDate - new Date(inceptionData.date)) / (1000 * 60 * 60 * 24 * 365.25);
      const result =
        yearDiff <= 1
          ? (((currentValue - parseFloat(inceptionData.nav)) / parseFloat(inceptionData.nav)) * 100).toFixed(2)
          : ((Math.pow(currentValue / parseFloat(inceptionData.nav), 1 / yearDiff) - 1) * 100).toFixed(2);
      return result;
    }

    const periodConfig = {
      "1D": { days: 1, minPoints: 1 },
      "5D": { days: 5, minPoints: 3 },
      "10D": { days: 10, minPoints: 7 },
      "15D": { days: 15, minPoints: 10 },
      "1M": { months: 1, minPoints: 15 },
      "1Y": { months: 12, minPoints: 180 },
      "2Y": { months: 24, minPoints: 360 },
      "3Y": { months: 36, minPoints: 540 }
    };

    const config = periodConfig[period];
    if (!config) return "-";

    let comparisonDate;
    if (config.days) {
      comparisonDate = addDays(currentDate, -config.days);
    } else {
      comparisonDate = subtractMonths(currentDate, config.months);
    }


    const dataPointsInPeriod = sortedData.filter(d => {
      const date = new Date(d.date);
      return date >= comparisonDate && date <= currentDate;
    }).length;


    if (dataPointsInPeriod < config.minPoints) {
      return "-";
    }

    const comparisonData = findClosestData(sortedData, comparisonDate);
    if (!comparisonData?.nav) {
      return "-";
    }

    const yearDiff = (currentDate - comparisonData.date) / (1000 * 60 * 60 * 24 * 365.25);
    const result =
      yearDiff <= 1
        ? (((currentValue - parseFloat(comparisonData.nav)) / parseFloat(comparisonData.nav)) * 100).toFixed(2)
        : ((Math.pow(currentValue / parseFloat(comparisonData.nav), 1 / yearDiff) - 1) * 100).toFixed(2);

    return result;
  };

  const calculateDrawdowns = (navData) => {
    if (!navData || navData.length === 0) return { maxDrawdown: "-", currentDrawdown: "-" };

    const values = navData.map(entry => parseFloat(entry.nav));
    let maxDrawdown = 0;
    let peak = values[0];

    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((peak - value) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    const currentValue = values[values.length - 1];
    const currentDrawdown = ((peak - currentValue) / peak) * 100;

    return {
      maxDrawdown: maxDrawdown.toFixed(2),
      currentDrawdown: currentDrawdown.toFixed(2)
    };
  };

  const periods = [
    { key: "1d", label: "1D" },
    { key: "5d", label: "5D" },
    { key: "10d", label: "10D" },
    { key: "15d", label: "15D" },
    { key: "1m", label: "1M" },
    { key: "1y", label: "1Y" },
    { key: "2y", label: "2Y" },
    { key: "3y", label: "3Y" },
    { key: "since_inception", label: "Since Inception" }
  ];

  // Use benchmarkArray instead of benchmarkData directly
  const schemeDrawdowns = calculateDrawdowns(filteredSchemeData);
  const benchmarkDrawdowns = calculateDrawdowns(benchmarkArray);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Trailing Returns
        </h3>
      </div>

      <div className="flex flex-col mt-4">
        <div className="overflow-x-auto">
          <div className="align-middle inline-block min-w-full">
            <div className="overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead>
                  <tr>
                    <th className="w-32 text-left px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500  tracking-wider">
                      Name
                    </th>
                    {periods.map((period) => (
                      <th
                        key={period.key}
                        className="w-24 text-center px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {period.label}
                      </th>
                    ))}
                    <th className="w-20 text-center px-2 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-l-2 border-gray-300">
                      DD
                    </th>
                    <th className="w-20 text-center px-2 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max DD
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="w-32 text-left px-4 py-2 whitespace-nowrap text-sm text-gray-900 capitalize">
                      Scheme (%)
                    </td>
                    {periods.map((period) => (
                      <td
                        key={period.key}
                        className="w-24 text-center px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                      >
                        {calculateReturns(filteredSchemeData, period.label)}
                      </td>
                    ))}
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm border-l-2 border-gray-300 text-gray-900">
                      -{schemeDrawdowns.currentDrawdown}
                    </td>
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      -{schemeDrawdowns.maxDrawdown}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-32 text-left px-4 py-2 whitespace-nowrap text-sm text-gray-900 capitalize">
                      Benchmark (%)
                    </td>
                    {periods.map((period) => (
                      <td
                        key={period.key}
                        className="w-24 text-center px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                      >
                        {calculateReturns(benchmarkArray, period.label)}
                      </td>
                    ))}
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm border-l-2 border-gray-300 text-gray-900">
                      -{benchmarkDrawdowns.currentDrawdown}
                    </td>
                    <td className="w-20 text-center px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      -{benchmarkDrawdowns.maxDrawdown}
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
