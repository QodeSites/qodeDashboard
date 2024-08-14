"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import fetchStrategyData from "@/app/lib/api";
import "../app/globals.css";
import { getChartOptions } from "@/app/lib/ChartOptions";
import TrailingReturns from "./TrailingReturn";

const PerformanceAndDrawdownChart = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeRange, setTimeRange] = useState("3Y");
  const [activeButton, setActiveButton] = useState("3Y");
  const [activeTab, setActiveTab] = useState("QGF");
  const [filteredData, setFilteredData] = useState([]);
  const [chartOptions, setChartOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const strategies = [
    { id: "QGF", name: "Qode Growth Fund" },
    { id: "QMF", name: "Qode Momentum Fund" },
    { id: "LVF", name: "Qode Low Volatility Fund" },
    { id: "SchemeA", name: "Scheme A" },
    { id: "SchemeB", name: "Scheme B" },
  ];

  const descriptions = {
    QGF: "This strategy invests in 30 Quality businesses. (Quality Business - A company that generates a high return on invested capital). Principle - In the long run the stock price always matches the business performance.",
    QMF: "This strategy invests in 30 businesses whose stock price has grown significantly and sells it before they start falling. Principle - The stock price tells the story before the actual story unfolds.",
    LVF: "This strategy invests in the 30 most stable stocks in the market. This strategy outperforms the Index with considerably lower risk.",
    SchemeA: "This Strategy invests 60% of your capital in The Quality Fund and 40% in short futures. The short futures make money when the market falls, reducing the loss when the market crashes. Principle - The less you lose the more you gain in the long term.",
    SchemeB: "This strategy pledges your existing portfolio to get some leverage. We use that leverage for options trading and make additional returns for you. This return is above your existing portfolio return. The maximum loss is -2.6% on the leverage in this strategy.",
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchStrategyData(
        activeTab,
        timeRange,
        startDate,
        endDate
      );
      setData(data);
      updateChartOptions(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error loading data: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, timeRange, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStrategyChange = (strategyId) => {
    setIsLoading(true);
    setActiveTab(strategyId);
  };

  const calculateCAGR = useMemo(
    () =>
      (data, timeRange = "3Y", portfolioType = "total_portfolio_nav") => {
        const parseDate = (dateString) => {
          const [year, month, day] = dateString.split("-").map(Number);
          return new Date(year, month - 1, day);
        };

        const sortedData = data.sort(
          (a, b) => parseDate(a.date) - parseDate(b.date)
        );

        if (sortedData.length < 2) {
          return "Insufficient data";
        }

        const latestData = sortedData[sortedData.length - 1];
        const latestDate = parseDate(latestData.date);
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
            startDate.setTime(parseDate(sortedData[0].date).getTime());
            break;
          case "YTD":
            startDate.setFullYear(startDate.getFullYear(), 0, 1);
            break;
          default:
            return "Invalid time range";
        }

        const startIndex = sortedData.findIndex(
          (d) => parseDate(d.date) >= startDate
        );
        if (startIndex === -1) return "N/A"; // No data matches the start date

        const startValue = parseFloat(sortedData[startIndex][portfolioType]);
        const endValue = parseFloat(latestData[portfolioType]);

        if (isNaN(startValue) || isNaN(endValue)) return "N/A";

        // Calculate return based on period
        if (["1Y", "3Y", "5Y", "ALL"].includes(timeRange)) {
          const years =
            timeRange === "ALL"
              ? (latestDate - parseDate(sortedData[startIndex].date)) /
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
  const updateChartOptions = useCallback((data) => {
    const options = getChartOptions(data, activeTab);
    setChartOptions(options);
  }, [activeTab]);

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
    setActiveButton(range);
    if (range !== "ALL") {
      setStartDate("");
      setEndDate("");
    }
  }, []);

  const strategyCagr = useMemo(
    () => calculateCAGR(filteredData, timeRange, "total_portfolio_nav"),
    [calculateCAGR, filteredData, timeRange]
  );

  const niftyCagr = useMemo(
    () => calculateCAGR(filteredData, timeRange, "nifty"),
    [calculateCAGR, filteredData, timeRange]
  );

  const calculateReturns = useCallback((data, key) => {
    if (data.length < 2) return "N/A";
    const startValue = parseFloat(data[0][key]);
    const endValue = parseFloat(data[data.length - 1][key]);
    return (((endValue - startValue) / startValue) * 100).toFixed(2) + "%";
  }, []);

  const strategyReturns = useMemo(
    () => calculateReturns(filteredData, "total_portfolio_nav"),
    [calculateReturns, filteredData]
  );

  const niftyReturns = useMemo(
    () => calculateReturns(filteredData, "nifty"),
    [calculateReturns, filteredData]
  );

  if (!filteredData.length) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="w-16 h-16 border-t-4 rounded-full animate-spin"></div>
      </div>
    );
  }

  const period = timeRange === "ALL" ? "Since Inception" : timeRange;

  return (
    <div className="p-8 mt-10 mx-auto tracking-wide bg-white text-black">
      <div className="mb-12 grid grid-cols-5 gap-4 max-w-full">
        {strategies.map((strategy) => (
          <button
            key={strategy.id}
            onClick={() => handleStrategyChange(strategy.id)}
            className={`py-3 text-md transition-colors duration-300 ease-in-out
      ${activeTab === strategy.id
                ? "bg-red-600 text-white"
                : "text-black hover:before:bg-red-600 relative h-[50px] overflow-hidden border bg-white px-3 transition-all before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-red-600 before:transition-all before:duration-500 hover:text-white hover:before:left-0 hover:before:w-full"
              }`}
          >
            <span className="relative text-sm sophia-pro-font font-black z-10">{strategy.name}</span>
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-3xl sophia-pro-font font-black">{strategies.find(s => s.id === activeTab).name}</h1>
        <div className="mt-5">
          <p className="text-md">{descriptions[activeTab]}</p>
        </div>
      </div>

      <div className="mt-20 mb-10">
        <TrailingReturns data={data} />
      </div>

      <div className="border p-10">
        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-md">Absolute Returns</h2>
            <p className="text-3xl sophia-pro-font">{strategyReturns}</p>
            <p className="text-md sophia-pro-font">{niftyReturns}</p>
            <h2 className="text-md">Nifty 50</h2>
          </div>
          <div className="text-right">
            <h2 className="text-md">{period} CAGR</h2>
            <p className="text-3xl sophia-pro-font">{strategyCagr}</p>
            <p className="text-md sophia-pro-font">{niftyCagr}</p>
            <h2 className="text-md">Nifty 50</h2>
          </div>
        </div>

        {/* Time range buttons */}
        <div className="flex justify-between h-20 items-center gap-2 my-10">
          <div className="flex flex-wrap justify-center gap-2 ">
            {["YTD", "1M", "3M", "6M", "1Y", "3Y", "5Y", "ALL"].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 text-sm ${activeButton === range ? "bg-red-600 text-white" : "border"
                  }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="flex justify-center gap-2 ">
            <input
              type="date"
              onChange={(e) => setStartDate(e.target.value)}
              className="border text-gray-900 text-sm py-2 px-3"
            />
            <input
              type="date"
              onChange={(e) => setEndDate(e.target.value)}
              className="border text-gray-900 text-sm py-2 px-3"
            />
          </div>
        </div>

        {/* Chart */}
        <div className="w-full">
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
      </div>
    </div >
  );
};

export default PerformanceAndDrawdownChart;