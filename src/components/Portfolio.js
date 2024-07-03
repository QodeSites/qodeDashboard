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
import RollingReturns from "./RollingReturns";
import PortfolioAllocation from "./PortfolioAllocation";

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
  const chartOptions = getChartOptions(chartData, activeTab);
  const monthlyPL = calculateMonthlyPL(chartData[activeTab]);
  //   console.log(monthlyPL);
  return (
    <div className="p-6 ">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Investment Dashboard</h1>
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab("scheme1")}
            className={`px-4 py-2 mr-2 rounded-lg ${
              activeTab === "scheme1"
                ? "bg-gray-900 text-white"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            Scheme 1
          </button>
          <button
            onClick={() => setActiveTab("scheme2")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "scheme2"
                ? "bg-gray-900 text-white"
                : "bg-gray-300 text-gray-800"
            }`}
          >
            Scheme 2
          </button>
        </div>
      </div>

      {chartData[activeTab] && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow col-span-full">
            <h2 className="text-xl font-semibold mb-4">Performance Chart</h2>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Top 10 Drawdowns</h2>
            <Top10Drawdown drawdowns={top10Drawdowns[activeTab]} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Monthly P&L</h2>
            <MonthlyPLTable data={monthlyPL} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Rolling Returns</h2>
            <RollingReturns data={chartData[activeTab]} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Portfolio Allocation</h2>
            <PortfolioAllocation />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAndDrawdownChart;
