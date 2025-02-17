// components/YearlyMonthlyPLTable.jsx
import React from "react";
import PropTypes from "prop-types";

const YearlyMonthlyPLTable = ({ monthlyPnL }) => {
  // Map full month names (from your data) to two-digit month labels.
  const monthFullToLabel = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };

  // Define the month labels (two-digit) and their corresponding abbreviated names.
  const monthLabels = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  const monthNames = [
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

  // Group the monthlyPnL data by year using two-digit month labels.
  const groupedByYear = {};
  monthlyPnL.forEach((item) => {
    const year = item.year.toString();
    const monthLabel = monthFullToLabel[item.month];
    if (!year || !monthLabel) return;

    if (!groupedByYear[year]) {
      groupedByYear[year] = {};
    }
    groupedByYear[year][monthLabel] = item;
  });

  // Get a sorted list of years (ascending order)
  const sortedYears = Object.keys(groupedByYear).sort();

  // Helper function to render a PnL cell with conditional styling.
  const renderPnLCell = (pnl, key) => {
    const numValue = parseFloat(pnl);
    // If numValue is not a number, show a dash.
    if (isNaN(numValue)) {
      return (
        <td key={key} className="p-1 text-center text-gray-900 ">
          -
        </td>
      );
    }
    const cellValue = `${Math.abs(numValue).toFixed(2)}%`;
    let cellClass = "text-center p-1 ";
    if (numValue > 0) {
      // Positive PnL: green background
      cellClass += "bg-green-100 font-semibold";
      return (
        <td key={key} className={cellClass}>
          {`+${cellValue}`}
        </td>
      );
    } else if (numValue < 0) {
      // Negative PnL: red background
      cellClass += "bg-red-100  font-semibold";
      return (
        <td key={key} className={cellClass}>
          {`-${cellValue}`}
        </td>
      );
    } else {
      // Zero or neutral PnL
      return (
        <td key={key} className="p-1 text-center text-gray-900 ">
          {cellValue}
        </td>
      );
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg my-6 shadow overflow-hidden">
      {/* Table Header */}
      <h3 className="text-lg leading-6 mb-4 font-medium text-gray-900">
        Monthly PnL Table (%)
      </h3>


      {/* Table Container */}
      <div className="overflow-x-auto border text-xs sm:text-lg border-t-0 border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                colSpan="1"
                role="columnheader"
                title="Toggle SortBy"
                className="text-center px-4 py-2 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                style={{ cursor: "pointer" }}
              >
                Year
              </th>
              {monthNames.map((monthName, index) => (
                <th
                  colSpan="1"
                  key={monthLabels[index]}
                  role="columnheader"
                  title="Toggle SortBy"
                  className=" px-4 py-2 bg-gray-50 text-center text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                  style={{ cursor: "pointer" }}
                >
                  {monthName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white text-xs sm:text-sm divide-y divide-gray-200">
            {sortedYears.map((year) => (
              <tr key={year} className="hover:bg-gray-50 border-none">
                {/* Year cell */}
                <td className="p-2  text-center font-semibold text-gray-900">
                  {year}
                </td>
                {/* Month cells */}
                {monthLabels.map((monthLabel) => {
                  const monthData = groupedByYear[year][monthLabel];
                  const cellKey = `${year}-${monthLabel}`;
                  return monthData ? (
                    renderPnLCell(monthData?.pnl?.toFixed(2), cellKey)
                  ) : (
                    <td
                      key={cellKey}
                      className="p-2 text-center text-gray-900"
                    >
                      -
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

};

YearlyMonthlyPLTable.propTypes = {
  monthlyPnL: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      month: PropTypes.string.isRequired, // Expected to be the full month name (e.g., "November")
      pnl: PropTypes.number.isRequired,
      // Additional properties can be added here if needed
    })
  ).isRequired,
};

export default YearlyMonthlyPLTable;
