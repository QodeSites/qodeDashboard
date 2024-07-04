"use client";
import React, { useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Top10Drawdown from "./Top10Drawdown";
import { useFetchData } from "@/app/lib/api";
import {
  calculateDrawdown,
  calculateTop10Drawdown,
  calculateMonthlyPL,
} from "@/app/lib/Calculation";
import { getChartOptions } from "@/app/lib/ChartOptions";
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

  const top10Drawdowns = {
    scheme1: calculateTop10Drawdown(chartData.scheme1),
    scheme2: calculateTop10Drawdown(chartData.scheme2),
  };

  const chartOptions = getChartOptions(chartData, activeTab);
  const monthlyPL = calculateMonthlyPL(chartData[activeTab]);

  const calculateCAGR3Y = (data) => {
    const years = 3;
    const days = 3 * 365;
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedData.length < days) {
      return "Insufficient data";
    }

    const startValue = sortedData[0]["Total Portfolio NAV"];
    const endValue = sortedData[days - 1]["Total Portfolio NAV"];

    const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    return cagr.toFixed(2);
  };

  const cagr3Y = calculateCAGR3Y(chartData[activeTab]);

  const calculateSummary = (data) => {
    const latestData = data[data.length - 1];
    const initialData = data[0];
    const totalReturn =
      ((latestData["Total Portfolio NAV"] -
        initialData["Total Portfolio NAV"]) /
        initialData["Total Portfolio NAV"]) *
      100;

    return {
      totalReturn: totalReturn.toFixed(2),
      currentNAV: latestData["Total Portfolio NAV"].toFixed(2),
      initialInvestment: initialData["Total Portfolio NAV"].toFixed(2),
    };
  };

  const summary = calculateSummary(chartData[activeTab]);

  const schemeSummaries = {
    scheme1:
      "Scheme 1 is a balanced investment strategy focusing on a mix of equities and fixed income securities. It aims to provide steady growth while managing risk through diversification. This scheme is suitable for investors with a moderate risk appetite looking for capital appreciation and regular income.",
    scheme2:
      "Scheme 2 is a growth-oriented investment strategy with a higher allocation to equities. It targets aggressive growth and capital appreciation over the long term. This scheme is designed for investors with a higher risk tolerance who are seeking potentially higher returns and can withstand market volatility.",
  };

  return (
    <div className="p-6 bg-gray-100">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Investment Dashboard</h1>
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab("scheme1")}
            className={`px-4 py-2 mr-2 rounded-lg transition-colors ${
              activeTab === "scheme1"
                ? "bg-gray-900 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            Scheme 1
          </button>
          <button
            onClick={() => setActiveTab("scheme2")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "scheme2"
                ? "bg-gray-900 text-white"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
          >
            Scheme 2
          </button>
        </div>
      </div>

      {chartData[activeTab] && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="col-span-2">
              <h2 className="text-xl font-semibold mb-2">Summary</h2>
              <p className="text-gray-700">{schemeSummaries[activeTab]}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">3-Year CAGR</h3>
              <p className="text-3xl font-bold text-blue-600">{cagr3Y}%</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow col-span-full">
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Total Return</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.totalReturn}%
                  </p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Current NAV</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    ${summary.currentNAV}
                  </p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    Initial Investment
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${summary.initialInvestment}
                  </p>
                </div>
              </div> */}

              <h2 className="text-xl font-semibold mb-4">Performance Chart</h2>
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
              <Top10Drawdown drawdowns={top10Drawdowns[activeTab]} />
            </div>

            {/* Rest of the component remains the same */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Monthly P&L</h2>
              <MonthlyPLTable data={monthlyPL} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Rolling Returns</h2>
              <RollingReturns data={chartData[activeTab]} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Portfolio Allocation
              </h2>
              <PortfolioAllocation />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceAndDrawdownChart;
