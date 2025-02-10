"use client";
import React, { useState, useRef, useMemo, useEffect } from "react";
import DefaultLayout from "@/components/Layouts/Layouts";
import useManagedAccounts from "@/hooks/useManagedAccounts";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Heading from "./common/Heading";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/20/solid";
import useFetchBenchmarkData from "@/hooks/useFetchBenchmarkData";
import Text from "./common/Text";
import YearlyMonthlyPLTable from "./MonthlyPLTableManagedAccounts";
import useMobileWidth from "@/hooks/useMobileWidth";
const TrailingReturns = ({ trailingReturns, ddStats }) => {
  const periods = Object.keys(trailingReturns.portfolioReturns);
  return (
    <div className="my-6 bg-white p-1 rounded-lg shadow">
      <h2 className="text-xs sm:text-xl font-bold mb-4">Trailing Returns & Drawdown</h2>
      <div className="overflow-x-auto border text-xs sm:text-sm border-brown rounded-lg">
        <table className="min-w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-lightBeige">
              <th className="w-1/10  p-1 text-left border border-brown font-semibold">Return Type</th>
              {periods.map((period) => (
                <th key={period} className="w-1/10 border p-18 border-brown text-center font-semibold">
                  {period}
                </th>
              ))}
              <th className="w-1/12 border p-18 border-brown text-center font-semibold">Current DD</th>
              <th className="w-1/12 border p-18 border-brown text-center font-semibold">Max DD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-1 border-brown font-medium">Portfolio (%)</td>
              {periods.map((period) => (
                <td key={period} className="border p-1 border-brown text-center">
                  {trailingReturns.portfolioReturns[period] !== null
                    ? trailingReturns.portfolioReturns[period].toFixed(2)
                    : "N/A"}
                </td>
              ))}
              <td className="border p-1 border-brown text-center">
                {ddStats.portfolio.currentDD !== null
                  ? ddStats.portfolio.currentDD.toFixed(2)
                  : "N/A"}
              </td>
              <td className="border p-1 border-brown text-center">
                {ddStats.portfolio.maxDD !== null
                  ? ddStats.portfolio.maxDD.toFixed(2)
                  : "N/A"}
              </td>
            </tr>
            <tr>
              <td className="border p-1 border-brown font-medium">Nifty 50 (%)</td>
              {periods.map((period) => (
                <td key={period} className="border p-1 border-brown text-center">
                  {trailingReturns.benchmarkReturns[period] !== null
                    ? trailingReturns.benchmarkReturns[period].toFixed(2)
                    : "N/A"}
                </td>
              ))}
              <td className="border p-1 border-brown text-center">
                {ddStats.benchmark.currentDD !== null
                  ? ddStats.benchmark.currentDD.toFixed(2)
                  : "N/A"}
              </td>
              <td className="border p-1 border-brown text-center">
                {ddStats.benchmark.maxDD !== null
                  ? ddStats.benchmark.maxDD.toFixed(2)
                  : "N/A"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

};

const ManagedAccountDashboard = ({ accountCodes, accountNames }) => {
  const isSarlaAccount = Array.isArray(accountNames)
    ? accountNames.includes("Sarla Performance fibers")
    : accountNames === "Sarla Performance fibers";

  // State Hooks
  const [activeScheme, setActiveScheme] = useState("Scheme Total");
  const [theme, setTheme] = useState("light");
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useMobileWidth();

  // Refs for charts
  const navChartRef = useRef(null);
  const drawdownChartRef = useRef(null);

  // Custom Hook to fetch data
  const {
    data,
    totals,
    cashInOutData,
    username,
    schemeWiseCapitalInvested,
    loading,
    error,
  } = useManagedAccounts();

  // Theme Colors
  const themeColors = {
    dark: {
      text: "#fee9d6",
      accent: "#d1a47b",
      gridLines: "#292929",
      background: "none",
      tooltipBg: "#000000",
      tooltipBorder: "#000000",
      donutColors: ["#D1A47B", "#fee9d6", "#A3C1AD", "#C5B5E3", "#F7A072"],
    },
    light: {
      text: "#333333",
      accent: "#3b82f6",
      gridLines: "#d3d3d3",
      background: "#ffffff",
      tooltipBg: "#ffffff",
      tooltipBorder: "#cccccc",
      donutColors: [
        "#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706",
        "#0891b2", "#6d28d9", "#be185d", "#15803d", "#b45309",
        "#4f46e5", "#9333ea", "#16a34a", "#e11d48", "#0284c7",
      ],
    },
  };
  const colors = themeColors[theme];

  // Determine the strategy name based on active scheme
  const getStrategyName = (schemeName) => {
    if (schemeName === "Scheme Total") {
      return `${accountNames} Zerodha Total Portfolio`;
    }
    const match = schemeName.match(/Scheme\s+([A-Z])/);
    if (match && match[1]) {
      const portfolioWithLetter = `${accountNames} Zerodha Total Portfolio ${match[1]}`;
      const portfolioWithoutLetter = `${accountNames} Zerodha Total Portfolio`;
      if (data && Array.isArray(data)) {
        const schemeData = data.find((scheme) => scheme.schemeName === schemeName);
        if (schemeData?.strategies?.some((s) => s.strategy === portfolioWithLetter)) {
          return portfolioWithLetter;
        }
      }
      return portfolioWithoutLetter;
    }
    return `${accountNames} Zerodha Total Portfolio`;
  };

  const strategyName = useMemo(() => getStrategyName(activeScheme), [activeScheme]);

  // Find active scheme data
  const activeSchemeData = useMemo(() => {
    if (!Array.isArray(data)) return null;
    return data.find((scheme) => scheme.schemeName === activeScheme);
  }, [data, activeScheme]);

  // Get the relevant strategy data
  const ac5ZerodhaData = useMemo(() => {
    return activeSchemeData?.strategies.find(
      (strategy) => strategy.strategy === strategyName
    )?.masterSheetData || [];
  }, [activeSchemeData, strategyName]);

  // Sort the data by date
  const sortedData = useMemo(() => {
    return [...ac5ZerodhaData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [ac5ZerodhaData]);

  // Normalize NAV Data (Portfolio)
  const normalizedData = useMemo(() => {
    if (sortedData.length === 0) return [];
    const firstNav = parseFloat(sortedData[0].nav);
    return sortedData
      .map((sheet) => {
        const date = new Date(sheet.date);
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", sheet.date);
          return null;
        }
        // Reset the time portion to midnight
        date.setHours(0, 0, 0, 0);

        const nav = parseFloat(sheet.nav);
        return [
          date.getTime(), // timestamp at local midnight
          nav === 0 || isNaN(nav) ? 0 : (nav / firstNav) * 100, // normalized value
        ];
      })
      .filter((point) => point !== null);
  }, [sortedData]);


  // ─── CALCULATE MONTHLY P&L BASED ON LAST DATES OF PREVIOUS & CURRENT MONTH ─────────
  const monthlyPnLFromNormalizedData = useMemo(() => {
    if (normalizedData.length === 0) return [];

    // Group all normalized data points by month
    const dataByMonth = {};
    normalizedData.forEach(([timestamp, value]) => {
      const date = new Date(timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = [];
      }
      dataByMonth[monthKey].push({ timestamp, value });
    });

    // Sort data points within each month by timestamp
    Object.keys(dataByMonth).forEach(monthKey => {
      dataByMonth[monthKey].sort((a, b) => a.timestamp - b.timestamp);
    });

    const sortedMonthKeys = Object.keys(dataByMonth).sort();
    const monthlyPnLArray = [];

    sortedMonthKeys.forEach((monthKey, idx) => {
      const currentMonthData = dataByMonth[monthKey];
      const previousMonthKey = sortedMonthKeys[idx - 1];

      // If this is the first month with data
      if (idx === 0) {
        const firstDayValue = currentMonthData[0].value;
        const lastDayValue = currentMonthData[currentMonthData.length - 1].value;

        monthlyPnLArray.push({
          month: monthKey,
          previousMonth: monthKey, // Same as current month for first entry
          startDate: new Date(currentMonthData[0].timestamp).toISOString().split("T")[0],
          endDate: new Date(currentMonthData[currentMonthData.length - 1].timestamp).toISOString().split("T")[0],
          startValue: firstDayValue,
          endValue: lastDayValue,
          pnlAbsolute: lastDayValue - firstDayValue,
          pnlPercentage: firstDayValue !== 0 ? ((lastDayValue / firstDayValue) - 1) * 100 : 0
        });
      } else {
        // For subsequent months
        const previousMonthData = dataByMonth[previousMonthKey];
        const startValue = previousMonthData[previousMonthData.length - 1].value; // Last value of previous month
        const endValue = currentMonthData[currentMonthData.length - 1].value; // Last value of current month

        monthlyPnLArray.push({
          month: monthKey,
          previousMonth: previousMonthKey,
          startDate: new Date(previousMonthData[previousMonthData.length - 1].timestamp).toISOString().split("T")[0],
          endDate: new Date(currentMonthData[currentMonthData.length - 1].timestamp).toISOString().split("T")[0],
          startValue,
          endValue,
          pnlAbsolute: endValue - startValue,
          pnlPercentage: startValue !== 0 ? ((endValue / startValue) - 1) * 100 : 0
        });
      }
    });

    return monthlyPnLArray;
  }, [normalizedData]);

  // Prepare data for the Donut Chart (Strategy-wise Allocation)
  const schemeForDonut = useMemo(() => {
    if (!isSarlaAccount && Array.isArray(data)) {
      return data.find((scheme) => scheme.schemeName !== "Scheme Total");
    }
    return activeSchemeData;
  }, [isSarlaAccount, data, activeSchemeData]);

  const allocationData = useMemo(() => {
    if (!isSarlaAccount) {
      if (!schemeForDonut || !schemeForDonut.strategies) return [];
      const strategies = schemeForDonut.strategies;
      const totalStrategyName = getStrategyName(schemeForDonut.schemeName);
      const latestValues = strategies
        .map((strategy) => {
          const sortedStrategyData = [...strategy.masterSheetData].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          const latestEntry = sortedStrategyData[0];
          const parsedValue = parseFloat(latestEntry?.portfolio_value) || 0;
          //console.log(strategy.strategy, parsedValue);
          return {
            name: strategy.strategy,
            y: parsedValue,
          };
        })
        .filter(
          (strategy) => strategy.y !== 0 && strategy.name !== totalStrategyName
        );

      const total = latestValues.reduce((sum, strategy) => sum + strategy.y, 0);
      return latestValues.map((strategy) => ({
        name: strategy.name,
        y: strategy.y,
        percentage: total > 0 ? ((strategy.y / total) * 100).toFixed(2) : 0,
      }));
    } else {
      if (activeScheme === "Scheme Total") {
        if (!schemeWiseCapitalInvested) return [];
        const totalInvested = totals.totalCapitalInvested;
        return Object.keys(schemeWiseCapitalInvested).map((scheme) => {
          const value = schemeWiseCapitalInvested[scheme];
          return {
            name: scheme,
            y: value,
            percentage: totalInvested > 0 ? ((value / totalInvested) * 100).toFixed(2) : 0,
          };
        });
      } else {
        if (!activeSchemeData) return [];
        const strategies = activeSchemeData.strategies;
        const totalStrategyName = getStrategyName(activeScheme);
        const latestValues = strategies
          .map((strategy) => {
            const sortedStrategyData = [...strategy.masterSheetData].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );
            const latestEntry = sortedStrategyData[0];
            const parsedValue = parseFloat(latestEntry.portfolio_value) || 0;
            return {
              name: strategy.strategy,
              y: parsedValue,
            };
          })
          .filter(
            (strategy) => strategy.y !== 0 && strategy.name !== totalStrategyName
          );
        const total = latestValues.reduce((sum, strategy) => sum + strategy.y, 0);
        return latestValues.map((strategy) => ({
          name: strategy.name,
          y: strategy.y,
          percentage: total > 0 ? ((strategy.y / total) * 100).toFixed(2) : 0,
        }));
      }
    }
  }, [
    activeScheme,
    activeSchemeData,
    schemeWiseCapitalInvested,
    totals.totalCapitalInvested,
    isSarlaAccount,
    schemeForDonut,
  ]);

  const filteredCashInOutData = useMemo(() => {
    return activeScheme === "Scheme Total"
      ? cashInOutData
      : cashInOutData.filter((record) => record.scheme === activeScheme);
  }, [cashInOutData, activeScheme]);
  // Define benchmark indices
  const benchmarkIndices = ["NIFTY 50"];
  // Get start and end dates from strategies data
  const { startDate, endDate } = useMemo(() => {
    if (!activeSchemeData?.strategies) return { startDate: null, endDate: null };
    const allDates = activeSchemeData.strategies
      .flatMap((strategy) => strategy.masterSheetData)
      .map((entry) => new Date(entry.date));
    if (allDates.length === 0) return { startDate: null, endDate: null };
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    return {
      startDate: minDate.toISOString().split("T")[0],
      endDate: maxDate.toISOString().split("T")[0],
    };
  }, [activeSchemeData]);

  // Fetch benchmark data using start and end dates
  const {
    benchmarkData,
    isLoading: isBenchmarkLoading,
    error: benchmarkError,
  } = useFetchBenchmarkData(
    benchmarkIndices,
    startDate && endDate ? startDate : null,
    startDate && endDate ? endDate : null
  );

  // Prepare benchmark series data
  const benchmarkSeries = useMemo(() => {
    if (!benchmarkData || Object.keys(benchmarkData).length === 0) {
      //console.log("benchmarkData is empty or not provided");
      return [];
    }
    const benchmarkArray = Object.values(benchmarkData);
    if (!Array.isArray(benchmarkArray) || benchmarkArray.length === 0) {
      //console.log("benchmarkArray is not an array or is empty");
      return [];
    }
    const sortedBenchmarkData = benchmarkArray
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    //console.log("sortedBenchmarkData:", sortedBenchmarkData);

    const portfolioStartTimestamp = normalizedData.length ? normalizedData[0][0] : null;
    let filteredBenchmarkData = sortedBenchmarkData;
    if (portfolioStartTimestamp) {
      filteredBenchmarkData = sortedBenchmarkData.filter(
        (item) => {
          const d = new Date(item.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() >= portfolioStartTimestamp;
        }
      );
      // If the first benchmark date doesn't match the portfolio start date, add an entry
      if (
        filteredBenchmarkData.length &&
        (new Date(filteredBenchmarkData[0].date).setHours(0, 0, 0, 0)) !== portfolioStartTimestamp
      ) {
        // Create a new Date from the portfolioStartTimestamp and set its time to midnight (it should already be)
        const normalizedStartDate = new Date(portfolioStartTimestamp);
        filteredBenchmarkData.unshift({
          date: normalizedStartDate.toISOString().split("T")[0], // "YYYY-MM-DD"
          nav: filteredBenchmarkData[0].nav,
        });
      }
    }
    const firstNavValue = parseFloat(filteredBenchmarkData[0].nav);
    let previousNavValue = firstNavValue;
    const normalizedDataBenchmark = filteredBenchmarkData.map((item) => {
      // Normalize the date to midnight
      const dateObj = new Date(item.date);
      dateObj.setHours(0, 0, 0, 0);
      const currentDate = dateObj.getTime();

      let currentNavValue = parseFloat(item.nav);
      if (isNaN(currentNavValue)) {
        currentNavValue = previousNavValue;
      } else {
        previousNavValue = currentNavValue;
      }
      return [currentDate, (currentNavValue / firstNavValue) * 100];
    });
    return [
      {
        name: "Nifty 50",
        data: normalizedDataBenchmark,
        type: "line",
        color: "#945c39",
        dashStyle: "line",
        marker: { enabled: false },
        tooltip: {
          valueDecimals: 2,
          valueSuffix: " %",
        },
        zIndex: 1,
      },
    ];
  }, [benchmarkData, normalizedData]);

  // Prepare data for Drawdown Chart
  const drawdownData = useMemo(() => {
    if (sortedData.length === 0) return [];
    return sortedData
      .map((sheet) => {
        const date = new Date(sheet.date);
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", sheet.date);
          return null;
        }
        const drawdown = parseFloat(sheet.drawdown * 100) || 0;
        return [date.getTime(), drawdown];
      })
      .filter((point) => point !== null);
  }, [sortedData]);

  // Calculate financial numbers for the active scheme
  const {
    latestPortfolioValue,
    latestPreviousValue,
    totalProfit,
    dailyPercentageChange,
    returns,
  } = useMemo(() => {
    if (!activeSchemeData)
      return {
        latestPortfolioValue: 0,
        latestPreviousValue: 0,
        totalProfit: 0,
        dailyPercentageChange: 0,
        returns: 0,
      };

    const totalSchemeName = getStrategyName(activeScheme);
    //console.log("totalSchemeName:", totalSchemeName);

    // Use Array.find to locate the correct strategy object
    const strategyObj = activeSchemeData.strategies.find(
      (s) => s.strategy === totalSchemeName
    );
    //console.log("strategyObj:", strategyObj);

    const strategiesData = strategyObj?.masterSheetData;
    //console.log("strategiesData:", strategiesData);

    const latestRecord =
      strategiesData && strategiesData.length > 0 ? strategiesData[strategiesData.length - 1] : null;
    //console.log("latestRecord:", latestRecord);

    const latestPortfolioValue = latestRecord
      ? parseFloat(latestRecord.portfolio_value) || 0
      : 0;
    const latestPreviousValue = latestRecord
      ? parseFloat(latestRecord.daily_pl) || 0
      : 0;
    const investment =
      activeScheme === "Scheme Total"
        ? totals.totalCapitalInvested
        : schemeWiseCapitalInvested[activeScheme];
    const totalProfit = latestPortfolioValue - investment;
    const firstEntry = strategiesData && strategiesData[0];
    const lastEntry = latestRecord;
    const startDate = new Date(firstEntry?.date);
    const endDate = new Date(lastEntry?.date);

    const holdingPeriodDays = Math.floor(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );
    let returns = 0;
    if (investment > 0) {
      if (holdingPeriodDays <= 365) {
        returns = (totalProfit / investment) * 100;
      } else {
        const years = holdingPeriodDays / 365;
        returns = (Math.pow(latestPortfolioValue / investment, 1 / years) - 1) * 100;
      }
    }
    let dailyPercentageChange = 0;
    if (latestRecord) {
      const lastEntryDailyPL = latestRecord.daily_pl__ || 0;
      if (lastEntryDailyPL !== 0) {
        dailyPercentageChange = lastEntryDailyPL;
      } else if (strategiesData) {
        const sumDaily = strategiesData.reduce(
          (acc, entry) => acc + (entry.daily_pl__ || 0),
          0
        );
        dailyPercentageChange = sumDaily / strategiesData.length;
      }
    }
    return {
      latestPortfolioValue,
      latestPreviousValue,
      totalProfit,
      dailyPercentageChange,
      returns,
    };
  }, [activeSchemeData, activeScheme, totals.totalCapitalInvested, schemeWiseCapitalInvested]);

  // ─── CUSTOM SERIES VISIBILITY STATE & TOGGLERS ──────────────────────────────
  const [navSeriesVisibility, setNavSeriesVisibility] = useState(() => {
    const initial = [{ name: "Portfolio NAV", visible: true }];
    if (benchmarkSeries && benchmarkSeries.length > 0) {
      benchmarkSeries.forEach((series) =>
        initial.push({ name: series.name, visible: true })
      );
    }
    return initial;
  });

  useEffect(() => {
    const initial = [{ name: "Portfolio NAV", visible: true }];
    if (benchmarkSeries && benchmarkSeries.length > 0) {
      benchmarkSeries.forEach((series) =>
        initial.push({ name: series.name, visible: true })
      );
    }
    setNavSeriesVisibility(initial);
  }, [benchmarkSeries]);

  const toggleNavSeries = (index) => {
    const newVisibility = [...navSeriesVisibility];
    newVisibility[index].visible = !newVisibility[index].visible;
    setNavSeriesVisibility(newVisibility);
    if (navChartRef.current && navChartRef.current.chart?.series[index]) {
      navChartRef.current.chart.series[index].setVisible(newVisibility[index].visible);
    }
  };

  const [drawdownSeriesVisibility, setDrawdownSeriesVisibility] = useState([
    { name: "Portfolio", visible: true },
    { name: "Nifty 50", visible: true },
  ]);

  const toggleDrawdownSeries = (index) => {
    const newVisibility = [...drawdownSeriesVisibility];
    newVisibility[index].visible = !newVisibility[index].visible;
    setDrawdownSeriesVisibility(newVisibility);
    if (drawdownChartRef.current && drawdownChartRef.current.chart?.series[index]) {
      drawdownChartRef.current.chart.series[index].setVisible(newVisibility[index].visible);
    }
  };
  // ─── CHART OPTIONS ─────────────────────────────────────────────────────────────
  const navChartOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        backgroundColor: colors.background,
      },
      title: {
        text: "NAV Performance vs Benchmark",
        style: { color: colors.text },
      },
      subtitle:
        startDate && endDate
          ? {
            text: `From ${Highcharts.dateFormat(
              "%d-%m-%Y",
              new Date(startDate)
            )} to ${Highcharts.dateFormat("%d-%m-%Y", new Date(endDate))}`,
            style: { color: colors.text, fontSize: "0" },
          }
          : undefined,
      xAxis: {
        type: "datetime",
        gridLineColor: colors.gridLines,
        labels: { style: { color: colors.text } },
        tickWidth: isMobile ? 0 : 1,
        responsive: {
          rules: [{
            condition: {
              maxWidth: 768 // Mobile breakpoint
            },
            chartOptions: {
              xAxis: {
                tickLength: 0,
                labels: {
                  step: 2 // Show fewer labels on mobile
                }
              }
            }
          }, {
            condition: {
              minWidth: 769 // Desktop breakpoint
            },
            chartOptions: {
              xAxis: {
                tickLength: 6, // Show ticks on desktop
                labels: {
                  step: 1 // Show all labels on desktop
                }
              }
            }
          }]
        }
      },
      yAxis: {
        title: {
          text: "",
          style: { color: colors.text },
        },
        gridLineColor: colors.gridLines,
        labels: { style: { color: colors.text } },
        tickWidth: isMobile ? 0 : 1,

      },
      series: [
        {
          name: "Portfolio NAV",
          data: normalizedData,
          color: colors.accent,
          marker: { enabled: false },
          tooltip: { valueDecimals: 2, valueSuffix: " %" },
          zIndex: 2,
          visible: navSeriesVisibility[0]?.visible ?? true,
        },
        ...benchmarkSeries.map((series, idx) => ({
          ...series,
          visible: navSeriesVisibility[idx + 1]?.visible ?? true,
        })),
      ],
      tooltip: {
        shared: true,
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        style: { color: colors.text },
      },
      legend: { enabled: false },
    }),
    [normalizedData, benchmarkSeries, colors, startDate, endDate, navSeriesVisibility, isMobile]
  );


  const drawdownChartOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        backgroundColor: colors.background,
      },
      title: {
        text: "Drawdown Analysis",
        style: { color: colors.text },
      },
      xAxis: {
        type: "datetime",
        gridLineColor: colors.gridLines,
        labels: { style: { color: colors.text } },
      },
      yAxis: {
        title: {
          text: "",
          style: { color: colors.text },
        },
        gridLineColor: colors.gridLines,
        labels: { style: { color: colors.text } },
      },
      series: [
        {
          name: "Portfolio",
          data: drawdownData,
          type: "area",
          color: "#FF4D4D", // Darker pink base color
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "#FF6666"], // Darker pink at top
              [1, Highcharts.color("#FF8080").setOpacity(0.4).get("rgba")] // Semi-transparent medium pink at bottom
            ]
          },
          zones: [
            {
              value: -10,
              color: "#FF3333" // Darker pink for mild drawdown
            },
            {
              color: "#FF0000" // Deep red for severe drawdown
            }
          ],
          zIndex: 2,
          marker: { enabled: false },
          visible: drawdownSeriesVisibility[0].visible,
        },
        {
          name: "Nifty 50 ",
          data: (() => {
            if (!benchmarkData || Object.keys(benchmarkData).length === 0) return [];
            const benchmarkArray = Object.values(benchmarkData);
            if (!Array.isArray(benchmarkArray) || benchmarkArray.length === 0)
              return [];
            const sortedData = benchmarkArray
              .slice()
              .sort((a, b) => new Date(a.date) - new Date(b.date));
            let maxValue = -Infinity;
            let previousValue = null;
            return sortedData
              .map((point) => {
                const currentDate = new Date(point.date).getTime();
                let value = parseFloat(point.nav);
                if (isNaN(value)) {
                  value = previousValue;
                } else {
                  previousValue = value;
                }
                if (value !== null) {
                  maxValue = Math.max(maxValue, value);
                  const drawdown = ((value - maxValue) / maxValue) * 100;
                  return [currentDate, drawdown];
                }
                return null;
              })
              .filter((point) => point !== null);
          })(),
          type: "area",
          color: "#FFCDD2", // Lighter red base color
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "#FFCDD2"], // Light red at top
              [1, Highcharts.color("#FFEBEE").setOpacity(0.3).get("rgba")] // Very light red with transparency at bottom
            ]
          },
          dashStyle: "line",
          zones: [
            {
              value: -10,
              color: "#EF9A9A" // Medium red for mild drawdown
            },
            {
              color: "#E57373" // Deeper red for severe drawdown
            }
          ],
          zIndex: 1,
          marker: { enabled: false },
          visible: drawdownSeriesVisibility[1].visible,
        },
      ],

      tooltip: {
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        style: { color: colors.text },
        valueDecimals: 2,
        valueSuffix: " %",
      },
      legend: { enabled: false },
    }),
    [drawdownData, colors, benchmarkData, drawdownSeriesVisibility]
  );

  const chartColors = {
    background: "#ffffff",
    text: "#2d3748",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0",
    donutColors: [
      "#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706",
      "#0891b2", "#6d28d9", "#be185d", "#15803d", "#b45309",
      "#4f46e5", "#9333ea", "#16a34a", "#e11d48", "#0284c7",
    ],
  };
  const donutChartOptions = {
    chart: {
      type: "pie",
      backgroundColor: chartColors.background,
      height: 400,
      style: {
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    title: {
      text: !isSarlaAccount && schemeForDonut
        ? `Strategy-wise Allocation - ${schemeForDonut.schemeName}`
        : activeScheme === "Scheme Total"
          ? "Scheme-wise Allocation"
          : `Strategy-wise Allocation - ${activeScheme}`,
      align: "left",
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: chartColors.text,
      },
    },
    tooltip: {
      formatter: function () {
        const formattedValue = this.point.y.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `
          <div style="padding: 8px">
            <div style="font-weight: 600">${this.point.name}</div>
            <div>Allocation: ${this.point.percentage.toFixed(2)}%</div>
          </div>
        `;
      },
      backgroundColor: chartColors.tooltipBg,
      borderColor: chartColors.tooltipBorder,
      borderRadius: 8,
      style: { color: chartColors.text, fontSize: "12px" },
      useHTML: true,
    },
    accessibility: {
      announceNewData: { enabled: true },
      point: { valueSuffix: "%" },
    },
    plotOptions: {
      pie: {
        innerSize: "50%",
        allowPointSelect: true,
        cursor: "pointer",
        colors: chartColors.donutColors,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return `<b>${this.point.name}</b><br>${this.point.percentage.toFixed(2)}%`;
          },
          style: {
            color: chartColors.text,
            fontSize: "11px",
            textOutline: "1px contrast",
          },
          distance: 20,
        },
        startAngle: -90,
        endAngle: 270,
      },
    },
    series: [
      {
        name: "Allocation",
        colorByPoint: true,
        data: allocationData.map((item) => ({
          name: item.name,
          y: Math.abs(item.y),
          percentage: parseFloat(item.percentage),
        })),
      },
    ],
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      itemStyle: { color: chartColors.text, fontWeight: "normal" },
      itemHoverStyle: { color: "#718096" },
    },
    credits: { enabled: false },
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ddStats = useMemo(() => {
    let portfolioCurrentDD = null;
    let portfolioMaxDD = null;
    let benchmarkCurrentDD = null;
    let benchmarkMaxDD = null;

    if (drawdownData.length > 0) {
      portfolioCurrentDD = drawdownData[drawdownData.length - 1][1];
      portfolioMaxDD = Math.min(...drawdownData.map((point) => point[1]));
    }

    if (benchmarkSeries.length && benchmarkSeries[0].data && benchmarkSeries[0].data.length > 0) {
      const benchData = benchmarkSeries[0].data;
      let runningMax = benchData[0][1];
      const drawdowns = benchData.map((point) => {
        const price = point[1];
        runningMax = Math.max(runningMax, price);
        const drawdown = ((price - runningMax) / runningMax) * 100;
        return drawdown;
      });

      benchmarkCurrentDD = drawdowns[drawdowns.length - 1];
      benchmarkMaxDD = Math.min(...drawdowns);
    }

    return {
      portfolio: { currentDD: portfolioCurrentDD, maxDD: portfolioMaxDD },
      benchmark: { currentDD: benchmarkCurrentDD, maxDD: benchmarkMaxDD },
    };
  }, [drawdownData, benchmarkSeries]);

  const cashFlowTotals = useMemo(() => {
    const totalIn = filteredCashInOutData
      .filter((record) => record.capital_in_out > 0)
      .reduce((sum, record) => sum + record.capital_in_out, 0);
    const totalOut = filteredCashInOutData
      .filter((record) => record.capital_in_out < 0)
      .reduce((sum, record) => sum + Math.abs(record.capital_in_out), 0);
    const netFlow = totalIn - totalOut;
    return { totalIn, totalOut, netFlow };
  }, [filteredCashInOutData]);

  const isPositive = dailyPercentageChange >= 0;

  const trailingReturns = useMemo(() => {
    const periods = {
      "5d": 5,
      "10d": 10,
      "15d": 15,
      "1m": 30,
      "1y": 365,
      "2y": 730,
      "3y": 1095,
    };
    const getTrailingReturn = (series, days) => {
      const periodMs = days * 24 * 60 * 60 * 1000;
      if (!series.length) return null;
      const lastPoint = series[series.length - 1];
      const targetTime = lastPoint[0] - periodMs;
      let index = series.length - 1;
      while (index >= 0 && series[index][0] > targetTime) {
        index--;
      }
      if (index < 0) return null;
      const baseValue = series[index][1];
      if (baseValue === 0) return null;
      const trailingReturn = ((lastPoint[1] / baseValue) - 1) * 100;
      return trailingReturn;
    };
    const portfolioReturns = {};
    const benchmarkReturns = {};
    for (const period in periods) {
      portfolioReturns[period] = getTrailingReturn(normalizedData, periods[period]);
      if (benchmarkSeries.length && benchmarkSeries[0].data) {
        benchmarkReturns[period] = getTrailingReturn(benchmarkSeries[0].data, periods[period]);
      } else {
        benchmarkReturns[period] = null;
      }
    }
    return { portfolioReturns, benchmarkReturns };
  }, [normalizedData, benchmarkSeries]);

  const calculateReturn = (normalizedData) => {
    if (normalizedData.length === 0) return 0;

    const startTimestamp = normalizedData[0][0];
    const endTimestamp = normalizedData[normalizedData.length - 1][0];
    const startValue = normalizedData[0][1];
    const endValue = normalizedData[normalizedData.length - 1][1];

    // Calculate the total return in decimal form (e.g., 0.25 for 25%)
    const totalReturnDecimal = (endValue / startValue) - 1;

    // Calculate the holding period in years
    const holdingPeriodYears = (endTimestamp - startTimestamp) / (365 * 24 * 60 * 60 * 1000);

    // If holding period is 1 year or more, compute annualized return (CAGR)
    if (holdingPeriodYears >= 1) {
      const annualizedReturn = (Math.pow(1 + totalReturnDecimal, 1 / holdingPeriodYears) - 1) * 100;
      return annualizedReturn;
    } else {
      // If less than 1 year, return the absolute return percentage
      return totalReturnDecimal * 100;
    }
  };

  // Usage example inside a useMemo hook to recalc when normalizedData changes:
  const returnsValue = useMemo(() => {
    return calculateReturn(normalizedData);
  }, [normalizedData]);


  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (error) {
      return <div className="p-1 text-red-500">Error: {error}</div>;
    }
    if (!Array.isArray(data)) {
      return <div className="p-1 text-red-500">No data available.</div>;
    }
    //console.log("accountNames:", accountNames);
    return (
      <>
        {isSarlaAccount ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-6">
            <label htmlFor="scheme-select" className="text-xs sm:text-sm font-medium">
              Select Scheme:
            </label>
            <select
              id="scheme-select"
              value={activeScheme}
              onChange={(e) => setActiveScheme(e.target.value)}
              className="p-1 rounded border border-brown text-gray-700"
            >
              {data.map(({ schemeName }) => (
                <option key={schemeName} value={schemeName}>
                  {schemeName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-xs sm:text-sm font-medium"></h3>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1 mb-6">
          <div className="p-1 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Amount Invested</h3>
            <p className="mt-2 text-base">
              ₹
              {activeScheme === "Scheme Total"
                ? totals.totalCapitalInvested.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
                : schemeWiseCapitalInvested[activeScheme].toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>
          <div className="p-1 bg-white rounded-lg shadow flex-1">
            <h3 className="text-xs sm:text-lg font-medium">Current Portfolio Value</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-base">
                ₹{latestPortfolioValue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>

            </div>
          </div>

          <div className="p-1 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Returns</h3>
            <div className="mt-2 flex justify-between items-baseline gap-1">
              <span className={`text-xs sm:text-xl font-semibold ${returns >= 0 ? "text-green-500" : "text-red-500"}`}>
                {returnsValue.toFixed(2)}%
              </span>
              <div className={`flex items-end text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? (
                  <ArrowUpIcon className="h-18 w-18" />
                ) : (
                  <ArrowDownIcon className="h-18 w-18" />
                )}
                <span>{dailyPercentageChange.toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <div className="p-1 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Total Profit</h3>
            <div className="mt-2 flex justify-between items-baseline gap-1">
              <p
                className={`text-base ${totalProfit >= 0 ? "text-green-500" : "text-red-500"
                  }`}
              >
                ₹{totalProfit.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <div className=" flex items-center">
                {latestPreviousValue >= 0 ? (
                  <ArrowUpIcon className="h-18 w-18 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-18 w-18 text-red-500" />
                )}
                <span
                  className={`text-sm ${latestPreviousValue >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                >
                  {latestPreviousValue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1 bg-white rounded-lg shadow">
            <h3 className="text-xs sm:text-lg font-medium">Total Dividends</h3>
            <p className="mt-2 text-base">
              ₹{totals.totalDividends.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <TrailingReturns trailingReturns={trailingReturns} ddStats={ddStats} />


        <div className="flex justify-between items-center mb-18 mt-18">
          {startDate && (
            <Text className="sm:text-sm italic text-xs font-subheading text-brown  text-left">
              Inception Date: {formatDate(startDate)}
            </Text>
          )}
        </div>

        <div className="bg-white p-0 sm:p-1 rounded-lg  shadow mb-6">
          {normalizedData.length ? (
            <>
              <div className="my-2 p-18">
                {navSeriesVisibility.map((series, index) => (
                  <label key={index} className="mr-2 text-xs sm:text-sm" style={{ color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={series.visible}
                      onChange={() => toggleNavSeries(index)}
                      className="mr-18"
                    />
                    {series.name}
                  </label>
                ))}
              </div>
              <HighchartsReact highcharts={Highcharts} options={navChartOptions} ref={navChartRef} />
            </>
          ) : (
            <div>No NAV data available.</div>
          )}
        </div>

        <div className="mb-6 bg-white sm:p-1 rounded-lg shadow">
          {drawdownData.length ? (
            <>
              <div className="my-2 p-18">
                {drawdownSeriesVisibility.map((series, index) => (
                  <label key={index} className="mr-18 p-18 text-xs sm:text-sm" style={{ color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={series.visible}
                      onChange={() => toggleDrawdownSeries(index)}
                      className="mr-18"
                    />
                    {series.name}
                  </label>
                ))}
              </div>
              <HighchartsReact highcharts={Highcharts} options={drawdownChartOptions} ref={drawdownChartRef} />
            </>
          ) : (
            <div>No drawdown data available.</div>
          )}
        </div>


        {/* Pass the monthly P&L computed using last dates of previous & current months */}
        <YearlyMonthlyPLTable monthlyPnL={monthlyPnLFromNormalizedData} />
        {(!isSarlaAccount || activeScheme !== "Scheme Total") && (
          <div className="mt-6 bg-white p-1 rounded-lg shadow">
            {allocationData.length ? (
              <HighchartsReact highcharts={Highcharts} options={donutChartOptions} />
            ) : (
              <div>No allocation data available.</div>
            )}
          </div>
        )}

        <div className="my-4 border rounded-lg">
          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-2 border-brown border rounded-lg bg-lightBeige  text-sm font-medium text-black  uppercase tracking-wider focus:outline-none"
          >
            <Text className="sm:text-sm italic text-xs font-subheading text-brown  text-left">Cash In/Out</Text>
            <span className="text-xs sm:text-xl">
              {isOpen ? "−" : "+"}
            </span>
          </button>

          {/* Accordion Content */}
          {isOpen && (
            <div className="sm:p-2">
              <div className="overflow-x-auto w-full rounded-lg border border-brown ">
                <table className="min-w-full bg-white ">
                  <thead className="bg-lightBeige">
                    <tr>
                      <th className="p-18  sm:p-1 border-b border-brown  text-left text-xs sm:text-sm  font-medium text-black  uppercase tracking-wider">
                        Date
                      </th>
                      <th className="p-18  sm:p-1 border-b border-brown  text-left text-xs sm:text-sm  font-medium text-black  uppercase tracking-wider">
                        Scheme
                      </th>
                      <th className="p-18  sm:p-1 border-b border-brown  text-right text-xs sm:text-sm  font-medium text-black  uppercase tracking-wider">
                        Cash In/Out
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCashInOutData.map((record, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 "
                      >
                        <td className="p-18  sm:p-1 border-b border-brown  text-xs sm:text-sm  text-gray-700 ">
                          {formatDate(record.date)}
                        </td>
                        <td className="p-18  sm:p-1 border-b border-brown  text-xs sm:text-sm  text-gray-700 ">
                          {record.scheme}
                        </td>
                        <td
                          className={`p-18  sm:p-1 border-b border-brown  text-xs sm:text-sm  text-right ${record.capital_in_out > 0
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                        >
                          {formatCurrency(record.capital_in_out)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100  font-semibold">
                      <td className="p-18  sm:p-1 border-t border-brown  text-xs sm:text-sm  text-gray-900 ">
                        Total
                      </td>
                      <td className="p-18  sm:p-1 border-t border-brown  text-xs sm:text-sm  text-right text-gray-900 "></td>
                      <td className="p-18  sm:p-1 border-t border-brown  text-xs sm:text-sm  text-right text-gray-900 ">
                        {formatCurrency(cashFlowTotals.netFlow)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs sm:text-sm  text-gray-600 ">
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
                      cashFlowTotals.netFlow >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(cashFlowTotals.netFlow)}
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
    <div className="p-0 sm:p-1">
      {endDate && (
        <Text className="sm:text-sm italic text-xs font-subheading text-brown  text-right">
          Data as of: {formatDate(endDate)}
        </Text>
      )}
      <div className="flex justify-between items-center mb-4">
        <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown  mb-18 mt-4">
          Welcome, {username}
        </Heading>
      </div>
      {renderContent()}
    </div>
  );
};

export default ManagedAccountDashboard;
