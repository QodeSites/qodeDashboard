import React from "react";

const MonthlyPLTable = ({ data }) => {
  console.log("data: ", data);
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
    <div className="overflow-x-auto helvetica-font border border-black p-10 mt-10 font-sans">
      <h1 className="text-5xl text-start mb-10 ">Monthly & Yearly P&L</h1>
      <table className="min-w-full border border-black border-collapse">
        <thead>
          <tr className="border-b  border-black">
            <th className="p-2 text-left text-4xl sticky left-0 bg-white"></th>
            {months.map((month) => (
              <th key={month} className="p-3 font-medium text-left text-4xl ">
                {month}
              </th>
            ))}
            <th className="p-2 text-left text-4xl font-medium ">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(yearlyData).map((year) => (
            <tr key={year} className="">
              <td className="p-5  text-4xl sticky left-0 bg-white">
                {year}
              </td>
              {yearlyData[year].map((percentChange, index) => (
                <td key={index} className={`p-3   text-3xl`}>
                  {getDisplayValue(percentChange)}
                </td>
              ))}
              <td className={`p-2  text-4xl`}>
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
