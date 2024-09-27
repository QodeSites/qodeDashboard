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
  const [isMobile, setIsMobile] = useState(false);
  const [fullData, setFullData] = useState([])
  const [activeTab, setActiveTab] = useState("QGF");
  const [filteredData, setFilteredData] = useState([]);
  const [chartOptions, setChartOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDateInputs, setShowDateInputs] = useState(false); // To toggle the date inputs visibility
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [data, setData] = useState([]);
  const strategies = [
    { id: "QGF", name: "Qode Growth Fund" },
    { id: "QMF", name: "Qode Velocity Fund" },
    { id: "LVF", name: "Qode All Weather" },
    // { id: "SchemeA", name: "Scheme A" },
    // { id: "SchemeB", name: "Scheme B" },
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


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);




  const handleStrategyChange = (strategyId) => {
    setIsLoading(true);
    setActiveTab(strategyId);
  };

  const calculateCAGR = useCallback((data, timeRange, portfolioType = "total_portfolio_nav") => {
    const parseDate = (dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const sortedData = data.sort((a, b) => parseDate(a.date) - parseDate(b.date));

    if (sortedData.length < 2) {
      return "Insufficient data";
    }

    const startValue = parseFloat(sortedData[0][portfolioType]);
    const endValue = parseFloat(sortedData[sortedData.length - 1][portfolioType]);
    const startDate = parseDate(sortedData[0].date);
    const endDate = parseDate(sortedData[sortedData.length - 1].date);

    if (isNaN(startValue) || isNaN(endValue)) return "N/A";

    const yearsDiff = (endDate - startDate) / (365 * 24 * 60 * 60 * 1000);

    if (["3Y", "5Y", "ALL", "Custom"].includes(timeRange)) {
      const cagr = (Math.pow(endValue / startValue, 1 / yearsDiff) - 1) * 100;
      return cagr.toFixed(2) + "%";
    } else {
      const returns = ((endValue - startValue) / startValue) * 100;
      return returns.toFixed(2) + "%";
    }
  }, []);



  const updateChartOptions = useCallback((data) => {
    const options = getChartOptions(data, activeTab, isMobile);
    setChartOptions(options);
  }, [activeTab]);


  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const fullStrategyData = await fetchStrategyData(activeTab, "ALL");
      setFullData(fullStrategyData);
      if (fullStrategyData.length > 0) {
        const sortedDates = fullStrategyData.map(item => item.date).sort();
        setMinDate(sortedDates[0]);
        setMaxDate(sortedDates[sortedDates.length - 1]);
      }

      let fetchedData;
      if (timeRange === "Custom" && startDate && endDate) {
        fetchedData = await fetchStrategyData(activeTab, "Custom", startDate, endDate);
      } else {
        fetchedData = await fetchStrategyData(activeTab, timeRange);
      }
      setData(fetchedData);
      updateChartOptions(fetchedData);
      setFilteredData(fetchedData);
    } catch (error) {
      console.error("Error loading data: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, timeRange, startDate, endDate, updateChartOptions]);


  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
    setActiveButton(range);
    if (range !== "Custom") {
      setStartDate("");
      setEndDate("");
    }
    setIsCustomDateOpen(false);

    // Trigger data reload
    loadData();
  }, [loadData]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const strategyCagr = useMemo(
    () => calculateCAGR(filteredData, timeRange, "total_portfolio_nav"),
    [calculateCAGR, filteredData, timeRange]
  );

  const niftyCagr = useMemo(
    () => calculateCAGR(filteredData, timeRange, "nifty"),
    [calculateCAGR, filteredData, timeRange]
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check mobile status on first render
    if (typeof window !== "undefined") {
      handleResize(); // Initial check
      window.addEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getReturnLabel = useCallback((timeRange) => {
    if (["1M", "6M", "1Y"].includes(timeRange)) {
      return "Return";
    } else {
      return "CAGR";
    }
  }, []);

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

  const handleCustomDateClick = () => {
    setIsCustomDateOpen(!isCustomDateOpen);
    setTimeRange("Custom");
    setActiveButton("Custom");
  };


  if (!filteredData.length) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="w-2 h-2 border-t-4 rounded-full animate-spin"></div>
      </div>
    );
  }

  const period = timeRange === "ALL" ? "Since Inception" : timeRange;

  const handleDateChange = (dateType, value) => {
    if (dateType === "start") {
      setStartDate(value);
      // Ensure end date is not before start date
      if (endDate && value > endDate) {
        setEndDate(value);
      }
    } else {
      setEndDate(value);
      // Ensure start date is not after end date
      if (startDate && value < startDate) {
        setStartDate(value);
      }
    }
    setTimeRange("Custom");
    setActiveButton("Custom");
  };

  return (
    <div className="sm:p-1 mx-auto tracking-wide bg-black text-white">
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 max-w-full">
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
            <span className="relative text-body">{strategy.name}</span>
          </Button>
        ))}
      </div>


      <div className="mb-3">
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
          data={fullData}
          strategyName={strategies.find((s) => s.id === activeTab).name}
        />
      </div>

      <div className=" ">
        {/* Performance metrics */}
        <div className="grid grid-cols-2 text-beige gap-3">
          <div>
            <h2 className="text-body text-lightBeige">Absolute Returns</h2>
            <p className="text-subheading font-subheading text-lightBeige mb-18">{strategyReturns}</p>
            <p className="text-body">{niftyReturns}</p>
            <h2 className="text-body">Nifty 50</h2>
          </div>
          <div className="text-right">
            <h2 className="text-body text-lightBeige">
              {timeRange === "ALL" ? "Since Inception" : timeRange} {getReturnLabel(timeRange)}
            </h2>
            <p className="text-subheading font-subheading text-lightBeige mb-18">{strategyCagr}</p>
            <p className="text-body">{niftyCagr}</p>
            <h2 className="text-body">Nifty 50</h2>
          </div>
        </div>

        {/* Time range buttons */}
        <div className="flex flex-col md:flex-row items-center gap-2 mt-5">
          {/* Time Range Buttons */}
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
            <Button
              onClick={handleCustomDateClick}
              className={`relative text-body ${activeButton === 'Custom' ? "bg-beige text-black" : "border border-beige text-beige hover:bg-beige hover:text-black"}`}
            >
              Custom
            </Button>
          </div>

          {/* Conditionally show date inputs when "Custom" is selected */}
          {isCustomDateOpen && (
            <div className="relative z-10   w-full sm:w-auto">
              <div className="absolute right-0 left-0 sm:right-2 sm:left-auto sm:top-1 sm:mt-2 p-1 bg-black border border-beige shadow-md mx-auto sm:mx-0 max-w-[300px] sm:max-w-none">
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
                  <input
                    type="date"
                    value={startDate}
                    min={minDate}
                    placeholder="DD/MM/YYYY"
                    max={maxDate}
                    onChange={(e) => handleDateChange("start", e.target.value)}
                    className="w-full sm:w-auto border border-beige bg-black text-white text-body px-2 py-1 h-[40px]"
                  />
                  <input
                    type="date"
                    value={endDate}
                    min={minDate}
                    placeholder="DD/MM/YYYY"
                    max={maxDate}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                    className="w-full sm:w-auto border border-beige bg-black text-white text-body px-2 py-1 h-[40px]"
                  />
                </div>
              </div>
            </div>
          )}

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