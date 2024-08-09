import React from "react";

const MonthlyPLTable = ({ data }) => {
  // console.log("data: ", data);
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
    <div className="overflow-x-auto minion-pro-font bg-[#fafafa]  p-10 mt-10 ">
      <h1 className="text-3xl text-start mb-10 font-black sophia-pro-font">Monthly & Yearly P&L</h1>
      <table className="min-w-full bg-white  border-collapse">
        <thead>
          <tr className="border-b  ">
            <th className="p-2 text-left  text-md sticky left-0 "></th>
            {months.map((month) => (
              <th key={month} className="p-3 font-bold sophia-pro-font text-left text-md ">
                {month}
              </th>
            ))}
            <th className="p-2 text-left text-md font-bold sophia-pro-font">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(yearlyData).map((year) => (
            <tr key={year} className="">
              <td className="p-5  text-md font-bold sophia-pro-font sticky left-0 ">
                {year}
              </td>
              {yearlyData[year].map((percentChange, index) => (
                <td key={index} className={`p-3   text-md`}>
                  {getDisplayValue(percentChange)}
                </td>
              ))}
              <td className={`p-2 font-bold sophia-pro-font text-md`}>
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
