"use client";
import React, { useEffect, useState, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import fetchStrategyData, { useFetchData } from "@/app/lib/api";
import "../app/globals.css";
import {
  calculateDrawdown,
  calculateTop10Drawdown,
  calculateMonthlyPL,
} from "@/app/lib/Calculation";
import { getChartOptions } from "@/app/lib/ChartOptions";
import Top10Drawdown from "./Top10Drawdown";
import MonthlyPLTable from "./MonthlyPLTable";
import Holdings from "./Holdings";
import HoldingDistribution from "./HoldingDistribution";
import PortfolioAllocation from "./PortfolioAllocation";
import CompoundedAnnualReturns from "./RollingReturns";

const PerformanceAndDrawdownChart = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeRange, setTimeRange] = useState("ALL");
  const [activeButton, setActiveButton] = useState("ALL");
  const [activeTab, setActiveTab] = useState("strategy1");
  const [triggerFetch, setTriggerFetch] = useState(0);
  const { data: chartData, isLoading, error } = useFetchData("/mainData.json");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchStrategyData(
          activeTab,
          timeRange,
          startDate,
          endDate
        );
        setFilteredData(data);
      } catch (error) {
        console.error("Error loading data: ", error);
      }
    };

    loadData();
  }, [activeTab, timeRange, startDate, endDate, triggerFetch]);

  const calculateCAGR = useMemo(
    () =>
      (data, timeRange = "3Y", key = "Total Portfolio NAV") => {
        const parseDate = (dateString) => {
          const [month, day, year] = dateString.split("/").map(Number);
          return new Date(year, month - 1, day);
        };

        const sortedData = data.sort(
          (a, b) => parseDate(a.Date) - parseDate(b.Date)
        );

        if (sortedData.length < 2) {
          return "Insufficient data";
        }

        const latestData = sortedData[sortedData.length - 1];
        const latestDate = parseDate(latestData.Date);
        const startDate = new Date(latestDate);

        switch (timeRange) {
          case "1M":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case "3M":
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case "6M":
            startDate.setMonth(startDate.getMonth() - 6);
            break;
          case "1Y":
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case "3Y":
            startDate.setFullYear(startDate.getFullYear() - 3);
            break;
          case "5Y":
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
          case "ALL":
            startDate.setTime(parseDate(sortedData[0].Date).getTime());
            break;
          case "YTD":
            startDate.setFullYear(startDate.getFullYear(), 0, 1);
            break;
          default:
            return "Invalid time range";
        }

        const startIndex = sortedData.findIndex(
          (d) => parseDate(d.Date) >= startDate
        );
        if (startIndex === -1) return "N/A"; // No data matches the start date

        const startValue = parseFloat(sortedData[startIndex][key]);
        const endValue = parseFloat(latestData[key]);

        if (isNaN(startValue) || isNaN(endValue)) return "N/A";

        // Calculate return based on period
        if (["1Y", "3Y", "5Y", "ALL"].includes(timeRange)) {
          const years =
            timeRange === "ALL"
              ? (latestDate - parseDate(sortedData[startIndex].Date)) /
              (365 * 24 * 60 * 60 * 1000)
              : parseInt(timeRange.slice(0, -1));
          const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
          return cagr.toFixed(2) + "%";
        } else {
          const returns = ((endValue - startValue) / startValue) * 100;
          return returns.toFixed(2) + "%";
        }
      },
    []
  );

  const calculateReturns = (data, key) => {
    if (data.length < 2) return "N/A";
    const startValue = parseFloat(data[0][key]);
    const endValue = parseFloat(data[data.length - 1][key]);
    return (((endValue - startValue) / startValue) * 100).toFixed(2) + "%";
  };

  const strategyReturns = calculateReturns(filteredData, "Total Portfolio NAV");
  const niftyReturns = calculateReturns(filteredData, "Nifty");

  if (isLoading || !filteredData.length) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="w-16 h-16 border-t-4  rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  const chartOptions = getChartOptions(filteredData);
  const top10Drawdowns = calculateTop10Drawdown(filteredData);
  const monthlyPL = calculateMonthlyPL(filteredData);
  const strategyCagr = calculateCAGR(
    filteredData,
    timeRange,
    "Total Portfolio NAV"
  );
  const niftyCagr = calculateCAGR(filteredData, timeRange, "Nifty");

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setActiveButton(range);
    setStartDate("");
    setEndDate("");
    setTriggerFetch((prev) => prev + 1);
  };

  let period;
  if (timeRange === "ALL") {
    period = "3Y";
  } else {
    period = `${timeRange}`;
  }
  let active;
  if (activeTab === "strategy1") {
    active = "scheme1";
  } else if (activeTab === "strategy2") {
    active = "scheme2";
  } else if (activeTab === "momentum") {
    active = "Momentum";
  } else {
    active = "QGF";
  }
  return (
    <div className="p-8 mt-10 max-w-7xl mx-auto minion-pro-font tracking-wide bg-black text-black">
      <h1 className="text-md mb-12">Model Portfolio</h1>

      <div className="mb-12 grid grid-cols-4 gasm:p-4 p-1 max-w-full">
        {["strategy1", "strategy2", "momentum", "qgf"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-lg transition-colors duration-300 ease-in-out
              ${activeTab === tab
                ? "bg-red-600 text-white"
                : "text-black hover:before:bg-red-600  relative h-[50px] overflow-hidden border bg-black px-3 transition-all before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-red-600 before:transition-all before:duration-500 hover:text-white hover:before:left-0 hover:before:w-full"
              }`}
          >
            <span className="relative z-10">
              {tab === "qgf"
                ? "Quant Growth Fund"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 my-10 sm:space-x-4">
        <div className="flex flex-wrap justify-center gap-2">
          {["YTD", "1M", "3M", "6M", "1Y", "3Y", "5Y"].map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              className={`px-3 py-1 text-body ${activeButton === range ? "bg-red-600 text-white" : "bg-gray-200"
                }`}
            >
              {range}
            </button>
          ))}
          <button
            className={`py-2 sm:py-1 px-4 text-xs sm:text-body ${activeButton === "ALL"
              ? "bg-primary-dark text-white bg-red-600"
              : "bg-[#f7f5f5] text-gray-900"
              }`}
            onClick={() => handleTimeRangeChange("ALL")}
          >
            All
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-4">
            <div className="flex flex-col">
              <label
                htmlFor="startDate"
                className="text-body md:hidden block text-gray-600 mb-1"
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#f7f5f5] text-gray-900 text-xs sm:text-body py-2 px-3"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="endDate"
                className="text-body md:hidden block text-gray-600 mb-1"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#f7f5f5] text-gray-900 text-xs sm:text-body py-2 px-3"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-4">
          <div className="mb-4">
            <p className="text-7xl ">{strategyReturns}</p>
            <h2 className="text-lg ">Strategy Returns</h2>
          </div>
          <div>
            <p className="text-lg ">{niftyReturns}</p>
            <h2 className="text-lg ">Nifty Returns</h2>
          </div>
        </div>
        <div className="col-start-10 col-span-3">
          <p className="text-7xl">{strategyCagr}</p>
          <h2 className="text-md text-right mr-6">{period} CAGR</h2>
          <div className="col-start-10 mr-6 mt-4 col-span-3">
            <p className="text-lg text-right">{niftyCagr}</p>
            <h2 className="text-md text-right">{period} Nifty CAGR</h2>
          </div>
        </div>
        <div className="col-span-12">
          <h2 className="text-md font-bold mb-6">Performance Chart</h2>

          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
      </div>
      <div>
        <Holdings strategy={activeTab} />
      </div>
      <div>
        <Top10Drawdown drawdowns={top10Drawdowns} />
      </div>
      <div>
        <MonthlyPLTable data={monthlyPL} />
      </div>
      <div className="bg-gray-100 p-6 sm:p-8 md:p-10 my-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="w-full ">
            <h2 className="text-lg sm:text-md font-bold text-[#151E28] mb-2">
              Holding Distribution
            </h2>
          </div>

          <div className="w-full  bg-black  sm:p-4 p-1 shadow-md">
            <HoldingDistribution activeStrategy={active} />
          </div>
        </div>
      </div>
      <div>
        <PortfolioAllocation />
      </div>
      <div>
        <CompoundedAnnualReturns data={filteredData} />
      </div>
    </div>
  );
};

export default PerformanceAndDrawdownChart;
