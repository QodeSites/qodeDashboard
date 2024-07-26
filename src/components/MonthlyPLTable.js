import React from "react";

const MonthlyPLTable = ({ data }) => {
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

  const parseData = (data) => {
    const yearlyData = {};
    data.forEach((item) => {
      const [year, month] = item.month.split("-");
      if (!yearlyData[year]) yearlyData[year] = Array(12).fill(null);
      yearlyData[year][parseInt(month) - 1] = parseFloat(item.percentChange);
    });
    return yearlyData;
  };

  const yearlyData = parseData(data);

  const calculateYearlyTotal = (yearData) => {
    const validValues = yearData.filter((val) => val !== null);
    if (validValues.length === 0) return null;
    const total = validValues.reduce((acc, val) => (1 + val / 100) * acc, 1);
    return ((total - 1) * 100).toFixed(2);
  };

  const getDisplayValue = (value) => {
    if (value === null) return "-";
    return value > 0 ? `+${value}%` : `${value}%`;
  };

  return (
    <div className="overflow-x-auto helvetica-font mt-10 font-sans">
      <h1 className="text-xl text-start font-semibold mb-4">Monthly PL</h1>
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b-2">
            <th className="p-3 border-r-2 text-left text-sm sticky left-0 bg-white"></th>
            {months.map((month) => (
              <th key={month} className="p-3 text-left text-[22px] border-r-2">
                {month}
              </th>
            ))}
            <th className="p-3 text-left text-[22px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(yearlyData).map((year) => (
            <tr key={year} className="border-b border-gray-200">
              <td className="p-3 border-r-2 text-[22px] sticky left-0 bg-white">
                {year}
              </td>
              {yearlyData[year].map((percentChange, index) => (
                <td key={index} className={`p-3 border-r-2 text-sm`}>
                  {getDisplayValue(percentChange)}
                </td>
              ))}
              <td className={`p-3  text-xl`}>
                {getDisplayValue(calculateYearlyTotal(yearlyData[year]))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyPLTable;
