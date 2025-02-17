// components/YearlyMonthlyPLTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

const YearlyMonthlyPLTable = ({ monthlyPnL }) => {
  // console.log(monthlyPnL)
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
      cellClass += " bg-green-100 ";
    } else if (numValue < 0) {
      cellClass += "  ";
    }

    return (
      <td key={key} className={cellClass}>
        {numValue > 0 ? `+${cellValue}` : cellValue}
      </td>
    );
  };

  return (

    <div className="bg-white  p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Monthly Profit and Loss Table (%)
      </h3>
      <div className="w-full mt-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Table Header */}

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse divide-y  ">
              <thead className="bg-lightBeige">
                <tr className='bg-gray-100 text-sm'>
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
                      className="text-center px-4 py-2 bg-gray-50  text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                      style={{ cursor: "pointer" }}
                    >
                      {monthName}
                    </th>
                  ))}
                  {/* Total column header */}
                  <th
                    className="text-center px-4 py-2 bg-gray-50  text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                    style={{ cursor: "pointer" }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y ">
                {sortedYears.map((year) => {
                  // Compute compounded (percentage) return for the year.
                  // For missing months, assume 0% (multiplier of 1).
                  const compoundedReturn = monthLabels.reduce((product, monthLabel) => {
                    const monthData = groupedByYear[year][monthLabel];
                    const monthlyReturn = monthData ? monthData.pnl : 0;
                    return product * (1 + monthlyReturn / 100);
                  }, 1);
                  const totalReturnPercentage = (compoundedReturn - 1) * 100;

                  return (
                    <tr key={year} className="hover:bg-gray-50 text-sm border-none">
                      {/* Year cell */}
                      <td className="px-4 py-3 text-center  ">
                        {year}
                      </td>
                      {/* Month cells */}
                      {monthLabels.map((monthLabel) => {
                        const monthData = groupedByYear[year][monthLabel];
                        const cellKey = `${year}-${monthLabel}`;
                        return monthData ? (
                          renderPnLCell(monthData.pnl.toFixed(2), cellKey)
                        ) : (
                          <td
                            key={cellKey}
                            className="px-4 py-3 text-center "
                          >
                            -
                          </td>
                        );
                      })}
                      {/* Total cell: compounded percentage change */}
                      {renderPnLCell(totalReturnPercentage.toFixed(2), `${year}-total`)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
