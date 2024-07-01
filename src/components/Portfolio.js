"use client";
import React, { useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Top10Drawdown from "./Top10Drawdown";
import { useFetchData } from "@/app/lib/api"; // Assumes this is correctly set up to fetch data
import {
  calculateDrawdown,
  calculateTop10Drawdown,
  calculateMonthlyPL,
} from "@/app/lib/Calculation"; // Ensure these are exported from the module
import { getChartOptions } from "@/app/lib/ChartOptions"; // Ensure this is set up for generating chart options
import MonthlyPLTable from "./MonthlyPLTable";

const PerformanceAndDrawdownChart = () => {
  const [activeTab, setActiveTab] = useState("scheme1");
  const {
    data: chartData,
    isLoading,
    error,
  } = useFetchData("/investment-data.json");

  // Calculate top 10 drawdowns whenever chartData changes
  const top10Drawdowns = {
    scheme1: calculateTop10Drawdown(chartData.scheme1),
    scheme2: calculateTop10Drawdown(chartData.scheme2),
  };

  if (isLoading || !chartData) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-80">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  // Simplified dynamic generation of chart options based on active tab
  console.log(chartData[activeTab], activeTab);
  const chartOptions = getChartOptions(chartData, activeTab);
  const monthlyPL = calculateMonthlyPL(chartData[activeTab]);
  //   console.log(monthlyPL);
  return (
    <div>
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab("scheme1")}
          className={`px-4 py-2 mr-2 ${
            activeTab === "scheme1"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Scheme 1
        </button>
        <button
          onClick={() => setActiveTab("scheme2")}
          className={`px-4 py-2 ${
            activeTab === "scheme2"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Scheme 2
        </button>
      </div>
      {chartData[activeTab] && (
        <>
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          <Top10Drawdown drawdowns={top10Drawdowns[activeTab]} />
          <MonthlyPLTable data={monthlyPL} />
        </>
      )}
    </div>
  );

  //   console.log(top10Drawdowns);

  //   return (
  //     <div>
  //       <div className="flex mb-4">
  //         <button
  //           className={`px-4 py-2 mr-2 ${
  //             activeTab === "scheme1"
  //               ? "bg-blue-500 text-white"
  //               : "bg-gray-200 text-gray-700"
  //           }`}
  //           onClick={() => setActiveTab("scheme1")}
  //         >
  //           Scheme 1
  //         </button>
  //         <button
  //           className={`px-4 py-2 ${
  //             activeTab === "scheme2"
  //               ? "bg-blue-500 text-white"
  //               : "bg-gray-200 text-gray-700"
  //           }`}
  //           onClick={() => setActiveTab("scheme2")}
  //         >
  //           Scheme 2
  //         </button>
  //       </div>
  //       <div>
  //         {activeTab === "scheme1" && (
  //           <>
  //             <HighchartsReact
  //               highcharts={Highcharts}
  //               options={getChartOptions("scheme1")}
  //             />
  //             <Top10Drawdown drawdowns={top10Drawdowns.scheme1} />
  //           </>
  //         )}
  //         {activeTab === "scheme2" && (
  //           <>
  //             <HighchartsReact
  //               highcharts={Highcharts}
  //               options={getChartOptions("scheme2")}
  //             />
  //             <Top10Drawdown drawdowns={top10Drawdowns.scheme2} />
  //           </>
  //         )}
  //       </div>
  //     </div>
  //   );
};

export default PerformanceAndDrawdownChart;
