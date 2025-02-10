import React from "react";
import { Table, Container, Alert, Card } from "react-bootstrap";

// Define months arrays at the top level
const monthsShort = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const monthsFull = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function MonthlyPLTable({ portfolios }) {
  // Early return if no data
  if (!portfolios || portfolios.length === 0) {
    return (
      <Container>
        <Alert variant="warning" className="text-center">
          No data available
        </Alert>
      </Container>
    );
  }

  // Helper function to determine cell styling
  const getCellStyle = (value) => {
    const numValue = parseFloat(value);
    if (numValue > 4) return "table-success fw-semibold";
    if (numValue < -4) return "table-danger fw-semibold";
    return "";
  };

  // Helper function to format cell value
  const formatCellValue = (value) => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "0.0%" : `${numValue.toFixed(1)}%`;
  };

  // Render individual cell with appropriate styling
  const renderCell = (value) => {
    return (
      <td className={`text-center ${getCellStyle(value)}`}>
        {formatCellValue(value)}
      </td>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow my-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Monthly PnL Table (%)
      </h3>
      <div className="w-full mt-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse divide-y">
              <thead className="bg-lightBeige">
                <tr className="bg-gray-100 text-sm">
                  <th
                    colSpan="1"
                    role="columnheader"
                    title="Toggle SortBy"
                    className="text-left px-4 py-2 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                    style={{ cursor: "pointer" }}
                  >
                    Year
                  </th>
                  {monthNames.map((monthName, index) => (
                    <th
                      key={monthLabels[index]}
                      colSpan="1"
                      role="columnheader"
                      title="Toggle SortBy"
                      className="text-left px-4 py-2 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                      style={{ cursor: "pointer" }}
                    >
                      {monthName}
                    </th>
                  ))}
                  <th
                    className="text-left px-4 py-2 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                    style={{ cursor: "pointer" }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {sortedYears.map((year) => {
                  // Calculate the compounded return for the year.
                  const compoundedReturn = monthLabels.reduce((product, monthLabel) => {
                    const monthData = groupedByYear[year][monthLabel];
                    const monthlyReturn = monthData ? monthData.pnl : 0;
                    return product * (1 + monthlyReturn / 100);
                  }, 1);
                  const totalReturnPercentage = (compoundedReturn - 1) * 100;
  
                  return (
                    <tr key={year} className="hover:bg-gray-50 text-sm border-none">
                      {/* Year cell */}
                      <td className="px-4 py-3 text-center">{year}</td>
                      {/* Month cells */}
                      {monthLabels.map((monthLabel) => {
                        const monthData = groupedByYear[year][monthLabel];
                        const cellKey = `${year}-${monthLabel}`;
                        return monthData ? (
                          renderPnLCell(monthData.pnl.toFixed(2), cellKey)
                        ) : (
                          <td key={cellKey} className="px-4 py-3 text-center">
                            -
                          </td>
                        );
                      })}
                      {/* Total cell */}
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
  
}

export default MonthlyPLTable;