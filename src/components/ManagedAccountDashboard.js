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
    <div className="p-4 bg-white mb-6 rounded-lg shadow">
      {/* Header with title and download button */}
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Trailing Returns &amp; Drawdown
          </h3>
        </div>
        <div
          data-cmid="portfolios:button|download_trailing_return"
          data-reach-tooltip-trigger=""
        >
          {/* <a
            download="focused_tailing_return.csv"
            target="_self"
            href="blob:https://app.capitalmind.in/3cad4c5c-bcf3-4326-9de2-75f5698b055f"
          >
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-3 w-4 text-green-500 inline group-hover:text-green-500 group-focus:text-green-600 transition ease-in-out duration-150"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a> */}
        </div>
      </div>

      {/* Table container */}
      <div className="flex flex-col mt-4">
        <div className="overflow-x-auto">
          <div className="align-middle inline-block min-w-full">
            <div className="overflow-hidden rounded-lg">
              <table
                role="table"
                className="min-w-full divide-y divide-gray-200 tabular-nums"
              >
                <thead>
                  <tr role="row">
                    <th
                      colSpan="1"
                      role="columnheader"
                      title="Toggle SortBy"
                      className="text-left px-4 py-2 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                      style={{ cursor: "pointer" }}
                    >
                      Name
                    </th>
                    {periods.map((period) => (
                      <th
                        key={period}
                        colSpan="1"
                        role="columnheader"
                        title="Toggle SortBy"
                        className="text-center px-4 py-2 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                        style={{ cursor: "pointer" }}
                      >
                        {period}
                      </th>
                    ))}
                    <th
                      colSpan="1"
                      role="columnheader"
                      title="Toggle SortBy"
                      className="text-center px-1 py-2 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider border-l-2 border-gray-300"
                      style={{ cursor: "pointer" }}
                    >
                      Current DD
                    </th>
                    <th
                      colSpan="1"
                      role="columnheader"
                      title="Toggle SortBy"
                      className="text-center px-1 py-2 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase  tracking-wider"
                      style={{ cursor: "pointer" }}
                    >
                      Max DD
                    </th>
                  </tr>
                </thead>
                <tbody
                  role="rowgroup"
                  className="bg-white divide-y divide-gray-200"
                >
                  <tr role="row">
                    <td
                      role="cell"
                      className="text-left px-4 py-2 whitespace-nowrap text-sm leading-5 text-gray-900 capitalize"
                    >
                      Scheme (%)
                    </td>
                    {periods.map((period) => (
                      <td
                        key={period}
                        role="cell"
                        className="text-center px-4 py-2 whitespace-nowrap text-sm leading-5 text-gray-900"
                      >
                        {trailingReturns[period] !== null
                          ? trailingReturns[period].toFixed(2)
                          : "-"}
                      </td>
                    ))}
                    <td
                      role="cell"
                      className="text-center px-4 py-2 whitespace-nowrap text-sm border-l-2 border-gray-300 leading-5 text-gray-900"
                    >
                      {ddStats.portfolio.currentDD !== null
                        ? ddStats.portfolio.currentDD.toFixed(2)
                        : "-"}
                    </td>
                    <td
                      role="cell"
                      className="text-center px-4 py-2 whitespace-nowrap text-sm leading-5 text-gray-900"
                    >
                      {ddStats.portfolio.maxDD !== null
                        ? ddStats.portfolio.maxDD.toFixed(2)
                        : "-"}
                    </td>
                  </tr>
                  <tr role="row">
                    <td
                      role="cell"
                      className="text-left px-4 py-2 whitespace-nowrap text-sm leading-5 text-gray-900 capitalize"
                    >
                      Benchmark (%)
                    </td>
                    {periods.map((period) => (
                      <td
                        key={period}
                        role="cell"
                        className="text-center px-4 py-2 whitespace-nowrap text-sm leading-5 text-gray-900"
                      >
                        {benchmarkTrailingReturns && benchmarkTrailingReturns[period] != null
                          ? benchmarkTrailingReturns[period].toFixed(2)
                          : "-"}
                      </td>
                    ))}
                    <td
                      role="cell"
                      className="text-center px-1 py-2 whitespace-nowrap text-sm border-l-2 border-gray-300 leading-5 text-gray-900"
                    >
                      {benchmarkDDStats && benchmarkDDStats.currentDD !== null
                        ? benchmarkDDStats.currentDD.toFixed(2)
                        : "-"}
                    </td>
                    <td
                      role="cell"
                      className="text-center px-1 py-2 whitespace-nowrap text-sm leading-5 text-gray-900"
                    >
                      {benchmarkDDStats && benchmarkDDStats.maxDD !== null
                        ? benchmarkDDStats.maxDD.toFixed(2)
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs my-1 font-light text-gray-500">
        Note: Returns above 1 year are annualised.
      </p>
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
  console.log(trailingReturns)
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
        height: 700, // Increased chart height for better visibility
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
          // Performance yAxis (top)
          title: { text: "Performance (%)" },
          height: "70%", // increased from 70% to give more space for performance data
          top: "0%",
          labels: {
            formatter: function () {
              return Math.round(this.value);
            },
            style: {
              color: "#2E8B57", // or colors.accent
              fontSize: "8px",
            },
          },
          min: 80,
          tickAmount: 7,

          lineColor: "#2E8B57",
          tickColor: "#2E8B57",
          tickWidth: 1,
          gridLineColor: "#e6e6e6",
          plotLines: [{
            value: 100, // adjust as needed
            color: "#2E8B57",
            width: 1,
            zIndex: 5,
            dashStyle: "dot"
          }],
        },
        {
          // Drawdown yAxis (bottom)
          title: { text: "Drawdown" },
          height: "20%", // reduced from 30% to further shrink the drawdown area
          top: "80%",    // adjusted to start right after the performance axis
          offset: 0,
          min: -15, // adjust these values based on your data range if needed
          max: 0,
          tickAmount: 3,
          labels: {
            formatter: function () {
              return Math.round(this.value) + '%';
            },
            style: {
              color: "#FF4560", // chosen color for drawdown
              fontSize: "10px",
            },
          },
          lineColor: "#FF4560",
          tickColor: "#FF4560",
          tickWidth: 1,
          gridLineColor: "#e6e6e6",
        },
      ],

      tooltip: {
        shared: true,
        xDateFormat: "%Y-%m-%d",
        valueDecimals: 2,
        formatter: function () {
          const hoveredX = this.x;
          const chart = this.points[0].series.chart;

          // Helper: find the nearest point in a series to the given x value
          function getNearestPoint(series, x) {
            let nearestPoint = null;
            let minDiff = Infinity;
            series.data.forEach(point => {
              const diff = Math.abs(point.x - x);
              if (diff < minDiff) {
                minDiff = diff;
                nearestPoint = point;
              }
            });
            return nearestPoint;
          }

          // Determine the names used for your series.
          // (These match the names you set when pushing the series earlier.)
          const portfolioSeriesName =
            activeScheme === "Scheme Total" ? "Portfolio" : selectedScheme?.schemeName;

          // Get the series from the chart instance
          const portfolioSeries = chart.series.find(s => s.name === portfolioSeriesName);
          const benchmarkSeries = chart.series.find(s => s.name === "NIFTY 50");
          const portfolioDrawdownSeries = chart.series.find(s => s.name === "Portfolio Drawdown");
          const benchmarkDrawdownSeries = chart.series.find(s => s.name === "NIFTY 50 Drawdown");

          // Look up the nearest point for each series
          const portfolioPoint = portfolioSeries ? getNearestPoint(portfolioSeries, hoveredX) : null;
          const benchmarkPoint = benchmarkSeries ? getNearestPoint(benchmarkSeries, hoveredX) : null;
          const portfolioDrawdownPoint = portfolioDrawdownSeries ? getNearestPoint(portfolioDrawdownSeries, hoveredX) : null;
          const benchmarkDrawdownPoint = benchmarkDrawdownSeries ? getNearestPoint(benchmarkDrawdownSeries, hoveredX) : null;

          // Build the tooltip text
          let tooltipText = "<b>" + Highcharts.dateFormat("%d-%m-%Y", hoveredX) + "</b><br/><br/>";

          tooltipText += "<span style='font-weight: bold; font-size: 12px'>Performance:</span><br/>";
          tooltipText += `<span style="color:#2E8B57">\u25CF</span> Portfolio: ${portfolioPoint ? portfolioPoint.y.toFixed(2) : 'N/A'}%<br/>`;
          tooltipText += `<span style="color:#4169E1">\u25CF</span> Benchmark: ${benchmarkPoint ? benchmarkPoint.y.toFixed(2) : 'N/A'}%<br/>`;

          tooltipText += "<br/><span style='font-weight: bold; font-size: 12px'>Drawdown:</span><br/>";
          tooltipText += `<span style="color:#FF4560">\u25CF</span> Portfolio: ${portfolioDrawdownPoint ? portfolioDrawdownPoint.y.toFixed(2) : 'N/A'}%<br/>`;
          tooltipText += `<span style="color:#FF8F00">\u25CF</span> Benchmark: ${benchmarkDrawdownPoint ? benchmarkDrawdownPoint.y.toFixed(2) : 'N/A'}%<br/>`;

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


    // Dummy stocks data for now (including some Indian stocks)
    const dummyStocks = [
      { symbol: "AAPL", name: "Apple Inc.", quantity: 10, price: 150, totalValue: 1500 },
      { symbol: "GOOG", name: "Alphabet Inc.", quantity: 5, price: 2800, totalValue: 14000 },
      { symbol: "TSLA", name: "Tesla Inc.", quantity: 8, price: 800, totalValue: 6400 },
      { symbol: "AMZN", name: "Amazon.com Inc.", quantity: 2, price: 3300, totalValue: 6600 },
      { symbol: "RELIANCE", name: "Reliance Industries", quantity: 50, price: 2500, totalValue: 125000 },
      { symbol: "TCS", name: "Tata Consultancy Services", quantity: 20, price: 3500, totalValue: 70000 },
      { symbol: "INFY", name: "Infosys Ltd.", quantity: 30, price: 1500, totalValue: 45000 },
      { symbol: "HDFCBANK", name: "HDFC Bank", quantity: 15, price: 1600, totalValue: 24000 },
      { symbol: "NIFTY MIDCAP 100", name: "NIFTY MIDCAP 100", quantity: 15, price: 1600, totalValue: 24000 },
      { symbol: "NIFTY SMLCAP 250", name: "NIFTY SMLCAP 250", quantity: 15, price: 1600, totalValue: 24000 },
      { symbol: "GOLDBEES", name: "GOLDBEES", quantity: 15, price: 1600, totalValue: 24000 },
    ];

    return (
      <>
        {isSarlaAccount && (
          <>
            {/* Tab-Style Selector for larger screens */}
            <div className="hidden sm:flex items-center gap-6 mb-6 border-b">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveScheme("Scheme Total")}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium uppercase tracking-wider focus:outline-none border-b-2 ${activeScheme === "Scheme Total"
                    ? "border-green-500 text-green-500"
                    : "border-transparent text-gray-700"
                    }`}
                >
                  Scheme Total
                </button>
                {schemes.map(({ schemeName }) => (
                  <button
                    key={schemeName}
                    onClick={() => setActiveScheme(schemeName)}
                    className={`px-4 py-2 text-xs sm:text-sm font-medium uppercase tracking-wider focus:outline-none border-b-2 ${activeScheme === schemeName
                      ? "border-green-500 text-green-500"
                      : "border-transparent text-gray-700"
                      }`}
                  >
                    {schemeName}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Selector for mobile screens */}
            <div className="flex sm:hidden flex-col gap-2 mb-6">
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
          </>
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
                className={`text-xs sm:text-xl font-semibold ${returnsValue >= 0 ? "text-green-500" : "text-red-500"
                  }`}
              >
                {returnsValue.toFixed(2)}%
              </span>
              <div
                className={`flex items-end text-sm ${isPositive ? "text-green-600" : "text-red-600"
                  }`}
              >
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

        {/* Merged Chart: NAV & Drawdown with Stocks Table on the right */}
        <div className="flex sm:flex-row flex-col gap-5">
          <div className="bg-white w-full sm:w-3/4 p-4 rounded-lg shadow mb-6">
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
          <div className="bg-white p-4 w-full sm:w-1/4  rounded-lg shadow mb-6">
            {/* Stocks Held Table */}
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stocks Holdings</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th> */}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dummyStocks.map((stock) => (
                    <tr key={stock.symbol}>
                      {/* <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {stock.symbol}
                  </td> */}
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {stock.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {stock.quantity}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(stock.price)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(stock.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <YearlyMonthlyPLTable monthlyPnL={monthlyPnLFromNormalizedData} />

        <div className="my-6 border bg-white rounded-lg">
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
            <div className="sm:p-4 rounded-lg shadow mb-6">
              <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full">
                  <div className="overflow-hidden rounded-lg border border-brown">
                    <table className="min-w-full divide-y divide-gray-200 tabular-nums">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-4 py-2 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                            style={{ cursor: "pointer" }}
                          >
                            Date
                          </th>
                          <th
                            className="px-4 py-2 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                            style={{ cursor: "pointer" }}
                          >
                            Scheme
                          </th>
                          <th
                            className="px-4 py-2 text-right text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                            style={{ cursor: "pointer" }}
                          >
                            Cash In/Out
                          </th>
                          <th
                            className="px-4 py-2 text-right text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                            style={{ cursor: "pointer" }}
                          >
                            Dividend
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCashInOutData.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(record.date)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {activeScheme === "Scheme Total" ? record.scheme : activeScheme}
                            </td>
                            <td
                              className={`px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right ${record.amount > 0 ? "text-green-600" : "text-red-600"
                                }`}
                            >
                              {formatCurrency(record.amount)}
                            </td>
                            <td
                              className={`px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right ${(record.dividend || 0) > 0 ? "text-green-600" : "text-red-600"
                                }`}
                            >
                              {formatCurrency(record.dividend || 0)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            Total
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"></td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(totalAmount)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(totalDividend)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs font-light text-gray-500">
                <p>
                  Total Cash In:{" "}
                  <span className="text-green-600">{formatCurrency(totalIn)}</span>
                </p>
                <p>
                  Total Cash Out:{" "}
                  <span className="text-red-600">{formatCurrency(totalOut)}</span>
                </p>
                <p>
                  Total Dividend:{" "}
                  <span className="text-green-600">{formatCurrency(totalDividend)}</span>
                </p>
                <p>
                  Net Flow:{" "}
                  <span className={netFlow >= 0 ? "text-green-600" : "text-red-600"}>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="sm:px-2">
      {endDate && (
        <Text className="sm:text-sm italic text-xs font-subheading text-brown text-right">
          Data as of: {formatDate(endDate)}
        </Text>
      )}
      <div className="flex justify-between items-center mb-4">
        <Heading className="text-3xl font-bold mb-4 mt-4">
          Welcome, {clientName}
        </Heading>
      </div>
      {renderContent()}
    </div>
  );
};

export default ManagedAccountDashboard;
