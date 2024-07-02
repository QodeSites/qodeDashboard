// components/MonthlyPLTable.js
import React from "react";

const MonthlyPLTable = ({ data }) => {
  // Utility to generate header months
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const getHeatmapColor = (percentChange) => {
    if (percentChange === "N/A") {
      return "bg-gray-200"; // Grey for no data
    }
    const percent = parseFloat(percentChange);
    if (percent < 0) {
      return "bg-red-500"; // More intense red for higher negative changes
    } else if (percent === 0) {
      return "bg-gray-300"; // Grey for zero change
    } else if (percent <= 2) {
      return "bg-green-300"; // Light green for small gains
    } else if (percent <= 5) {
      return "bg-green-500"; // Darker green for moderate gains
    } else {
      return "bg-green-700"; // Even darker green for high gains
    }
  };
  // Utility to parse data into year-month structured object
  const parseData = (data) => {
    const yearlyData = {};
    data.forEach((item) => {
      const [year, month] = item.month.split("-");
      if (!yearlyData[year]) {
        yearlyData[year] = Array(12).fill("N/A"); // Initialize with 'N/A' for months with no data
      }
      yearlyData[year][parseInt(month) - 1] = item.percentChange;
    });
    return yearlyData;
  };

  const yearlyData = parseData(data);

  return (
    <div className="overflow-x-auto mt-20 border rounded-2xl p-5">
      <h1 className="text-2xl mb-5 font-black">
        Monthly Profit & Loss Stats of the fund{" "}
      </h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-400 text-white">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
            >
              Year
            </th>
            {months.map((month) => (
              <th
                key={month}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                {month}
              </th>
            ))}
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.keys(yearlyData).map((year) => (
            <tr key={year}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {year}
              </td>
              {yearlyData[year].map((percentChange, index) => (
                <td
                  key={index}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${getHeatmapColor(
                    percentChange
                  )}`}
                >
                  {percentChange}
                </td>
              ))}
              <td
                className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${getHeatmapColor(
                  yearlyData[year][yearlyData[year].length - 1]
                )}`}
              >
                {yearlyData[year][yearlyData[year].length - 1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyPLTable;
