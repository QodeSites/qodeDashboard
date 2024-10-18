"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import fetchStrategyData from "@/app/lib/api";
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
import TrailingReturns from "./TrailingReturn";

const PerformanceAndDrawdownChart = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeRange, setTimeRange] = useState("3Y");
  const [activeButton, setActiveButton] = useState("3Y");
  const [activeTab, setActiveTab] = useState("strategy1");
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [strategy, setStrategy] = useState('QGF');
  const [chartOptions, setChartOptions] = useState(null);

  const descriptions = {
    strategy1: [
      {
        name: "Scheme A",
        description:
          "This Strategy invests 60% of your capital in The Quality Fund and 40% in short futures. The short futures make money when the market falls, reducing the loss when the market crashes.Principle - The less you lose the more you gain in the long term.",
      },
    ],
    strategy2: [
      {
        name: "Scheme B",
        description:
          "This strategy pledges your existing portfolio to get some leverage. We use that leverage for options trading and make additional returns for you. This return is above your existing portfolio return. The maximum loss is -2.6% on the leverage in this strategy.",
      },
    ],
    momentum: [
      {
        name: "Qode Velocity Fund",
        description:
          "This strategy invests in 30 businesses whose stock price has grown significantly and sells it before they start falling. Principle - The stock price tells the story before the actual story unfolds.",
      },
    ],
    qgf: [
      {
        name: "Qode Growth Fund",
        description:
          "This strategy invests in 30 Quality businesses. (Quality Business - A company that generates a high return on invested capital). Principle - In the long run the stock price always matches the business performance.",
      },
    ],
    lowvol: [
      {
        name: "Qode All Weather",
        description:
          "This strategy invests in the 30 most stable stocks in the market. This strategy outperforms the Index with considerably lower risk.",
      },
    ],
  };

  const loadData = useCallback(async () => {
    try {
      const data = await fetchStrategyData(
        strategy,
        timeRange,
        startDate,
        endDate
      );
      const chartData = prepareChartData(data, strategy);
      updateChartOptions(chartData);
      setFilteredData(data);
    } catch (error) {
      console.error("Error loading data: ", error);
    }
  }, [strategy, timeRange, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);



  const calculateCAGR = useCallback(
    (data, timeRange = "3Y", portfolioType = "total_portfolio_nav") => {
      const parseDate = (dateString) => new Date(dateString);

      const sortedData = [...data].sort(
        (a, b) => parseDate(a.date) - parseDate(b.date)
      );

      if (sortedData.length < 2) return "Loading...";

      const latestData = sortedData[sortedData.length - 1];
      const latestDate = parseDate(latestData.date);
      let startDate = new Date(latestDate);

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
        case "Inception":
          startDate = parseDate(sortedData[0].date);
          break;
        case "YTD":
          startDate.setMonth(0, 1);
          break;
        default:
          return "Invalid time range";
      }

      const startIndex = sortedData.findIndex(
        (d) => parseDate(d.date) >= startDate
      );
      if (startIndex === -1) return "0";

      const startValue = parseFloat(sortedData[startIndex][portfolioType]);
      const endValue = parseFloat(latestData[portfolioType]);

      if (isNaN(startValue) || isNaN(endValue)) return "0";

      const years =
        (latestDate - parseDate(sortedData[startIndex].date)) /
        (365 * 24 * 60 * 60 * 1000);
      const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;

      return cagr.toFixed(2) + "%";
    },
    []
  );
  const prepareChartData = useCallback((data, strategy) => {
    const strategyKey = "total_portfolio_nav";
    const initialStrategyValue = parseFloat(data[0][strategyKey]);
    const initialNiftyValue = parseFloat(
      data[0]["Nifty 50"] || data[0]["benchmark_values"]
    );
    return data.map((item) => ({
      date: item.date,
      strategyValue:
        (parseFloat(item[strategyKey]) / initialStrategyValue) * 100,
      niftyValue:
        (parseFloat(item["Nifty 50"] || item["benchmark_values"]) / initialNiftyValue) *
        100,
    }));
  }, []);

  const strategyCagr = useMemo(
    () => calculateCAGR(filteredData, timeRange, "total_portfolio_nav"),
    [calculateCAGR, filteredData, timeRange]
  );
  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
    setActiveButton(range);
    if (range !== "Inception") {
      setStartDate(null);
      setEndDate(null);
    }
  }, []);
  const updateChartOptions = (data) => {
    const dates = data.map((item) => item.date);
    const strategyValues = data.map((item) => Math.trunc(item.strategyValue));
    const niftyValues = data.map((item) => Math.trunc(item.niftyValue));

    let maxStrategyValue = 0;
    const drawdown = data.map((item) => {
      const value = item.strategyValue;
      const dd =
        maxStrategyValue > value ? (value / maxStrategyValue - 1) * 100 : 0;
      maxStrategyValue = Math.max(maxStrategyValue, value);
      return Math.trunc(dd);
    });

    const options = {
      title: "",
      xAxis: {
        categories: dates,
        labels: {
          formatter: function () {
            const date = new Date(this.value);
            return `${date.toLocaleString("default", {
              month: "short",
            })} ${date.getFullYear()}`;
          },
        },
        tickPositions: [0, Math.floor(dates.length / 2), dates.length - 1],
      },
      yAxis: [
        {
          title: { text: "" },
          height: "100%",
        },
      ],
      series: [
        {
          name: strategy,
          data: strategyValues,
          color: "#9ddd55",
          lineWidth: 1,
          marker: { enabled: false },
          type: "line",
        },
        {
          name: "Nifty 50",
          data: niftyValues,
          color: "#000",
          lineWidth: 2,
          marker: { enabled: false },
          type: "line",
        },
      ],
      chart: {
        height: 520,
        backgroundColor: "none",
        zoomType: "x",
      },
      tooltip: { shared: true },
      legend: { enabled: false },
      credits: { enabled: false },
      exporting: { enabled: true },
    };

    setChartOptions(options);
  };

  const calculateReturns = (data, key) => {
    // console.log("datasss", data);
    if (data.length < 2) return "0";
    const startValue = parseFloat(data[0][key]);
    const endValue = parseFloat(data[data.length - 1][key]);
    return (((endValue - startValue) / startValue) * 100).toFixed(2) + "%";
  };


  const strategyReturns = calculateReturns(filteredData, "total_portfolio_nav");
  const niftyReturns = calculateReturns(filteredData, "benchmark_values");
  if (!filteredData.length) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="w-16 h-16 border-t-4  rounded-full animate-spin"></div>
      </div>
    );
  }



  const niftyCagr = calculateCAGR(filteredData, timeRange, "benchmark_values");





  let period;
  if (timeRange === "Inception") {
    period = "Since Inception";
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

  const strategyDescription = descriptions[activeTab][0].description;
  const strategyName = descriptions[activeTab][0].name;
  let strategies = [
    { id: "qgf", name: "Qode Growth Fund" },
    { id: "momentum", name: "Qode Velocity Fund" },
    { id: "lowvol", name: "Qode All Weather" },
    { id: "strategy1", name: "Scheme A" },
    { id: "strategy2", name: "Scheme B" },
  ];

  return (
    <div className="p-8 mt-10  mx-auto  tracking-wide bg-black text-black">
      <div className="mb-12 grid grid-cols-5 gasm:p-4 p-1 max-w-full">
        {strategies.map((strategy) => (
          <button
            key={strategy.id}
            onClick={() => setActiveTab(strategy.id)}
            className={`py-3 text-md transition-colors duration-300 ease-in-out
        ${activeTab === strategy.id
                ? "bg-red-600 text-white"
                : "text-black hover:before:bg-red-600  relative h-[50px] overflow-hidden border bg-black px-3 transition-all before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-red-600 before:transition-all before:duration-500 hover:text-white hover:before:left-0 hover:before:w-full"
              }`}
          >
            <span className="relative text-body sophia-pro-font font-black z-10">{strategy.name}</span>
          </button>
        ))}
      </div>
      <div className="">
        <h1 className="text-3xl sophia-pro-font font-black">{strategyName}</h1>
        <div className=" mt-5">
          <p className="text-md">{strategyDescription}</p>
        </div>
      </div>
      <div className="mt-20 mb-10">
        <TrailingReturns strategy={activeTab} />
      </div>
      <div className="border  p-10">

        <div className="grid">
          <div className="col-span-4">
            <div className="mb-4">
              <h2 className="text-md ">Absolute Returns</h2>
              <p className="text-3xl sophia-pro-font ">{strategyReturns}</p>
            </div>
            <div>
              <p className="text-md sophia-pro-font ">{niftyReturns}</p>
              <h2 className="text-md ">nifty50</h2>
            </div>
          </div>
          <div className="col-start-10 col-span-5 text-right">
            <h2 className="text-md ">{period} CAGR</h2>
            <p className="text-3xl sophia-pro-font ">{strategyCagr}</p>

            <div className="col-start-10  mt-4 col-span-3">
              <p className="text-md sophia-pro-font ">{niftyCagr}</p>
              <h2 className="text-md ">nifty50</h2>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-4 sophia-pro-font sm:flex-row sm:space-y-0 my-10 sm:space-x-4">
          <div className="flex flex-wrap justify-center gap-2">
            {["YTD", "1M", "3M", "6M", "1Y", "3Y", "5Y"].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 text-body ${activeButton === range
                  ? "bg-red-600 text-white"
                  : "border "
                  }`}
              >
                {range}
              </button>
            ))}
            <button
              className={`py-2 sm:py-1 px-4 text-md sm:text-body ${activeButton === "Inception"
                ? "bg-primary-dark text-white bg-red-600"
                : "border  text-gray-900"
                }`}
              onClick={() => handleTimeRangeChange("Inception")}
            >
              Inception
            </button>
          </div>


          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border  text-gray-900 text-xs sm:text-body py-2 px-3"
                />
                <input
                  type="date"
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border  text-gray-900 text-xs sm:text-body py-2 px-3"
                />
              </div>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-12 gap-12">

          <div className="col-span-12">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* <div>
        <Holdings strategy={activeTab} />
      </div> */}
      <div>
        {/* <Top10Drawdown drawdowns={top10Drawdowns} /> */}
      </div>
      <div>
        {/* <MonthlyPLTable data={monthlyPL} /> */}
      </div>
      {/* {(activeTab === "momentum" || activeTab === "qgf") && (
        <div className="border  p-10 my-10">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="w-full">
              <h2 className="text-3xl font-black sophia-pro-font text-black mb-2">
                Holding Distribution
              </h2>
            </div>
            <div className="w-full bg-[#fafafa] mt-16">
              <HoldingDistribution activeStrategy={active} />
            </div>
          </div>
        </div>
      )} */}

      {/* <div>
        <PortfolioAllocation />
      </div>
      <div>
        <CompoundedAnnualReturns data={filteredData} />
      </div> */}
    </div>
  );
};

export default PerformanceAndDrawdownChart;
