"use client";
import React, { useState, useMemo, useCallback } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "../app/globals.css";
import { getChartOptions } from "@/app/lib/ChartOptions";
import Button from "./common/Button";
import Heading from "./common/Heading";
import Text from "./common/Text";
import useCustomTimeRange from "@/hooks/useCustomRangeHook";
import useMobileWidth from "@/hooks/useMobileWidth";
import useFetchStrategyData from "@/hooks/useFetchStrategyData";
import useFilteredData from "@/hooks/useFilteredData";
import useReturns from "@/hooks/useReturns";
import TrailingReturns from "./TrailingReturn";

const PerformanceAndDrawdownChart = () => {
  const [activeTab, setActiveTab] = useState("QGF");
  const {
    timeRange,
    startDate,
    endDate,
    activeButton,
    isCustomDateOpen,
    handleCustomDateClick,
    handleTimeRangeChange,
    setCustomDateRange,
  } = useCustomTimeRange();
  const { isMobile } = useMobileWidth();
  const { data, isLoading, error } = useFetchStrategyData(activeTab);


  const strategies = [
    { id: "QGF", name: "Qode Growth Fund" },
    { id: "QVF", name: "Qode Velocity Fund" },
    { id: "QAW", name: "Qode All Weather" },
  ];
  const activeStrategy = strategies.find((strategy) => strategy.id === activeTab);

  const descriptions = {
    QGF: {
      description: "This strategy invests in 30 Quality businesses. (Quality Business - A company that generates a high return on invested capital).",
      principle: "In the long run, the stock price always matches the business performance.",
    },
    QVF: {
      description: "This strategy invests in 30 businesses whose stock price has grown significantly and sells it before they start falling.",
      principle: "The stock price tells the story before the actual story unfolds.",
    },
    QAW: {
      description: "This strategy invests in the 30 most stable stocks in the market. This strategy outperforms the Index with considerably lower risk.",
      principle: "",
    },
  };

  const handleStrategyChange = useCallback((strategyId) => {
    setActiveTab(strategyId);
  }, [setActiveTab]); // Include setActiveTab in the dependency array

  const filteredData = useFilteredData(data, timeRange, startDate, endDate);

  const chartOptions = useMemo(() => {
    if (filteredData.length > 0) {
      return getChartOptions(filteredData, activeTab, isMobile, activeStrategy.name);
    }
    return null;
  }, [filteredData, activeTab, isMobile, activeStrategy]);

  const { strategyCagr, niftyCagr, strategyReturns, niftyReturns } = useReturns(filteredData, timeRange);
  let benchmark
  if (filteredData.length > 0 && filteredData[0].benchmark) {
    benchmark = filteredData[0].benchmark;
  } else {
    // handle the case where benchmark is undefined
    console.error("filteredData[0] or benchmark is undefined");
  }

  const getReturnLabel = useCallback((timeRange) => {
    return ["1M", "6M", "1Y"].includes(timeRange) ? "Return" : "CAGR";
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="w-2 h-2 border-t-4 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const currentStrategy = strategies.find((s) => s.id === activeTab);

  return (
    <div className="sm:p-1 mx-auto tracking-wide bg-black text-white">
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 max-w-full">
        {strategies.map((strategy) => (
          <Button
            key={strategy.id}
            onClick={() => handleStrategyChange(strategy.id)}
            className={`text-sm transition-colors duration-300 ease-in-out
              ${activeTab === strategy.id
                ? "bg-beige text-black"
                : "text-beige hover:before:bg-beige relative h-full overflow-hidden border border-brown bg-black transition-all before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-beige before:transition-all before:duration-500 hover:text-black hover:before:left-0 hover:before:w-full"
              }`}
          >
            <span className="relative text-sm">{strategy.name}</span>
          </Button>
        ))}
      </div>

      <div className="mb-3">
        <Heading className="text-semiheading text-beige font-semiheading">
          {strategies.find((s) => s.id === activeTab).name}
        </Heading>
        <div className="mt-18 text-lightBeige">
          <Text className="text-sm sm:text-body">
            {descriptions[activeTab]?.description}
          </Text>
          {descriptions[activeTab]?.principle && (
            <Text className="text-sm sm:text-body">
              Principle: {descriptions[activeTab].principle}
            </Text>
          )}
        </div>
      </div>

      {data && data.length > 0 && (
        <TrailingReturns
          data={data}
          isLoading={isLoading}
          error={error}
          name={currentStrategy.name}
        />
      )}

      <div className="">
        <div className="grid grid-cols-2 text-beige gap-3">
          <div>
            <h2 className="text-sm sm:text-body text-lightBeige">Absolute Returns</h2>
            <p className="text-subheading font-subheading text-lightBeige mb-18">{parseFloat(strategyReturns).toFixed(1)}%</p>
            <p className="text-sm sm:text-body">{parseFloat(niftyReturns).toFixed(1)}%</p>
            <h2 className="text-sm sm:text-body">{benchmark}</h2>
          </div>
          <div className="text-right">
            <h2 className="text-sm sm:text-body text-lightBeige">
              {timeRange === "ALL" ? "Since Inception" : timeRange} {getReturnLabel(timeRange)}
            </h2>
            <p className="text-subheading font-subheading text-lightBeige mb-18">{parseFloat(strategyCagr).toFixed(1)}%</p>
            <p className="text-sm sm:text-body">{parseFloat(niftyCagr).toFixed(1)}%</p>
            <h2 className="text-sm sm:text-body">{benchmark}</h2>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 mt-5">
          <div className="flex flex-wrap justify-center gap-1">
            {["1M", "6M", "1Y", "3Y", "5Y", "ALL"].map((range) => (
              <Button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`text-sm sm:text-body ${activeButton === range
                  ? "bg-beige text-black"
                  : "border border-beige text-beige hover:bg-beige hover:text-black"
                  }`}
              >
                {range}
              </Button>
            ))}
            <Button
              onClick={handleCustomDateClick}
              className={`relative text-sm sm:text-body ${activeButton === 'Custom' ? "bg-beige text-black" : "border border-beige text-beige hover:bg-beige hover:text-black"}`}
            >
              Custom
            </Button>
          </div>

          {isCustomDateOpen && (
            <div className="relative z-10 w-full sm:w-auto">
              <div className="absolute right-0 left-0 sm:right-2 sm:left-auto sm:top-1 sm:mt-2 p-1 bg-black border border-beige shadow-md mx-auto sm:mx-0 max-w-[300px] sm:max-w-none">
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setCustomDateRange(e.target.value, endDate)}
                    className="w-full sm:w-auto border border-beige bg-black text-white text-sm sm:text-body px-2 py-1 h-[40px]"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setCustomDateRange(startDate, e.target.value)}
                    className="w-full sm:w-auto border border-beige bg-black text-white text-sm sm:text-body px-2 py-1 h-[40px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          {chartOptions && <HighchartsReact highcharts={Highcharts} options={chartOptions} />}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAndDrawdownChart;