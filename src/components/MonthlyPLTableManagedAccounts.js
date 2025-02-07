// components/YearlyMonthlyPLTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

const YearlyMonthlyPLTable = ({ monthlyPnL }) => {
  // Convert monthlyPnL to an array if it isn't already one.
  const monthlyPnLArray = Array.isArray(monthlyPnL)
    ? monthlyPnL
    : Object.entries(monthlyPnL).map(([month, data]) => ({ month, ...data }));

  // Group monthlyPnLArray by year using the month string ("YYYY-MM")
  const groupedByYear = {};
  monthlyPnLArray.forEach(item => {
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

  // Helper function to render the PnL cell with conditional styling.
  const renderPnLCell = (pnl, key) => {
    const numValue = parseFloat(pnl);
    const cellValue = isNaN(numValue) ? "0.0%" : `${numValue}%`;

    let cellClass = "px-4 py-3 text-center";
    if (numValue > 0) {
      cellClass += " bg-green-100 font-semibold";
    } else if (numValue < 0) {
      cellClass += " bg-red-100 font-semibold";
    }

    return (
      <td key={key} className={cellClass}>
        {numValue > 0 ? `+${cellValue}` : cellValue}
      </td>
    );
  };

  return (
    <div className="w-full mt-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly PnL Table (%)
          </h3>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Year
                </th>
                {monthNames.map((monthName, index) => (
                  <th
                    key={monthLabels[index]}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-900"
                  >
                    {monthName}
                  </th>
                ))}
                {/* Add Total column header */}
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedYears.map(year => {
                // Compute total for the year by summing available monthly pnl values.
                const total = monthLabels.reduce((sum, monthLabel) => {
                  const monthData = groupedByYear[year][monthLabel];
                  return monthData ? sum + monthData.pnl : sum;
                }, 0);

                return (
                  <tr key={year} className="hover:bg-gray-50">
                    {/* Year cell */}
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      {year}
                    </td>
                    {/* Month cells */}
                    {monthLabels.map((monthLabel) => {
                      const monthData = groupedByYear[year][monthLabel];
                      const cellKey = `${year}-${monthLabel}`;
                      return monthData
                        ? renderPnLCell(monthData.pnl.toFixed(2), cellKey)
                        : (
                          <td
                            key={cellKey}
                            className="px-4 py-3 text-center text-gray-900"
                          >
                            -
                          </td>
                        );
                    })}
                    {/* Total cell */}
                    {renderPnLCell(total.toFixed(2), `${year}-total`)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

YearlyMonthlyPLTable.propTypes = {
  monthlyPnL: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        month: PropTypes.string.isRequired, // Format: "YYYY-MM"
        pnl: PropTypes.number.isRequired,
        monthlyReturn: PropTypes.number, // Optional computed percentage
        portfolioValue: PropTypes.number,
        trades: PropTypes.number,
      })
    ),
    PropTypes.object // Allow an object structure as well
  ]).isRequired,
};

export default YearlyMonthlyPLTable;
