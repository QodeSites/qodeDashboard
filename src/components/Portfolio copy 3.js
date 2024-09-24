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
import TrailingReturns from "./TrailingReturn";

const PerformanceAndDrawdownChart = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeRange, setTimeRange] = useState("3Y");
  const [activeButton, setActiveButton] = useState("3Y");
  const [activeTab, setActiveTab] = useState("strategy1");
  const [triggerFetch, setTriggerFetch] = useState(0);
  const { data: chartData, isLoading, error } = useFetchData("/mainData.json");
  const [filteredData, setFilteredData] = useState([]);

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
        name: "Qode Momentum Fund",
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
        name: "Qode Low Volatility Fund",
        description:
          "This strategy invests in the 30 most stable stocks in the market. This strategy outperforms the Index with considerably lower risk.",
      },
    ],
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchStrategyData(
          activeTab,
          timeRange,
          startDate,
          endDate
        );

        const normalizedData = normalizeData(data);
        setFilteredData(normalizedData);
      } catch (error) {
        console.error("Error loading data: ", error);
      }
    };

    loadData();
  }, [activeTab, timeRange, startDate, endDate, triggerFetch]);
  const calculateCAGR = useMemo(
    () =>
      (data, timeRange = "3Y", portfolioType = "total_portfolio_nav") => {
        console.log(data);
        const parseDate = (date) => {
          if (!date) return null; // Handle undefined date
          const [year, month, day] = date.split("-").map(Number);
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

        const startValue = parseFloat(sortedData[startIndex][portfolioType]);
        const endValue = parseFloat(latestData[portfolioType]);

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

  // Usage example

  // normalize data
  const normalizeData = (data) => {
    if (data.length === 0) return [];

    const firstValue = {
      "total_portfolio_nav": data[0]["total_portfolio_nav"],
      nifty: data[0]["nifty"],
    };

    return data.map((item) => ({
      ...item,
      "total_portfolio_nav":
        (item["total_portfolio_nav"] / firstValue["total_portfolio_nav"]) * 100,
      nifty: (item["nifty"] / firstValue["nifty"]) * 100,
    }));
  };


  const calculateReturns = (data, key) => {
    // console.log("datasss", data);
    if (data.length < 2) return "N/A";
    const startValue = parseFloat(data[0][key]);
    const endValue = parseFloat(data[data.length - 1][key]);
    return (((endValue - startValue) / startValue) * 100).toFixed(2) + "%";
  };

  const strategyReturns = calculateReturns(filteredData, "total_portfolio_nav");
  const niftyReturns = calculateReturns(filteredData, "nifty");
  // console.log(filteredData);
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
  console.log("filteredData", filteredData);

  const strategyCagr = calculateCAGR(
    filteredData,
    timeRange,
    "total_portfolio_nav"
  );
  const niftyCagr = calculateCAGR(filteredData, timeRange, "nifty");

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setActiveButton(range);
    setStartDate("");
    setEndDate("");
    setTriggerFetch((prev) => prev + 1);
  };

  let period;
  if (timeRange === "ALL") {
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
    { id: "momentum", name: "Qode Momentum Fund" },
    { id: "lowvol", name: "Qode Low Volatility Fund" },
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
              className={`py-2 sm:py-1 px-4 text-md sm:text-body ${activeButton === "ALL"
                ? "bg-primary-dark text-white bg-red-600"
                : "border  text-gray-900"
                }`}
              onClick={() => handleTimeRangeChange("ALL")}
            >
              All
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
