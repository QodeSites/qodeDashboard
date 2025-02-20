import React from "react";
import PropTypes from "prop-types";

const YearlyMonthlyPLTable = ({ monthlyPnL }) => {
  console.log('monthlyPnL'  , monthlyPnL);
  const monthFullToLabel = {
    January: "01", February: "02", March: "03", April: "04",
    May: "05", June: "06", July: "07", August: "08",
    September: "09", October: "10", November: "11", December: "12",
  };

  const monthLabels = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12"
  ];

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const calculatePnL = (item) => {
    if (item.pnl === 0 && item.firstNAV && item.lastNAV) {
      return ((item.lastNAV - item.firstNAV) / item.firstNAV) * 100;
    }
    return item.pnl;
  };

  // Group the monthlyPnL data by year
  const groupedByYear = {};
  monthlyPnL.forEach((item) => {
    const year = item.year.toString();
    const monthLabel = monthFullToLabel[item.month];
    if (!year || !monthLabel) return;

    if (!groupedByYear[year]) {
      groupedByYear[year] = {};
    }

    const calculatedPnL = calculatePnL(item);
    groupedByYear[year][monthLabel] = {
      ...item,
      pnl: calculatedPnL
    };
  });

  const calculateYearlyTotal = (yearData, allData, year) => {
    // Find the latest month with data in current year
    //console.log(yearData);
    
    const currentYearMonths = Object.keys(yearData).sort((a, b) => b - a);
    if (currentYearMonths.length === 0) return null;
    
    const latestMonth = currentYearMonths[0];
    const latestNAV = yearData[latestMonth].lastNAV;
    
    // Find earliest month in current year
    const earliestMonth = currentYearMonths[currentYearMonths.length - 1];
    const firstNAVOfYear = yearData[earliestMonth].firstNAV;
    
    // Find previous year's December NAV
    const previousYear = (parseInt(year) - 1).toString();
    const previousYearData = allData[previousYear];
    
    // If no previous year data, use first NAV of current year
    if (!previousYearData || !previousYearData["12"]) {
      return ((latestNAV - firstNAVOfYear) / firstNAVOfYear) * 100;
    }
    
    const previousYearEndNAV = previousYearData["12"].lastNAV;
    
    // Calculate total return
    const totalReturn = ((latestNAV - previousYearEndNAV) / previousYearEndNAV) * 100;
    
    return totalReturn;
  };
  
  const sortedYears = Object.keys(groupedByYear).sort();

  const renderPnLCell = (pnl, key) => {
    const numValue = parseFloat(pnl);
    if (isNaN(numValue)) {
      return (
        <td key={key} className="p-1 text-center text-gray-900">
          -
        </td>
      );
    }
    const cellValue = `${Math.abs(numValue).toFixed(2)}%`;
    let cellClass = "text-center p-1 ";
    if (numValue > 0) {
      cellClass += "bg-green-100 font-semibold";
      return (
        <td key={key} className={cellClass}>
          {`+${cellValue}`}
        </td>
      );
    } else if (numValue < 0) {
      cellClass += "bg-red-100 font-semibold";
      return (
        <td key={key} className={cellClass}>
          {`-${cellValue}`}
        </td>
      );
    } else {
      return (
        <td key={key} className="p-1 text-center text-gray-900">
          {cellValue}
        </td>
      );
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg my-6 shadow overflow-hidden">
      <h3 className="text-lg leading-6 mb-4 font-medium text-gray-900">
        Monthly PnL Table (%)
      </h3>

      <div className="overflow-x-auto border text-xs sm:text-lg border-t-0 border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-center px-4 py-2 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              {monthNames.map((monthName, index) => (
                <th
                  key={monthLabels[index]}
                  className="px-4 py-2 bg-gray-50 text-center text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                >
                  {monthName}
                </th>
              ))}
              <th className="px-4 py-2 bg-gray-50 text-center text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white text-xs sm:text-sm divide-y divide-gray-200">
            {sortedYears.map((year) => {
              const yearlyTotal = calculateYearlyTotal(groupedByYear[year], groupedByYear, year);
              return (
                <tr key={year} className="hover:bg-gray-50 border-none">
                  <td className="p-2 text-center font-semibold text-gray-900">
                    {year}
                  </td>
                  {monthLabels.map((monthLabel) => {
                    const monthData = groupedByYear[year][monthLabel];
                    const cellKey = `${year}-${monthLabel}`;
                    return monthData ? (
                      renderPnLCell(monthData?.pnl, cellKey)
                    ) : (
                      <td key={cellKey} className="p-2 text-center text-gray-900">
                        -
                      </td>
                    );
                  })}
                  {renderPnLCell(yearlyTotal, `${year}-total`)}
                </tr>
              );
            })}
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
      month: PropTypes.string.isRequired,
      pnl: PropTypes.number.isRequired,
      firstNAV: PropTypes.number,
      lastNAV: PropTypes.number,
    })
  ).isRequired,
};

export default YearlyMonthlyPLTable;