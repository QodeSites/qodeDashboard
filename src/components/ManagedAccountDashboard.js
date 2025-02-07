"use client";
import React, { useState, useRef, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Heading from "./common/Heading";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/20/solid";
import Text from "./common/Text";
import YearlyMonthlyPLTable from "./MonthlyPLTableManagedAccounts";
import useMobileWidth from "@/hooks/useMobileWidth";
import useManagedAccounts from "@/hooks/useManagedAccounts";
import useFetchBenchmarkData from "@/hooks/useFetchBenchmarkData";

const getReferencePoint = (data, targetTime) => {
  for (let i = data.length - 1; i >= 0; i--) {
    const time = new Date(data[i].date).getTime();
    if (time <= targetTime) {
      return data[i];
    }
  }
  return data[0]; // if none found, return the first available point
};

const calculateTrailingReturns = (data) => {
  if (!data || data.length === 0) return {};
  // Define periods in days (adjust as needed)
  const periods = {
    "5d": 5,
    "10d": 10,
    "15d": 15,
    "1m": 30,
    "1y": 365,
    "2y": 730,
    "3y": 1095,
  };

  const trailing = {};
  const lastPoint = data[data.length - 1];
  const lastDate = new Date(lastPoint.date).getTime();
  const lastNav = parseFloat(lastPoint.nav);

  Object.entries(periods).forEach(([key, days]) => {
    const targetTime = lastDate - days * 24 * 60 * 60 * 1000;
    const referencePoint = getReferencePoint(data, targetTime);
    const refNav = parseFloat(referencePoint.nav);
    // Calculate trailing return as percentage change
    const trailingReturn = ((lastNav / refNav) - 1) * 100;
    trailing[key] = trailingReturn;
  });
  return trailing;
};

const calculateBenchmarkDD = (data) => {
  let maxBenchmark = -Infinity;
  let currentDD = 0;
  let maxDD = 0; // will be the most negative value
  data.forEach((point) => {
    const nav = parseFloat(point.nav);
    maxBenchmark = Math.max(maxBenchmark, nav);
    const dd = ((nav - maxBenchmark) / maxBenchmark) * 100;
    currentDD = dd; // last value will be the current drawdown
    if (dd < maxDD) {
      maxDD = dd;
    }
  });
  return { currentDD, maxDD };
};

const calculateSchemeDD = (navData) => {
  let peakNav = -Infinity;
  let currentDD = 0;
  let maxDD = 0; // This will hold the deepest (most negative) drawdown

  navData.forEach((point) => {
    const nav = parseFloat(point.nav);
    // Update the peak if the current nav is higher
    peakNav = Math.max(peakNav, nav);
    // Compute the drawdown percentage from the peak
    const dd = ((nav - peakNav) / peakNav) * 100;
    currentDD = dd; // The last point's dd is the current drawdown
    if (dd < maxDD) {
      maxDD = dd;
    }
  });

  return { currentDD, maxDD };
};

// ─── TRAILING RETURNS COMPONENT ────────────────────────────────

const TrailingReturns = ({
  trailingReturns,
  ddStats,
  benchmarkTrailingReturns,
  benchmarkDDStats,
}) => {
  // We assume the trailing returns object keys are the same for both scheme and benchmark.
  const periods = Object.keys(trailingReturns);
  return (
    <div className="my-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-xs sm:text-xl font-bold mb-4">
        Trailing Returns &amp; Drawdown
      </h2>
      <div className="overflow-x-auto border text-xs sm:text-sm border-brown rounded-lg">
        <table className="min-w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-lightBeige">
              <th className="w-1/10 p-4 text-left border border-brown font-semibold">
                Return Type
              </th>
              {periods.map((period) => (
                <th
                  key={period}
                  className="w-1/10 border p-4 border-brown text-center font-semibold"
                >
                  {period}
                </th>
              ))}
              <th className="w-1/12 border p-4 border-brown text-center font-semibold">
                Current DD
              </th>
              <th className="w-1/12 border p-4 border-brown text-center font-semibold">
                Max DD
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row for Scheme trailing returns */}
            <tr>
              <td className="border p-4 border-brown font-medium">
                Scheme (%)
              </td>
              {periods.map((period) => (
                <td key={period} className="border p-4 border-brown text-center">
                  {trailingReturns[period] !== null
                    ? trailingReturns[period].toFixed(2)
                    : "N/A"}
                </td>
              ))}
              <td className="border p-4 text-center">
                {ddStats.portfolio.currentDD !== null
                  ? ddStats.portfolio.currentDD.toFixed(2)
                  : "N/A"}
              </td>
              <td className="border p-4 text-center">
                {ddStats.portfolio.maxDD !== null
                  ? ddStats.portfolio.maxDD.toFixed(2)
                  : "N/A"}
              </td>
            </tr>
            {/* Row for Benchmark trailing returns */}
            <tr>
              <td className="border p-4 border-brown font-medium">
                Benchmark (%)
              </td>
              {periods.map((period) => (
                <td key={period} className="border p-4 border-brown text-center">
                  {benchmarkTrailingReturns && benchmarkTrailingReturns[period] != null
                    ? benchmarkTrailingReturns[period].toFixed(2)
                    : "N/A"}
                </td>
              ))}
              <td className="border p-4 border-brown text-center">
                {benchmarkDDStats && benchmarkDDStats.currentDD !== null
                  ? benchmarkDDStats.currentDD.toFixed(2)
                  : "N/A"}
              </td>
              <td className="border p-4 border-brown text-center">
                {benchmarkDDStats && benchmarkDDStats.maxDD !== null
                  ? benchmarkDDStats.maxDD.toFixed(2)
                  : "N/A"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── MANAGED ACCOUNT DASHBOARD ────────────────────────────────

const ManagedAccountDashboard = ({ accountCodes, accountNames }) => {
  // Check if this is a Sarla account to display a scheme dropdown
  const benchmarkIndices = ["NIFTY 50"];

  const isSarlaAccount = Array.isArray(accountNames)
    ? accountNames.includes("Sarla Performance fibers")
    : accountNames === "Sarla Performance fibers";

  // Local UI state
  const [activeScheme, setActiveScheme] = useState("Scheme Total");
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useMobileWidth();

  // Refs for charts
  const navChartRef = useRef(null);

  // Use the hook and extract helper functions
  const {
    accountsData,
    aggregatedTotals,
    loading,
    error,
    getAccountByCode,
    getTotalPortfolioByAccount,
  } = useManagedAccounts();

  // Assume you are using the first account from accountCodes
  const accountCode =
    accountCodes && accountCodes.length > 0 ? accountCodes[0] : null;
  const currentAccount = accountCode ? getAccountByCode(accountCode) : null;
  // Get totalPortfolio using the new helper function
  const totalPortfolio = accountCode
    ? getTotalPortfolioByAccount(accountCode)
    : null;

  // Get client name
  const clientName = currentAccount ? currentAccount.clientName : "User";

  // Convert schemes into an array for mapping (if available)
  const schemes =
    currentAccount && currentAccount.schemes ? currentAccount.schemes : [];

  // When an individual scheme is selected, get its data.
  // For "Scheme Total" we use totalPortfolio data.
  const selectedScheme =
    activeScheme === "Scheme Total"
      ? null
      : schemes.find((s) => s.schemeName === activeScheme);

  // Get start and end dates from the appropriate NAV curve
  const startDate =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.navCurve?.[0]?.date || null
      : selectedScheme?.navCurve?.[0]?.date || null;
  const endDate =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.navCurve?.[totalPortfolio?.navCurve?.length - 1]?.date || null
      : selectedScheme?.navCurve?.[selectedScheme?.navCurve?.length - 1]?.date || null;

  // Helper function to remove the timestamp from an ISO date string
  const stripTimestamp = (dateString) =>
    dateString ? dateString.split("T")[0] : null;
  const formattedStartDate = stripTimestamp(startDate);
  const formattedEndDate = stripTimestamp(endDate);

  // Pass the formatted dates to useFetchBenchmarkData
  const {
    benchmarkData,
    isLoading: isBenchmarkLoading,
    error: benchmarkError,
  } = useFetchBenchmarkData(
    benchmarkIndices,
    formattedStartDate,
    formattedEndDate
  );

  // Compute display values:
  const investedAmount =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.investedAmount || aggregatedTotals.totalInvestedAmount
      : selectedScheme?.investedAmount || 0;

  const portfolioValue =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.currentPortfolioValue ||
      schemes.reduce((sum, s) => sum + (s.currentPortfolioValue || 0), 0)
      : selectedScheme?.currentPortfolioValue || 0;

  const returnsValue =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.returns || 0
      : selectedScheme?.returns || 0;

  const dailyPercentageChange = 0;
  const isPositive = returnsValue >= 0;
  const totalProfit = portfolioValue - investedAmount;

  const latestPreviousValue = 0; // placeholder

  // Use totalPortfolio data for trailing returns & drawdown when selected.
  const trailingReturns =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.trailingReturns || {}
      : selectedScheme?.trailingReturns || {};

  // ── Calculate Benchmark trailing returns and drawdown stats ──
  const benchmarkTrailingReturns = useMemo(() => {
    if (benchmarkData && benchmarkData.length > 0) {
      return calculateTrailingReturns(benchmarkData);
    }
    return {};
  }, [benchmarkData]);

  const benchmarkDDStats = useMemo(() => {
    if (benchmarkData && benchmarkData.length > 0) {
      return calculateBenchmarkDD(benchmarkData);
    }
    return { currentDD: 0, maxDD: 0 };
  }, [benchmarkData]);

  const schemeDDStats = useMemo(() => {
    if (activeScheme === "Scheme Total" && totalPortfolio?.navCurve?.length) {
      return calculateSchemeDD(totalPortfolio.navCurve);
    } else if (activeScheme !== "Scheme Total" && selectedScheme?.navCurve?.length) {
      return calculateSchemeDD(selectedScheme.navCurve);
    }
    return { currentDD: 0, maxDD: 0 };
  }, [activeScheme, selectedScheme, totalPortfolio]);

  const ddStats = useMemo(() => {
    return {
      portfolio: schemeDDStats,
      benchmark: { currentDD: 0, maxDD: 0 },
    };
  }, [schemeDDStats]);
  
  // ── Helper function to normalize data series ──
  const normalizeDataSeries = (data, startValue) => {
    return data.map(point => [
      point[0],
      (point[1] / startValue) * 100
    ]);
  };

  // ── MERGED CHART OPTIONS (NAV & Drawdown) ──
  const mergedChartOptions = useMemo(() => {
    // ── Prepare Performance (NAV) Series ──
    let performanceSeries = [];
    let portfolioData = [];
    if (activeScheme === "Scheme Total") {
      const totalNavCurve = totalPortfolio?.navCurve || [];
      portfolioData = totalNavCurve.map((item) => [
        new Date(item.date).getTime(),
        parseFloat(item.nav)
      ]);
    } else if (selectedScheme) {
      portfolioData = (selectedScheme.navCurve || []).map((item) => [
        new Date(item.date).getTime(),
        parseFloat(item.nav)
      ]);
    }
    if (portfolioData.length > 0) {
      // Normalize so that the very first value becomes 0.
      const normalizedPortfolioData = normalizeDataSeries(
        portfolioData,
        portfolioData[0][1]
      );
      performanceSeries.push({
        name: activeScheme === "Scheme Total" ? "Portfolio" : selectedScheme.schemeName,
        data: normalizedPortfolioData,
        color: "#2E8B57", // Forest green for portfolio performance.
        zIndex: 2,
        yAxis: 0, // assign to performance y-axis (top)
        type: "line",
        marker: { enabled: false }
      });
    }
  
    let benchmarkPerformanceSeries = [];
    if (benchmarkData?.length) {
      const benchmarkDataPoints = benchmarkData.map((item) => [
        new Date(item.date).getTime(),
        parseFloat(item.nav)
      ]);
      const normalizedBenchmarkData = normalizeDataSeries(
        benchmarkDataPoints,
        benchmarkDataPoints[0][1]
      );
      benchmarkPerformanceSeries.push({
        name: "NIFTY 50",
        data: normalizedBenchmarkData,
        color: "#4169E1", // Royal blue for benchmark.
        dashStyle: "shortdash",
        zIndex: 1,
        yAxis: 0, // performance axis
        type: "line",
        marker: { enabled: false }
      });
    }
  
    // ── Prepare Drawdown Series Using Actual (Negative) Values ──
    let drawdownSeries = [];
    const portfolioCurve =
      activeScheme === "Scheme Total"
        ? totalPortfolio?.drawdownCurve
        : selectedScheme?.drawdownCurve;
    if (portfolioCurve?.length) {
      drawdownSeries.push({
        name: "Portfolio Drawdown",
        data: portfolioCurve.map((point) => [
          new Date(point.date).getTime(),
          parseFloat(-point.drawdown)// Multiply drawdown by 100
        ]),
        color: "#FF4560",
        zIndex: 2,
        yAxis: 1, // assign to drawdown y-axis (bottom)
        type: "area",
        marker: { enabled: false },
        fillOpacity: 0.2,
        threshold: 0, // Draw from the 0 baseline
        tooltip: { valueSuffix: "%" }
      });
    }
  
    let benchmarkDrawdownSeries = [];
    if (benchmarkData?.length) {
      let maxBenchmark = -Infinity;
      const benchmarkDrawdownCurve = benchmarkData.map((point) => {
        const timestamp = new Date(point.date).getTime();
        const nav = parseFloat(point.nav);
        maxBenchmark = Math.max(maxBenchmark, nav);
        // Compute drawdown percentage (this will be negative or zero).
        const dd = ((nav - maxBenchmark) / maxBenchmark) * 100;
        return [timestamp, dd];
      });
      benchmarkDrawdownSeries.push({
        name: "NIFTY 50 Drawdown",
        data: benchmarkDrawdownCurve,
        color: "#FF8F00",
        dashStyle: "shortdash",
        zIndex: 1,
        yAxis: 1, // drawdown axis
        type: "area",
        marker: { enabled: false },
        fillOpacity: 0.2,
        threshold: 0, // Draw from the 0 baseline
        tooltip: { valueSuffix: "%" }
      });
    }
  
    // Combine all series.
    const mergedSeries = [
      ...performanceSeries,
      ...benchmarkPerformanceSeries,
      ...drawdownSeries,
      ...benchmarkDrawdownSeries
    ];
  
    return {
      chart: {
        zoomType: "xy",
        height: 800, // Increased chart height for better visibility
      },
      title: {
        text: "Portfolio vs Benchmark Performance & Drawdown",
        style: { fontSize: "16px" },
      },
      xAxis: {
        type: "datetime",
        title: { text: "Date" },
        // Match the xAxis settings from your second configuration:
        labels: {
          formatter: function () {
            return Highcharts.dateFormat('%Y', this.value);
          },
          style: {
            color: "#2E8B57", // replace with colors.accent if available
            fontSize: "10px",
          },
        },
        gridLineColor: "#e6e6e6", // replace with colors.gridLines if available
        tickWidth: 1, // or (isMobile ? 0 : 1)
      },
      // Define two yAxes: index 0 for performance and index 1 for drawdown.
      yAxis: [
        {
          // Performance yAxis (top half)
          title: { text: "Performance (%)" },
          height: "50%",
          top: "0%",

          labels: {
            formatter: function () {
              return Math.round(this.value);
            },
            style: {
              color: "#2E8B57", // or colors.accent
              fontSize: "10px",
            },
          },
          lineColor: "#2E8B57",
          tickColor: "#2E8B57",
          tickWidth: 1, // or (isMobile ? 0 : 1)
          gridLineColor: "#e6e6e6", // or colors.gridLines
          plotLines: [{
            value: 100, // adjust as needed (if your performance is normalized to 100)
            color: "#2E8B57",
            width: 1,
            zIndex: 5,
            dashStyle: "dot"
          }],
        },
        {
          // Drawdown yAxis (bottom half)
          title: { text: "FEFREWE" },
          height: "50%",
          top: "50%",
          offset: 0,
          min: -15, // or use drawdownMin if available
          max: 0,
          tickAmount: 5,
          labels: {
            formatter: function () {
              return Math.round(this.value) + '%';
            },
            style: {
              color: "#FF4560", // or your chosen color for drawdown
              fontSize: "10px",
            },
          },
          lineColor: "#FF4560",
          tickColor: "#FF4560",
          tickWidth: 1, // or (isMobile ? 0 : 1)
          gridLineColor: "#e6e6e6",
        },
      ],
      tooltip: {
        shared: true,
        xDateFormat: "%Y-%m-%d",
        valueDecimals: 2,
        formatter: function () {
          let tooltipText = "<b>" + Highcharts.dateFormat("%Y-%m-%d", this.x) + "</b><br/>";
          this.points.forEach((point) => {
            tooltipText += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: ${point.y.toFixed(2)}`;
            if (point.series.type === "area") {
              tooltipText += "%";
            }
            tooltipText += "<br/>";
          });
          return tooltipText;
        }
      },
      legend: {
        enabled: true,
        itemStyle: { fontSize: "12px" }
      },
      plotOptions: {
        line: { marker: { enabled: false } },
        area: { fillOpacity: 0.2, marker: { enabled: false } }
      },
      series: mergedSeries
    };
  }, [activeScheme, totalPortfolio, selectedScheme, benchmarkData]);
  
  // For monthly P&L data
  const monthlyPnLFromNormalizedData =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.monthlyPnL
        ? totalPortfolio.monthlyPnL.byMonth || {}
        : {}
      : selectedScheme?.monthlyPnL
        ? selectedScheme.monthlyPnL.byMonth || {}
        : {};

  // Cash flow data
  const filteredCashInOutData =
    activeScheme === "Scheme Total"
      ? totalPortfolio?.cashFlows || []
      : selectedScheme?.cashFlows || [];
  const totalAmount = filteredCashInOutData.reduce(
    (sum, record) => sum + record.amount,
    0
  );
  const totalDividend = filteredCashInOutData.reduce(
    (sum, record) => sum + (record.dividend || 0),
    0
  );
  const netFlow = totalAmount + totalDividend;
  const { totalIn, totalOut } = filteredCashInOutData.reduce(
    (acc, record) => {
      if (record.amount > 0) {
        acc.totalIn += record.amount;
      } else {
        acc.totalOut += record.amount;
      }
      return acc;
    },
    { totalIn: 0, totalOut: 0 }
  );

  // Helper functions for formatting dates and currency
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return (
      "₹" +
      amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };


  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (error) {
      return <div className="p-4 text-red-500">Error: {error}</div>;
    }
    if (!accountsData) {
      return <div className="p-4 text-red-500">No data available.</div>;
    }

    return (
      <>
        {isSarlaAccount && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <label htmlFor="scheme-select" className="text-xs sm:text-sm font-medium">
              Select Scheme:
            </label>
            <select
              id="scheme-select"
              value={activeScheme}
              onChange={(e) => setActiveScheme(e.target.value)}
              className="p-2 rounded border border-brown text-gray-700"
            >
              <option value="Scheme Total">Scheme Total</option>
              {schemes.map(({ schemeName }) => (
                <option key={schemeName} value={schemeName}>
                  {schemeName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Amount Invested</h3>
            <p className="mt-2 text-base">{formatCurrency(investedAmount)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Current Portfolio Value</h3>
            <div className="mt-2 flex items-baseline gap-4">
              <span className="text-base">{formatCurrency(portfolioValue)}</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Returns</h3>
            <div className="mt-2 flex justify-between items-baseline gap-4">
              <span
                className={`text-xs sm:text-xl font-semibold ${returnsValue >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {returnsValue.toFixed(2)}%
              </span>
              <div className={`flex items-end text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? (
                  <ArrowUpIcon className="h-1 w-1" />
                ) : (
                  <ArrowDownIcon className="h-1 w-1" />
                )}
                <span>{dailyPercentageChange.toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Total Profit</h3>
            <div className="mt-2 flex justify-between items-baseline gap-4">
              <p className={`text-base ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(totalProfit)}
              </p>
              <div className="flex items-center">
                {latestPreviousValue >= 0 ? (
                  <ArrowUpIcon className="h-1 w-1 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-1 w-1 text-red-500" />
                )}
                <span className={`text-sm ${latestPreviousValue >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(latestPreviousValue)}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Total Dividends</h3>
            <p className="mt-2 text-base">{formatCurrency(totalDividend)}</p>
          </div>
        </div>

        <TrailingReturns
          trailingReturns={trailingReturns}
          ddStats={ddStats}
          benchmarkTrailingReturns={benchmarkTrailingReturns}
          benchmarkDDStats={benchmarkDDStats}
        />


        {/* Merged Chart: NAV & Drawdown */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          {(activeScheme === "Scheme Total" && totalPortfolio?.navCurve?.length) ||
            (activeScheme !== "Scheme Total" && selectedScheme?.navCurve?.length) ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={mergedChartOptions}
              ref={navChartRef}
            />
          ) : (
            <div className="p-4 text-center text-gray-600">
              No data available.
            </div>
          )}
        </div>

        <YearlyMonthlyPLTable monthlyPnL={monthlyPnLFromNormalizedData} />

        <div className="my-6 border rounded-lg">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-4 border rounded-lg bg-lightBeige text-sm font-medium text-black uppercase tracking-wider focus:outline-none"
          >
            <Text className="sm:text-sm italic text-xs font-subheading text-brown text-left">
              Cash In/Out
            </Text>
            <span className="text-xs sm:text-xl">{isOpen ? "−" : "+"}</span>
          </button>

          {isOpen && (
            <div className="sm:p-4">
              <div className="overflow-x-auto w-full rounded-lg border">
                <table className="min-w-full bg-white">
                  <thead className="bg-lightBeige">
                    <tr>
                      <th className="p-4 border text-left text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Date
                      </th>
                      <th className="p-4 border text-left text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Scheme
                      </th>
                      <th className="p-4 border text-right text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Cash In/Out
                      </th>
                      <th className="p-4 border text-right text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Dividend
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCashInOutData.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-4 border text-xs sm:text-sm text-gray-700">
                          {formatDate(record.date)}
                        </td>
                        <td className="p-4 border text-xs sm:text-sm text-gray-700">
                          {activeScheme === "Scheme Total" ? record.scheme : activeScheme}
                        </td>
                        <td className={`p-4 border text-xs sm:text-sm text-right ${record.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(record.amount)}
                        </td>
                        <td className={`p-4 border text-xs sm:text-sm text-right ${(record.dividend || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(record.dividend || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="p-4 border text-xs sm:text-sm text-gray-900">
                        Total
                      </td>
                      <td className="p-4 border text-xs sm:text-sm text-right"></td>
                      <td className="p-4 border text-xs sm:text-sm text-right">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td className="p-4 border text-xs sm:text-sm text-right">
                        {formatCurrency(totalDividend)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-gray-600">
                <p>
                  Total Cash In: <span className="text-green-600">{formatCurrency(totalIn)}</span>
                </p>
                <p>
                  Total Cash Out: <span className="text-red-600">{formatCurrency(totalOut)}</span>
                </p>
                <p>
                  Total Dividend: <span className="text-green-600">{formatCurrency(totalDividend)}</span>
                </p>
                <p>
                  Net Flow: <span className={netFlow >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(netFlow)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="p-2">
      {endDate && (
        <Text className="sm:text-sm italic text-xs font-subheading text-brown text-right">
          Data as of: {formatDate(endDate)}
        </Text>
      )}
      <div className="flex justify-between items-center mb-4">
        <Heading className="sm:text-subheading italic text-xs font-subheading text-brown mb-4 mt-4">
          Welcome, {clientName}
        </Heading>
      </div>
      {renderContent()}
    </div>
  );
};

export default ManagedAccountDashboard;
