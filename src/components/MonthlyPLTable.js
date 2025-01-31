// components/MonthlyPLTable.jsx
import React from 'react';
import PropTypes from 'prop-types';



const MonthlyPLTable = ({ monthlyPnL }) => {
  console.log('monthlyPnL', monthlyPnL); // Debugging log

  // Conditional rendering if monthlyPnL is empty or undefined
  if (!monthlyPnL || !Array.isArray(monthlyPnL) || monthlyPnL.length === 0) {
    return null;
  }

  // Helper function to render the PnL cell with conditional styling
  const renderPnLCell = (pnl) => {
    const numValue = parseFloat(pnl);
    const cellValue = isNaN(numValue) ? "0.0%" : `${numValue}%`;

    let cellClass = "text-center p-1";
    if (numValue > 0) { // Positive PnL
      cellClass += " bg-green-100 dark:bg-green-900 font-semibold";
    } else if (numValue < 0) { // Negative PnL
      cellClass += " bg-red-100 dark:bg-red-900 font-semibold";
    }

    return (
      <td className={cellClass}>
        {numValue >= 0 ? `+${cellValue}` : cellValue}
      </td>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="p-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Monthly PnL Table (%)
          </h3>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-1 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Year
                </th>
                <th className="p-1 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Month
                </th>
                <th className="p-1 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                  PnL (%)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {monthlyPnL.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-1 text-center font-semibold text-gray-900 dark:text-gray-100">
                    {row.year}
                  </td>
                  <td className="p-1 text-center text-gray-900 dark:text-gray-100">
                    {row.month}
                  </td>
                  {renderPnLCell(row.pnl)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Define PropTypes for type checking and better maintainability
MonthlyPLTable.propTypes = {
  monthlyPnL: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.number.isRequired,
      month: PropTypes.string.isRequired,
      firstNAV: PropTypes.number,
      lastNAV: PropTypes.number,
      pnl: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default MonthlyPLTable;
