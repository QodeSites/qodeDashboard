// components/YearlyMonthlyPLTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

const YearlyMonthlyPLTable = ({ monthlyPnL }) => {
  // Group monthlyPnL by year using the month string ("YYYY-MM")
  const groupedByYear = {};
  console.log('monthlyPnL', monthlyPnL);
  monthlyPnL.forEach(item => {
    const [year, monthNum] = item.month.split('-');
    if (!groupedByYear[year]) {
      groupedByYear[year] = {};
    }
    groupedByYear[year][monthNum] = item;
  });

  // Get a sorted list of years (ascending order)
  const sortedYears = Object.keys(groupedByYear).sort();

  // Define the month labels and corresponding abbreviations.
  // We use the two-digit month keys (e.g., "01", "02", …, "12")
  const monthLabels = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Helper function to render the PnL cell with conditional styling and a key.
  const renderPnLCell = (pnl, key) => {
    const numValue = parseFloat(pnl);
    const cellValue = isNaN(numValue) ? "0.0%" : `${numValue}%`;

    let cellClass = "text-center p-1";
    if (numValue > 0) { // Positive PnL
      cellClass += " bg-green-100 dark:bg-green-900 font-semibold";
    } else if (numValue < 0) { // Negative PnL
      cellClass += " bg-red-100 dark:bg-red-900 font-semibold";
    }

    return (
      <td key={key} className={cellClass}>
        {numValue > 0 ? `+${cellValue}` : cellValue}
      </td>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="p-1 bg-lightBeige dark:bg-gray-700 border border-brown dark:border-gray-600">
          <h3 className="text-xs sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Monthly PnL Table (%)
          </h3>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto border text-xs sm:text-lg border-t-none border-brown rounded-lg">
          <table className="min-w-full divide-y divide-gray-200  dark:divide-gray-700">
            <thead className="bg-lightBeige dark:bg-gray-700">
              <tr>
                <th className="p-1 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Year
                </th>
                {monthNames.map((monthName, index) => (
                  <th
                    key={monthLabels[index]}
                    className="p-1 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {monthName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 text-xs sm:text-sm divide-y divide-gray-200 dark:divide-gray-700">
              {sortedYears.map(year => (
                <tr key={year} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {/* Year cell */}
                  <td className="p-1 text-center font-semibold text-gray-900 dark:text-gray-100">
                    {year}
                  </td>
                  {/* Month cells */}
                  {monthLabels.map((monthLabel) => {
                    const monthData = groupedByYear[year][monthLabel];
                    const cellKey = `${year}-${monthLabel}`;
                    return monthData
                      ? renderPnLCell((monthData.pnlPercentage.toFixed(2)), cellKey)
                      : (
                        <td
                          key={cellKey}
                          className="p-1 text-center text-gray-900 dark:text-gray-100"
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
    </div>
  );
};

YearlyMonthlyPLTable.propTypes = {
  monthlyPnL: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired, // Format: "YYYY-MM"
      pnl: PropTypes.number.isRequired,
      monthlyReturn: PropTypes.number, // Optional computed percentage
      portfolioValue: PropTypes.number,
      trades: PropTypes.number,
    })
  ).isRequired,
};

export default YearlyMonthlyPLTable;
