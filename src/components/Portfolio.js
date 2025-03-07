// components/PerformanceAndDrawdownChart.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Highcharts from "highcharts";
import Button from "./common/Button";
import Text from "./common/Text";
import useCustomTimeRange from "@/hooks/useCustomRangeHook";
import useMobileWidth from "@/hooks/useMobileWidth";
import useFetchStrategyData from "@/hooks/useFetchStrategyData";
import useFilteredData from "@/hooks/useFilteredData";
import Heading from "./common/Heading";
import { useTheme } from "@/components/ThemeContext";
import useFetchBenchmarkData from "@/hooks/useFetchBenchmarkData";
import { getChartOptions } from "@/app/lib/ChartOptions";
import YearlyMonthlyPLTable from "./MonthlyPLTablePms";
import { useSession } from "next-auth/react";
import { ChevronDownIcon } from "lucide-react";

// Dynamically import components
const TrailingReturns = dynamic(() => import("./TrailingReturn"), {
  ssr: false,
});
const PortfolioDetails = dynamic(() => import("./PortfolioDetails"), {
  ssr: false,
});
const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-200 animate-pulse" />,
});

// Helper: extract strategy from nuvama code (e.g. "QFH0006" → "QFH")
const extractStrategy = (nuvamaCode) => nuvamaCode.replace(/\d+/g, "");

// Custom parser to interpret a date string (e.g. "2025-02-18 00:00:00")
// as a local date (ignoring any potential UTC misinterpretation).
const parseLocalDate = (dateString) => {
  const [datePart] = dateString.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
};

const PerformanceAndDrawdownChart = () => {
  // Get session info (adjust if using another auth mechanism)
  const { data: session } = useSession();
  // Assume session.user.id holds the logged-in user id
  const sessionUserId = Number(session?.user?.id);

  const isAdminUser = sessionUserId === 9 || sessionUserId === 14;

  let clientName =
    session?.user?.managed_client_names?.[0] ||
    session?.user?.usernames?.[0] ||
    "Client";

  if (sessionUserId === 9) {
    clientName = "Hiren Zaverchand Gala";
  }
  // activeTab is the strategy being viewed;
  // selectedNuvama is the investor’s own code.
  const [activeTab, setActiveTab] = useState("TOTAL");

  useEffect(() => {
    // This code will only run on the client side
    Highcharts.setOptions({
      time: {
        useUTC: false
      }
    });
  }, []);

  const {
    data,
    isLoading,
    error,
    selectedNuvama,
    setSelectedNuvama,
    viewMode,
    handleViewModeChange,
  } = useFetchStrategyData();

  const { timeRange } = useCustomTimeRange();
  const { isMobile } = useMobileWidth();
  const { theme } = useTheme();
  const chartRef = useRef(null);

  // For non-admin users, derive invested strategies from data.nuvama_codes.
  const investedStrategies = useMemo(() => {
    if (!data?.nuvama_codes) return [];
    return data.nuvama_codes.map((code) => extractStrategy(code));
  }, [data?.nuvama_codes]);

  // Helper: for a given strategy, find the full nuvama code.
  const getNuvamaCodeForStrategy = (strategy) => {
    return data?.nuvama_codes?.find((code) => extractStrategy(code) === strategy);
  };

  // On initial load, set activeTab based on the investor’s code.
  useEffect(() => {
    if (data?.nuvama_codes?.length > 0 && !activeTab) {
      if (isAdminUser) {
        const initialCode = selectedNuvama || data.nuvama_codes[0];
        setSelectedNuvama(initialCode);
        setActiveTab(extractStrategy(initialCode));
      } else {
        // For non-admin users, default to the first invested strategy.
        const defaultStrategy = investedStrategies[0] || "TOTAL";
        setActiveTab(defaultStrategy);
        // Also update the selected nuvama code automatically.
        const code = getNuvamaCodeForStrategy(defaultStrategy);
        setSelectedNuvama(code);
      }
    }
  }, [
    data?.nuvama_codes,
    activeTab,
    selectedNuvama,
    isAdminUser,
    investedStrategies,
    setSelectedNuvama,
  ]);

  // When the inline select changes, update both selectedNuvama and activeTab.
  const handleSelectChange = (e) => {
    const code = e.target.value;
    setSelectedNuvama(code);
    setActiveTab(extractStrategy(code));
  };

  // Use activeTab for fetching the model data of the active strategy.
  const benchmarkIndices = useMemo(() => (activeTab ? [activeTab] : []), [activeTab]);

  // Sort the dailyNAV data.
  const sortedDailyNAV = useMemo(() => {
    if (!data?.dailyNAV || data.dailyNAV.length === 0) return [];
    return data.dailyNAV.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  const startDate = useMemo(
    () => (sortedDailyNAV.length ? sortedDailyNAV[0].date : null),
    [sortedDailyNAV]
  );
  const endDate = useMemo(
    () => (sortedDailyNAV.length ? sortedDailyNAV[sortedDailyNAV.length - 1].date : null),
    [sortedDailyNAV]
  );

  //console.log("sortedDailyNAV", sortedDailyNAV);
  //console.log("startDate", startDate);
  //console.log("endDate", endDate);

  // Fetch benchmark/model data for the active strategy.
  const {
    benchmarkData,
    isLoading: isBenchmarkLoading,
    error: benchmarkError,
  } = useFetchBenchmarkData(
    benchmarkIndices,
    startDate && endDate ? startDate : null,
    startDate && endDate ? endDate : null
  );
  // *** New: Fetch BSE500 data for comparison ***
  const {
    benchmarkData: bse500Data,
    isLoading: isBse500Loading,
    error: bse500Error,
  } = useFetchBenchmarkData(
    ["BSE500"],
    startDate && endDate ? startDate : null,
    startDate && endDate ? endDate : null
  );


  //console.log("benchmarkData", bse500Data);

  // Process raw benchmark data for the active strategy.
  const rawBenchmarkData = useMemo(() => {
    if (!benchmarkData) return [];
    const arr = Array.isArray(benchmarkData) ? benchmarkData : Object.values(benchmarkData);
    return arr.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [benchmarkData]);

  // Process BSE500 data.
  const bse500Series = useMemo(() => {
    if (!bse500Data) return null;
    const arr = Array.isArray(bse500Data) ? bse500Data : Object.values(bse500Data);
    if (arr.length === 0) return null;
    const sorted = arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstNav = parseFloat(sorted[0].nav);
    let previousNav = firstNav;
    const normalized = sorted.map((item) => {
      // Use the custom parser to get local timestamps.
      const timestamp = parseLocalDate(item.date);
      let nav = parseFloat(item.nav);
      if (isNaN(nav)) {
        nav = previousNav;
      } else {
        previousNav = nav;
      }
      return [timestamp, (nav / firstNav) * 100];
    });
    return {
      name: "BSE500",
      data: normalized,
      type: "line",
      color: "#000000", // Black color for BSE500
      dashStyle: "Solid",
      marker: { enabled: false },
      tooltip: { valueDecimals: 2, valueSuffix: " %" },
      zIndex: 1,
    };
  }, [bse500Data]);

  // Process the active strategy’s benchmark data into a normalized series.
  const benchmarkSeries = useMemo(() => {
    if (!rawBenchmarkData || rawBenchmarkData.length === 0) {
      return [];
    }
    const firstNav = parseFloat(rawBenchmarkData[0].nav);
    let previousNav = firstNav;
    const normalized = rawBenchmarkData.map((item) => {
      // IMPORTANT: Use parseLocalDate here as well so the timestamps match
      const timestamp = parseLocalDate(item.date);
      let currentNav = parseFloat(item.nav);
      if (isNaN(currentNav)) {
        currentNav = previousNav;
      } else {
        previousNav = currentNav;
      }
      return [timestamp, (currentNav / firstNav) * 100];
    });
    return [
      {
        name: activeTab,
        data: normalized,
        type: "line",
        color: "#945c39",
        dashStyle: "line",
        marker: { enabled: false },
        tooltip: { valueDecimals: 2, valueSuffix: " %" },
        zIndex: 1,
      },
    ];
  }, [rawBenchmarkData, activeTab]);

  // Combine the active strategy’s benchmark series with BSE500.
  const combinedBenchmarkSeries = useMemo(() => {
    const arr = [];
    if (benchmarkSeries && benchmarkSeries.length > 0) arr.push(...benchmarkSeries);
    if (bse500Series) arr.push(bse500Series);
    return arr;
  }, [benchmarkSeries, bse500Series]);

  // Filter client data based on view mode and time range.
  const filteredData = useFilteredData(
    viewMode === "individual" ? data?.dailyNAV || [] : [],
    timeRange,
    startDate,
    endDate
  );

  // Determine if the investor is invested in the active strategy.
  const isInvestedInStrategy = useMemo(() => {
    if (activeTab === "TOTAL") return false;
    if (isAdminUser) {
      return selectedNuvama ? extractStrategy(selectedNuvama) === activeTab : false;
    } else {
      return investedStrategies.includes(activeTab);
    }
  }, [selectedNuvama, activeTab, isAdminUser, investedStrategies]);

  // Use client data if invested; otherwise, use an empty array.
  const adjustedFilteredData = useMemo(
    () => (isInvestedInStrategy ? filteredData : []),
    [isInvestedInStrategy, filteredData]
  );

  // Get the latest NAV data.
  const latestData = useMemo(() => {
    if (!data?.dailyNAV || data.dailyNAV.length === 0) return null;
    return data.dailyNAV[data.dailyNAV.length - 1];
  }, [data]);

  // Create chart options.
  const chartOptions = useMemo(() => {
    if (typeof window === "undefined" || !activeTab) return {};
    let chartData = [];
    if (isInvestedInStrategy) {
      chartData = adjustedFilteredData;
      //console.log("chartData", chartData);
    } else {
      chartData = rawBenchmarkData;
    }
    if (!chartData || chartData.length === 0) return {};
    return getChartOptions(
      chartData,
      activeTab,
      isMobile,
      "Portfolio",
      theme,
      combinedBenchmarkSeries,
      isInvestedInStrategy
    );
  }, [
    adjustedFilteredData,
    activeTab,
    isMobile,
    theme,
    combinedBenchmarkSeries,
    isInvestedInStrategy,
    rawBenchmarkData,
  ]);

  // Donut chart options for cumulative view.
  const donutChartOptions = useMemo(() => {
    if (!data.portfoliosWithRatios || data.portfoliosWithRatios.length === 0)
      return null;
    const seriesData = data.portfoliosWithRatios.map((portfolio) => ({
      name: `${portfolio.name} (${portfolio.nuvama_code})`,
      y: portfolio.ratio * 100,
      portfolioValue: portfolio.portfolio_value,
    }));
    return {
      chart: {
        type: "pie",
        backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF",
      },
      title: {
        text: "Portfolio Allocation",
        style: { fontSize: isMobile ? "16px" : "20px" },
      },
      tooltip: {
        formatter: function () {
          const formattedValue = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
          }).format(this.point.portfolioValue);
          return `
            <span style="color:${this.color}">\u25CF</span> 
            <b>${this.point.name}</b>: ${this.percentage.toFixed(1)}%<br/>
            <b>Value:</b> ${formattedValue}
          `;
        },
      },
      accessibility: { point: { valueSuffix: "%" } },
      plotOptions: {
        pie: {
          innerSize: "50%",
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.percentage:.1f} %",
            style: { fontSize: isMobile ? "10px" : "12px" },
          },
        },
      },
      series: [
        {
          name: "Allocation",
          colorByPoint: true,
          data: seriesData,
        },
      ],
      colors: [
        "#7cb5ec",
        "#434348",
        "#90ed7d",
        "#f7a35c",
        "#8085e9",
        "#f15c80",
        "#e4d354",
        "#2b908f",
        "#f45b5b",
        "#91e8e1",
      ],
      responsive: {
        rules: [
          {
            condition: { maxWidth: 400 },
            chartOptions: {
              legend: { enabled: false },
              plotOptions: { pie: { dataLabels: { enabled: false } } },
            },
          },
        ],
      },
    };
  }, [data.portfoliosWithRatios, isMobile, theme]);

  // Helper to format dates.
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  // Helper to format currency (INR).
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter Cash In/Out data.
  const filteredCashInOutData = useMemo(() => {
    return data.cashInOutData
      .filter((record) => record.cash_in_out !== 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data.cashInOutData]);

  // Calculate Cash Flow totals.
  const cashFlowTotals = useMemo(() => {
    if (activeTab !== "TOTAL" && !isInvestedInStrategy) {
      return { totalIn: 0, totalOut: 0, netFlow: 0 };
    }
    const cashData =
      activeTab === "TOTAL"
        ? data.cashInOutData.filter((record) => record.cash_in_out !== 0)
        : filteredCashInOutData;
    const totalIn = cashData
      .filter((record) => record.cash_in_out > 0)
      .reduce((sum, record) => sum + record.cash_in_out, 0);
    const totalOut = cashData
      .filter((record) => record.cash_in_out < 0)
      .reduce((sum, record) => sum + Math.abs(record.cash_in_out), 0);
    const netFlow = totalIn - totalOut;
    return { totalIn, totalOut, netFlow };
  }, [data.cashInOutData, filteredCashInOutData, activeTab, isInvestedInStrategy]);

  // Monthly PnL: if not invested, set all pnl values to 0.
  console.log("data", benchmarkData);
  // Update the monthlyPnLData calculation
  const monthlyPnLData = useMemo(() => {
    if (isInvestedInStrategy) {
      return data?.monthlyPnL;
    } else if (!rawBenchmarkData || rawBenchmarkData.length === 0) {
      return [];
    }

    // Calculate monthly PnL from benchmark data
    const monthlyPnLFromBenchmark = [];
    let currentMonth = null;
    let currentYear = null;
    let firstNAVOfMonth = null;
    let lastNAVOfMonth = null;

    // Sort benchmark data by date
    const sortedBenchmark = [...rawBenchmarkData].sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    sortedBenchmark.forEach((item) => {
      const date = new Date(item.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const nav = parseFloat(item.nav);

      if (currentMonth === null) {
        // First iteration
        currentMonth = month;
        currentYear = year;
        firstNAVOfMonth = nav;
        lastNAVOfMonth = nav;
      } else if (month !== currentMonth || year !== currentYear) {
        // Month or year changed, calculate PnL for previous month
        const pnl = ((lastNAVOfMonth - firstNAVOfMonth) / firstNAVOfMonth) * 100;

        monthlyPnLFromBenchmark.push({
          year: currentYear,
          month: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
          pnl: pnl,
          firstNAV: firstNAVOfMonth,
          lastNAV: lastNAVOfMonth
        });

        // Reset for new month
        currentMonth = month;
        currentYear = year;
        firstNAVOfMonth = nav;
        lastNAVOfMonth = nav;
      } else {
        // Same month, update lastNAV
        lastNAVOfMonth = nav;
      }
    });

    // Don't forget to add the last month
    if (currentMonth !== null) {
      const pnl = ((lastNAVOfMonth - firstNAVOfMonth) / firstNAVOfMonth) * 100;
      monthlyPnLFromBenchmark.push({
        year: currentYear,
        month: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
        pnl: pnl,
        firstNAV: firstNAVOfMonth,
        lastNAV: lastNAVOfMonth
      });
    }

    return monthlyPnLFromBenchmark;
  }, [data?.monthlyPnL, isInvestedInStrategy, rawBenchmarkData]);

  // Reflow chart on window resize.
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.chart.reflow();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Style helper for strategy buttons.
  const strategyButtonClass = (strategy) => {
    const baseClasses =
      "px-4 py-2 text-xs sm:text-sm font-medium uppercase tracking-wider focus:outline-none border-b-2";
    const activeClasses =
      activeTab === strategy
        ? "border-[#d1a47b] text-[#d1a47b]"
        : "border-transparent text-gray-700";

    let investedClasses = "";
    if (isAdminUser) {
      investedClasses =
        selectedNuvama && extractStrategy(selectedNuvama) === strategy
          ? "bg-[#fee9d6] font-bold"
          : "";
    } else {
      investedClasses = investedStrategies.includes(strategy)
        ? "bg-[#fee9d6] font-bold"
        : "";
    }

    const nonInvestedClasses =
      !isAdminUser && !investedStrategies.includes(strategy)
        ? "opacity-50 cursor-pointer"
        : "";

    return `${baseClasses} ${activeClasses} ${investedClasses} ${nonInvestedClasses}`;
  };
  // Add this function above your return statement
  const getDropdownClass = () => {
    // Base classes for the dropdown
    let baseClass = "p-2 rounded border text-gray-700 text-xs transition-colors duration-300 w-full sm:w-auto min-h-[40px] appearance-none bg-white px-4";

    // If the active tab is a strategy (not TOTAL) and user is invested in it
    if (activeTab !== "TOTAL" && investedStrategies.includes(activeTab)) {
      return `${baseClass} border-2 border-green-500 bg-green-50`;
    }

    return `${baseClass} border-brown`;
  };
  const combinedLoading = isLoading || isBenchmarkLoading || isBse500Loading;
  const combinedError = error || benchmarkError || bse500Error;

  return (
    <div className="text-gray-900 max-w-7xl mx-auto h-full mt-4 transition-colors duration-300">
      {/* Welcome & Portfolio Details */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div>
            <Heading className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl sm:leading-9 sm:truncate">
              {clientName
                ? `Welcome, ${clientName.charAt(0).toUpperCase() + clientName.slice(1).toLowerCase()}`
                : "Welcome, Guest"}
            </Heading>
            <Text className="text-sm text-gray-600">
              View your portfolio performance and details
            </Text>
          </div>
        </div>

        {/* Tabs / Dropdown: Strategy Tabs + Total Portfolio */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {isMobile ? (
              <div className="relative">
                <select
                  value={activeTab || ""}
                  onChange={(e) => {
                    const tab = e.target.value;
                    setActiveTab(tab);
                    if (tab === "TOTAL") {
                      handleViewModeChange("cumulative");
                    } else {
                      handleViewModeChange("individual");
                      if (!isAdminUser) {
                        const code = getNuvamaCodeForStrategy(tab);
                        setSelectedNuvama(code);
                      }
                    }
                  }}
                  // Add appearance-none to hide the native arrow.
                  className={`${getDropdownClass()} appearance-none`}
                >
                  <option value="TOTAL">Total Portfolio</option>
                  <option value="QAW">
                    QAW{" "}
                    {isAdminUser
                      ? selectedNuvama && extractStrategy(selectedNuvama) === "QAW"
                        ? ""
                        : ""
                      : investedStrategies.includes("QAW")
                        ? ""
                        : ""}
                  </option>
                  {/* Uncomment if needed
          <option value="QGF">
            QGF{" "}
            {isAdminUser
              ? selectedNuvama && extractStrategy(selectedNuvama) === "QGF"
                ? ""
                : ""
              : investedStrategies.includes("QGF")
              ? ""
              : ""}
          </option>
          */}
                  <option value="QFH">
                    QFH{" "}
                    {isAdminUser
                      ? selectedNuvama && extractStrategy(selectedNuvama) === "QFH"
                        ? ""
                        : ""
                      : investedStrategies.includes("QFH")
                        ? ""
                        : ""}
                  </option>
                  <option value="QTF">
                    QTF{" "}
                    {isAdminUser
                      ? selectedNuvama && extractStrategy(selectedNuvama) === "QTF"
                        ? ""
                        : ""
                      : investedStrategies.includes("QTF")
                        ? ""
                        : ""}
                  </option>
                </select>
                {/* Position the arrow icon */}
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setActiveTab("TOTAL");
                    handleViewModeChange("cumulative");
                  }}
                  className={strategyButtonClass("TOTAL")}
                >
                  Total Portfolio
                </button>
                <button
                  onClick={() => {
                    setActiveTab("QAW");
                    handleViewModeChange("individual");
                    if (!isAdminUser) {
                      const code = getNuvamaCodeForStrategy("QAW");
                      setSelectedNuvama(code);
                    }
                  }}
                  className={strategyButtonClass("QAW")}
                >
                  QAW{" "}
                  {isAdminUser
                    ? selectedNuvama && extractStrategy(selectedNuvama) === "QAW"
                      ? ""
                      : ""
                    : investedStrategies.includes("QAW")
                      ? ""
                      : ""}
                </button>
                {/* Other buttons... */}
                <button
                  onClick={() => {
                    setActiveTab("QFH");
                    handleViewModeChange("individual");
                    if (!isAdminUser) {
                      const code = getNuvamaCodeForStrategy("QFH");
                      setSelectedNuvama(code);
                    }
                  }}
                  className={strategyButtonClass("QFH")}
                >
                  QFH{" "}
                  {isAdminUser
                    ? selectedNuvama && extractStrategy(selectedNuvama) === "QFH"
                      ? ""
                      : ""
                    : investedStrategies.includes("QFH")
                      ? ""
                      : ""}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("QTF");
                    handleViewModeChange("individual");
                    if (!isAdminUser) {
                      const code = getNuvamaCodeForStrategy("QTF");
                      setSelectedNuvama(code);
                    }
                  }}
                  className={strategyButtonClass("QTF")}
                >
                  QTF{" "}
                  {isAdminUser
                    ? selectedNuvama && extractStrategy(selectedNuvama) === "QTF"
                      ? ""
                      : ""
                    : investedStrategies.includes("QTF")
                      ? ""
                      : ""}
                </button>
              </div>
            )}

            {activeTab !== "TOTAL" && isAdminUser && (
              <div className="mt-2 sm:mt-0 relative">
                <select
                  value={selectedNuvama || ""}
                  onChange={handleSelectChange}
                  className="p-2 rounded border border-brown text-gray-700 text-xs transition-colors duration-300 w-full sm:w-auto min-h-[40px] appearance-none bg-white px-4"
                >
                  {data.usernames
                    .map((username, index) => ({
                      username,
                      code: data.nuvama_codes[index],
                      index
                    }))
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map(({ username, code, index }) => (
                      <option key={index} value={code}>
                        {username} ({code})
                      </option>
                    ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            )}

          </div>
        </div>

        {/* Dates */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center my-4">
          {startDate && (
            <Text className="text-sm text-gray-700 mb-2 sm:mb-0">
              Inception Date: {formatDate(startDate)}
            </Text>
          )}
          {latestData && (
            <Text className="text-sm text-gray-700">
              Data as of: {formatDate(latestData.date)}
            </Text>
          )}
        </div>

        {/* Portfolio Details (Summary) */}
        <div suppressHydrationWarning>
          <PortfolioDetails
            data={
              activeTab === "TOTAL"
                ? data?.portfolioDetails
                : isInvestedInStrategy
                  ? data?.portfolioDetails
                  : {
                    name: data?.portfolioDetails?.name || "Portfolio",
                    totalInvested: 0,
                    currentValue: 0,
                    returns: 0,
                  }
            }
            isCumulative={activeTab === "TOTAL"}
          />
        </div>
      </div>

      {/* Main Content based on Active Tab */}
      {activeTab === "TOTAL" ? (
        <>
          {data.portfoliosWithRatios && data.portfoliosWithRatios.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <Heading className="text-xl font-semibold text-gray-800 mb-4">
                Portfolio Allocation
              </Heading>
              <div className={`w-full ${isMobile ? "pb-20" : "h-96"}`}>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={donutChartOptions}
                  containerProps={{ style: { width: "100%", height: "100%" } }}
                  ref={chartRef}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <TrailingReturns
              data={isInvestedInStrategy ? data : benchmarkData}
              isLoading={combinedLoading}
              error={combinedError}
              benchmarkData={bse500Data}
              name={isInvestedInStrategy ? selectedNuvama : activeTab}
            />

            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Equity Curve
            </h3>
            {typeof window !== "undefined" && chartOptions && (
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            )}
          </div>
          <div>
            <YearlyMonthlyPLTable monthlyPnL={monthlyPnLData} />
          </div>
        </>
      )}

      {/* Cash In/Out Section */}
      {(activeTab === "TOTAL" || isInvestedInStrategy) &&
        filteredCashInOutData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <Heading className="text-xl font-semibold text-gray-800 mb-4">
              Cash In/Out
            </Heading>
            <div className="overflow-x-auto w-full rounded-lg border border-brown">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 border-b border-brown text-left text-xs font-medium text-black uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 border-b border-brown text-left text-xs font-medium text-black uppercase tracking-wider">
                      Nuvama Code
                    </th>
                    <th className="px-4 py-2 border-b border-brown text-right text-xs font-medium text-black uppercase tracking-wider">
                      Cash In/Out
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCashInOutData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b border-brown text-xs text-gray-700">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-2 border-b border-brown text-xs text-gray-700">{record.nuvama_code}</td>
                      <td
                        className={`px-4 py-2 border-b border-brown text-xs text-right ${record.cash_in_out > 0 ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {formatCurrency(record.cash_in_out)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-4 py-2 border-t border-brown text-xs text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-2 border-t border-brown text-xs text-gray-900"></td>
                    <td className="px-4 py-2 border-t border-brown text-xs text-gray-900 text-right">
                      {formatCurrency(cashFlowTotals.netFlow)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>
                Total Cash In:{" "}
                <span className="text-green-600">
                  {formatCurrency(cashFlowTotals.totalIn)}
                </span>
              </p>
              <p>
                Total Cash Out:{" "}
                <span className="text-red-600">
                  {formatCurrency(cashFlowTotals.totalOut)}
                </span>
              </p>
              <p>
                Net Flow:{" "}
                <span className={cashFlowTotals.netFlow >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(cashFlowTotals.netFlow)}
                </span>
              </p>
            </div>
          </div>
        )}

    </div>
  );
};

export default PerformanceAndDrawdownChart;
