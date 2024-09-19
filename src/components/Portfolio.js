"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import fetchStrategyData from "@/app/lib/api";
import "../app/globals.css";
import { getChartOptions } from "@/app/lib/ChartOptions";
import TrailingReturns from "./TrailingReturn";
import Button from "./common/Button";
import Heading from "./common/Heading";
import Text from "./common/Text";

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
    QGF: {
      description: "This strategy invests in 30 Quality businesses. (Quality Business - A company that generates a high return on invested capital).",
      principle: "In the long run, the stock price always matches the business performance.",
    },
    QMF: {
      description: "This strategy invests in 30 businesses whose stock price has grown significantly and sells it before they start falling.",
      principle: "The stock price tells the story before the actual story unfolds.",
    },
    LVF: {
      description: "This strategy invests in the 30 most stable stocks in the market. This strategy outperforms the Index with considerably lower risk.",
      principle: "",
    },
    SchemeA: {
      description: "This Strategy invests 60% of your capital in The Quality Fund and 40% in short futures. The short futures make money when the market falls, reducing the loss when the market crashes.",
      principle: "The less you lose, the more you gain in the long term.",
    },
    SchemeB: {
      description: "This strategy pledges your existing portfolio to get some leverage. We use that leverage for options trading and make additional returns for you. This return is above your existing portfolio return.",
    },
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
  }, [loadData, timeRange]);



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

  useEffect(() => {
    if (data.length > 0) {
      updateChartOptions(data);
    }
  }, [data, updateChartOptions]);

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
    setActiveButton(range);
    if (range !== "ALL") {
      setStartDate("");
      setEndDate("");
    }
    // Assuming you have access to the current data
    // If not, you might need to fetch new data based on the new range
    updateChartOptions(currentData);
  }, [updateChartOptions]);

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
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="w-2 h-2 border-t-4 rounded-full animate-spin"></div>
      </div>
    );
  }

  const period = timeRange === "ALL" ? "Since Inception" : timeRange;

  return (
    <div className="p-1 mx-auto tracking-wide bg-black text-white">
      <div className="mb-5 grid grid-cols-5 gap-3 max-w-full">
        {strategies.map((strategy) => (
          <Button
            key={strategy.id}
            onClick={() => handleStrategyChange(strategy.id)}
            className={`text-body transition-colors duration-300 ease-in-out
              ${activeTab === strategy.id
                ? "bg-beige text-black"
                : "text-beige hover:before:bg-beige relative h-full overflow-hidden border border-brown bg-black transition-all before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-beige before:transition-all before:duration-500 hover:text-black hover:before:left-0 hover:before:w-full"
              }`}
          >
            <span className="relative text-body ">{strategy.name}</span>
          </Button>
        ))}
      </div>

      <div className="mb-3 border border-brown p-4">
        <Heading className="text-semiheading text-beige font-semiheading">
          {strategies.find((s) => s.id === activeTab).name}
        </Heading>
        <div className="mt-18 text-lightBeige">
          {/* Main Description */}
          <Text className="text-body ">
            {descriptions[activeTab]?.description}
          </Text>

          {/* Principle */}
          {descriptions[activeTab]?.principle && (
            <Text className="text-body  ">
              Principle: {descriptions[activeTab].principle}
            </Text>
          )}
        </div>
      </div>


      <div className=" mb-4">
        <TrailingReturns
          data={data}
          strategyName={strategies.find((s) => s.id === activeTab).name}
        />
      </div>

      <div className="border p-4  border-brown">
        {/* Performance metrics */}
        <div className="grid grid-cols-2 text-beige gap-3">
          <div>
            <h2 className="text-body text-lightBeige">Absolute Returns</h2>
            <p className="text-subheading font-subheading text-lightBeige mb-18">{strategyReturns}</p>
            <p className="text-body">{niftyReturns}</p>
            <h2 className="text-body">Nifty 50</h2>
          </div>
          <div className="text-right">
            <h2 className="text-body text-lightBeige">{period} CAGR</h2>
            <p className="text-subheading font-subheading text-lightBeige mb-18">{strategyCagr}</p>
            <p className="text-body">{niftyCagr}</p>
            <h2 className="text-body">Nifty 50</h2>
          </div>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-2 mt-5">
          <div className="flex flex-wrap justify-center gap-1">
            {["1M", "6M", "1Y", "3Y", "5Y", "ALL"].map((range) => (
              <Button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`text-body ${activeButton === range
                  ? "bg-beige text-black"
                  : "border border-beige text-beige hover:bg-beige hover:text-black"
                  }`}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Adjusted date input */}
          <input
            type="date"
            placeholder="DD/MM/YYYY"
            onChange={(e) => setStartDate(e.target.value)}
            className="text-beige border border-beige focus:ring-beige  bg-black text-body px-2 py-1 h-[54px] z-10"
          />
        </div>

        {/* Chart */}
        <div className="mt-4">
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
      </div>
    </div>
  );


};

export default PerformanceAndDrawdownChart;