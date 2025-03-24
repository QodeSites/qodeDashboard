import React from 'react';
import PropTypes from 'prop-types';

const YearlyQuarterlyPLTable = ({ quarterlyPnL }) => {
    // Handle data that might be nested under byQuarter
    const pnlData = quarterlyPnL.byQuarter || quarterlyPnL;
    console.log("Processed Quarterly P&L:", pnlData);

    // Flatten nested object structure to an array of { quarter, year, navPnLPercent, cashPnL }
    const quarterlyPnLArray = Object.entries(pnlData).flatMap(([quarterKey, data]) => {
        const [year, quarter] = quarterKey.split('-'); // "2023-Q1" → ["2023", "Q1"]
        return [{
            quarter: quarterKey,
            year,
            navPnLPercent: data.navPnLPercent ?? 0, // Percentage P&L
            cashPnL: data.cashPnL ?? 0,             // Cash P&L
        }];
    });

    // Group by year for both navPnLPercent and cashPnL
    const groupedByYear = {};
    quarterlyPnLArray.forEach(({ quarter, year, navPnLPercent, cashPnL }) => {
        const [, q] = quarter.split('-'); // e.g., "2023-Q1" → "Q1"
        if (!groupedByYear[year]) {
            groupedByYear[year] = {};
        }
        groupedByYear[year][q] = { navPnLPercent, cashPnL };
    });

    const sortedYears = Object.keys(groupedByYear).sort();
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Helper function to render percentage P&L cell
    const renderPercentPnLCell = (pnl, key) => {
        const numValue = parseFloat(pnl);
        const cellValue = isNaN(numValue) ? "0.0%" : `${numValue.toFixed(2)}%`;
        let cellClass = "px-4 py-3 text-center";

        // Only apply green background for positive values
        if (numValue > 0) cellClass += " bg-green-100";
        // No red color for negative values as requested

        return (
            <td key={key} className={cellClass}>
                {numValue > 0 ? `+${cellValue}` : cellValue}
            </td>
        );
    };

    // Helper function to render cash P&L cell in rupee format
    const renderCashPnLCell = (pnl, key) => {
        const numValue = parseFloat(pnl);
        const absValue = Math.abs(numValue);

        // Format with rupee symbol and appropriate formatting
        const cellValue = isNaN(numValue) ? "0.00" : absValue.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        let cellClass = "px-4 py-3 text-center";

        // Only apply green background for positive values
        if (numValue > 0) cellClass += " bg-green-100";
        // No red color for negative values as requested

        return (
            <td key={key} className={cellClass}>
                {numValue > 0 ? `+${cellValue}` : `-₹${cellValue}`}
            </td>
        );
    };

    // Calculate compounded return for percentages and total cash for each year
    const calculateYearlyTotals = (year) => {
        const data = groupedByYear[year];
        const compoundedReturn = quarters.reduce((acc, q) => {
            const pnl = data[q]?.navPnLPercent ?? 0;
            return acc * (1 + pnl / 100);
        }, 1);
        const totalPercentPnL = (compoundedReturn - 1) * 100;

        const totalCashPnL = quarters.reduce((acc, q) => {
            return acc + (data[q]?.cashPnL ?? 0);
        }, 0);

        return { totalPercentPnL, totalCashPnL };
    };

    // Check if we have any data to display
    if (Object.keys(groupedByYear).length === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <p className="text-center text-gray-500">No quarterly P&L data available.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Percentage Table */}
                <div className="flex-1">
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
                                    const { totalPercentPnL } = calculateYearlyTotals(year);
    
                                    return (
                                        <tr key={year} className="hover:bg-gray-50 text-sm">
                                            <td className="px-4 py-3 text-center">{year}</td>
                                            {quarters.map((q) => {
                                                const pnl = data[q]?.navPnLPercent;
                                                return pnl !== undefined
                                                    ? renderPercentPnLCell(pnl, `${year}-${q}`)
                                                    : <td key={`${year}-${q}`} className="px-4 py-3 text-center">-</td>;
                                            })}
                                            {renderPercentPnLCell(totalPercentPnL, `${year}-total`)}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
    
                {/* Cash Table */}
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                        Quarterly Profit and Loss Table (Cash)
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
                                    const { totalCashPnL } = calculateYearlyTotals(year);
    
                                    return (
                                        <tr key={year} className="hover:bg-gray-50 text-sm">
                                            <td className="px-4 py-3 text-center">{year}</td>
                                            {quarters.map((q) => {
                                                const cashPnL = data[q]?.cashPnL;
                                                return cashPnL !== undefined
                                                    ? renderCashPnLCell(cashPnL, `${year}-${q}`)
                                                    : <td key={`${year}-${q}`} className="px-4 py-3 text-center">-</td>;
                                            })}
                                            {renderCashPnLCell(totalCashPnL, `${year}-total`)}
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

YearlyQuarterlyPLTable.propTypes = {
    quarterlyPnL: PropTypes.object.isRequired,
};

export default YearlyQuarterlyPLTable;