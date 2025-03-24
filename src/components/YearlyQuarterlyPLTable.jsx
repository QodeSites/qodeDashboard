// components/YearlyQuarterlyPLTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

const YearlyQuarterlyPLTable = ({ quarterlyPnL }) => {
  // Flatten nested object structure to an array of { quarter, pnl }
  const quarterlyPnLArray = Object.entries(quarterlyPnL).flatMap(([year, quarters]) =>
    Object.entries(quarters).map(([quarterKey, data]) => ({
      quarter: quarterKey, // Format: "YYYY-Qx"
      year,
      pnl: data.pnl,
    }))
  );

  // Group by year
  const groupedByYear = {};
  quarterlyPnLArray.forEach(({ quarter, year, pnl }) => {
    const [, q] = quarter.split('-'); // e.g., "2023-Q1" → "Q1"
    if (!groupedByYear[year]) {
      groupedByYear[year] = {};
    }
    groupedByYear[year][q] = { pnl };
  });

  const sortedYears = Object.keys(groupedByYear).sort();
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const renderPnLCell = (pnl, key) => {
    const numValue = parseFloat(pnl);
    const cellValue = isNaN(numValue) ? "0.0%" : `${numValue.toFixed(2)}%`;

    let cellClass = "px-4 py-3 text-center";
    if (numValue > 0) {
      cellClass += " bg-green-100";
    }

    return (
      <td key={key} className={cellClass}>
        {numValue > 0 ? `+${cellValue}` : cellValue}
      </td>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium text-gray-900">
        Quarterly Profit and Loss Table (%)
      </h3>
      <div className="w-full mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse divide-y">
          <thead className="bg-lightBeige">
            <tr className="bg-gray-100 text-sm">
              <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              {quarters.map((q) => (
                <th
                  key={q}
                  className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {q}
                </th>
              ))}
              <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {sortedYears.map((year) => {
              const data = groupedByYear[year];
              const compoundedReturn = quarters.reduce((acc, q) => {
                const pnl = data[q]?.pnl ?? 0;
                return acc * (1 + pnl / 100);
              }, 1);
              const totalPnl = (compoundedReturn - 1) * 100;

              return (
                <tr key={year} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 text-center">{year}</td>
                  {quarters.map((q) => {
                    const pnl = data[q]?.pnl;
                    return pnl !== undefined
                      ? renderPnLCell(pnl, `${year}-${q}`)
                      : <td key={`${year}-${q}`} className="px-4 py-3 text-center">-</td>;
                  })}
                  {renderPnLCell(totalPnl, `${year}-total`)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

YearlyQuarterlyPLTable.propTypes = {
  quarterlyPnL: PropTypes.object.isRequired,
};

export default YearlyQuarterlyPLTable;
