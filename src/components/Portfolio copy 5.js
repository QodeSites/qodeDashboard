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

// Dynamically import components
const TrailingReturns = dynamic(() => import("./TrailingReturn"), { ssr: false });
const PortfolioDetails = dynamic(() => import("./PortfolioDetails"), { ssr: false });
const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-200 animate-pulse" />,
});

// Helper: extract strategy from nuvama code (e.g. "QFH0006" → "QFH")
const extractStrategy = (nuvamaCode) => nuvamaCode.replace(/\d+/g, "");

const PerformanceAndDrawdownChart = () => {
  // activeTab is the strategy being viewed; selectedNuvama is the investor’s code.
  const [activeTab, setActiveTab] = useState(null);

  const {
    data,
    isLoading,
    error,
    selectedNuvama,
    setSelectedNuvama,
    viewMode,
    handleViewModeChange,
    allowCodeSelection, // true only for user IDs 9 and 14
  } = useFetchStrategyData();
  console.log("DATEEEEE", data);

  const { timeRange } = useCustomTimeRange();
  const { isMobile } = useMobileWidth();
  const { theme } = useTheme();
  const chartRef = useRef(null);

  // On initial load, set activeTab based on the investor’s code.
  useEffect(() => {
    if (data?.nuvama_codes?.length > 0 && !activeTab) {
      const initialCode = selectedNuvama || data.nuvama_codes[0];
      // For non-admin users, we force cumulative view (no individual selection)
      if (!allowCodeSelection) {
        handleViewModeChange("cumulative");
      }
      setSelectedNuvama(initialCode);
      setActiveTab(extractStrategy(initialCode));
    }
  }, [data?.nuvama_codes, activeTab, selectedNuvama, setSelectedNuvama, allowCodeSelection, handleViewModeChange]);

  // When the inline select changes, update both selectedNuvama and activeTab.
  const handleSelectChange = (e) => {
    const code = e.target.value;
    setSelectedNuvama(code);
    setActiveTab(extractStrategy(code));
  };

  // Use activeTab for fetching benchmark/model data.
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
      const timestamp = new Date(item.date).getTime();
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
      color: "#000000",
      dashStyle: "Solid",
      marker: { enabled: false },
      tooltip: { valueDecimals: 2, valueSuffix: " %" },
      zIndex: 1,
    };
  }, [bse500Data]);

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
    return selectedNuvama ? extractStrategy(selectedNuvama) === activeTab : false;
  }, [selectedNuvama, activeTab]);

  const adjustedFilteredData = useMemo(
    () => (isInvestedInStrategy ? filteredData : []),
    [isInvestedInStrategy, filteredData]
  );

  // Get the latest NAV data.
  const latestData = useMemo(() => {
    if (!data?.dailyNAV || data.dailyNAV.length === 0) return null;
    return data.dailyNAV[data.dailyNAV.length - 1];
  }, [data]);

  // Process the active strategy’s benchmark data.
  const benchmarkSeries = useMemo(() => {
    if (!rawBenchmarkData || rawBenchmarkData.length === 0) {
      return [];
    }
    const firstNav = parseFloat(rawBenchmarkData[0].nav);
    let previousNav = firstNav;
    const normalized = rawBenchmarkData.map((item) => {
      const timestamp = new Date(item.date).getTime();
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

  // Create chart options.
  const chartOptions = useMemo(() => {
    if (typeof window === "undefined" || !activeTab) return {};
    let chartData = [];
    if (isInvestedInStrategy) {
      chartData = adjustedFilteredData;
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

  // Portfolio summary.
  const portfolioSummary = useMemo(() => {
    if (isInvestedInStrategy) {
      return data?.portfolioDetails;
    } else {
      return {
        name: data?.portfolioDetails?.name || "Portfolio",
        totalInvested: 0,
        currentValue: 0,
        returns: 0,
      };
    }
  }, [data, isInvestedInStrategy]);

  // Monthly PnL.
  const monthlyPnLData = useMemo(() => {
    if (isInvestedInStrategy) {
      return data?.monthlyPnL;
    } else {
      return (data?.monthlyPnL || []).map((item) => ({
        ...item,
        pnl: 0,
      }));
    }
  }, [data, isInvestedInStrategy]);

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
  const strategyButtonClass = (strategy) =>
    `px-4 py-2 text-xs sm:text-sm font-medium uppercase tracking-wider focus:outline-none border-b-2 ${
      activeTab === strategy
        ? "border-[#d1a47b] text-[#d1a47b]"
        : "border-transparent text-gray-700"
    } ${
      strategy !== "TOTAL" &&
      selectedNuvama &&
      extractStrategy(selectedNuvama) !== strategy
        ? "opacity-50 cursor-pointer"
        : ""
    }`;

  // Combined loading and error states.
  const combinedLoading = isLoading || isBenchmarkLoading || isBse500Loading;
  const combinedError = error || benchmarkError || bse500Error;

  return (
    <div className="text-gray-900 max-w-7xl mx-auto h-full mt-4 transition-colors duration-300">
      {/* Welcome & Portfolio Details */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div>
            <Heading className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9 sm:truncate">
              {data?.portfolioDetails?.name
                ? `Welcome, ${data.portfolioDetails.name.charAt(0).toUpperCase()}${data.portfolioDetails.name.slice(1).toLowerCase()}`
                : "Welcome, Guest"}
            </Heading>
            <Text className="text-sm text-gray-600">
              View your portfolio performance and details
            </Text>
          </div>
        </div>

        {/* Tabs: Strategy Tabs + Total Portfolio */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setActiveTab("QAW");
                  // For non-admin users force cumulative view
                  handleViewModeChange(allowCodeSelection ? "individual" : "cumulative");
                }}
                className={strategyButtonClass("QAW")}
              >
                QAW{" "}
                {selectedNuvama && extractStrategy(selectedNuvama) === "QAW"
                  ? "(Invested)"
                  : ""}
              </button>
              <button
                onClick={() => {
                  setActiveTab("QGF");
                  handleViewModeChange(allowCodeSelection ? "individual" : "cumulative");
                }}
                className={strategyButtonClass("QGF")}
              >
                QGF{" "}
                {selectedNuvama && extractStrategy(selectedNuvama) === "QGF"
                  ? "(Invested)"
                  : ""}
              </button>
              <button
                onClick={() => {
                  setActiveTab("QFH");
                  handleViewModeChange(allowCodeSelection ? "individual" : "cumulative");
                }}
                className={strategyButtonClass("QFH")}
              >
                QFH{" "}
                {selectedNuvama && extractStrategy(selectedNuvama) === "QFH"
                  ? "(Invested)"
                  : ""}
              </button>
              <button
                onClick={() => {
                  setActiveTab("QTF");
                  handleViewModeChange(allowCodeSelection ? "individual" : "cumulative");
                }}
                className={strategyButtonClass("QTF")}
              >
                QTF{" "}
                {selectedNuvama && extractStrategy(selectedNuvama) === "QTF"
                  ? "(Invested)"
                  : ""}
              </button>
              <button
                onClick={() => {
                  setActiveTab("TOTAL");
                  handleViewModeChange("cumulative");
                }}
                className={strategyButtonClass("TOTAL")}
              >
                Total Portfolio
              </button>
            </div>

            {/* Show nuvama code dropdown only for admin users (IDs 9 and 14) */}
            {activeTab !== "TOTAL" && allowCodeSelection && (
              <div className="mt-2 sm:mt-0">
                <select
                  value={selectedNuvama || ""}
                  onChange={handleSelectChange}
                  className="p-2 rounded border border-brown text-gray-700 text-xs transition-colors duration-300 w-full sm:w-auto"
                >
                  {data.nuvama_codes.map((code, index) => (
                    <option key={index} value={code}>
                      {data.usernames[index]} ({code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="flex flex-col sm:flex-row justify-between items-center my-4">
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
      {filteredCashInOutData.length > 0 && (
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
                    <td
                      className={`px-4 py-2 border-b border-brown text-xs text-right ${
                        record.cash_in_out > 0 ? "text-green-600" : "text-red-600"
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
              <span
                className={
                  cashFlowTotals.netFlow >= 0 ? "text-green-600" : "text-red-600"
                }
              >
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
