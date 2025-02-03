"use client";
import React, { useState, useRef, useMemo } from "react";
import DefaultLayout from "@/components/Layouts/Layouts";
import useManagedAccounts from "@/hooks/useManagedAccounts";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Heading from "./common/Heading";
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import useFetchBenchmarkData from "@/hooks/useFetchBenchmarkData";
import Text from "./common/Text";

const TrailingReturns = ({ trailingReturns, ddStats }) => {
  // Extract the periods (keys) from the trailing returns object
  const periods = Object.keys(trailingReturns.portfolioReturns);

  return (
    <div className="my-6 bg-white p-18  rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Trailing Returns & Drawdown</h2>
      <div className="overflow-x-auto border border-brown rounded-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-lightBeige text-black">
              <th className="border  border-brown p-18 text-left">Return Type</th>
              {periods.map((period) => (
                <th key={period} className="border border-brown p-18 text-center">
                  {period}
                </th>
              ))}
              <th className="border border-brown p-18 text-center">Current DD</th>
              <th className="border border-brown p-18 text-center">Max DD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-brown p-18 font-medium">Portfolio (%)</td>
              {periods.map((period) => (
                <td key={period} className="border border-brown p-18 text-center">
                  {trailingReturns.portfolioReturns[period] !== null
                    ? trailingReturns.portfolioReturns[period].toFixed(2)
                    : "N/A"}
                </td>
              ))}
              <td className="border border-brown p-18 text-center">
                {ddStats.portfolio.currentDD !== null
                  ? ddStats.portfolio.currentDD.toFixed(2)
                  : "N/A"}
              </td>
              <td className="border border-brown p-18 text-center">
                {ddStats.portfolio.maxDD !== null
                  ? ddStats.portfolio.maxDD.toFixed(2)
                  : "N/A"}
              </td>
            </tr>
            <tr>
              <td className="border border-brown p-18 font-medium">Nifty 50 (%)</td>
              {periods.map((period) => (
                <td key={period} className="border border-brown p-18 text-center">
                  {trailingReturns.benchmarkReturns[period] !== null
                    ? trailingReturns.benchmarkReturns[period].toFixed(2)
                    : "N/A"}
                </td>
              ))}
              <td className="border border-brown p-18 text-center">
                {ddStats.benchmark.currentDD !== null
                  ? ddStats.benchmark.currentDD.toFixed(2)
                  : "N/A"}
              </td>
              <td className="border border-brown p-18 text-center">
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

const ManagedAccountDashboard = ({ accountCodes }) => {
  // State Hooks
  const [activeScheme, setActiveScheme] = useState("Scheme Total");
  const [theme, setTheme] = useState("light");

  // Ref Hooks
  const chartComponentRef = useRef(null);

  // Custom Hook to fetch data
  const { data, totals, cashInOutData, username, schemeWiseCapitalInvested, loading, error } = useManagedAccounts();
  console.log('data', username);
  
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
      donutColors: ["#3b82f6", "#70a1ff", "#a1c4fd", "#c3dafe", "#e0f0ff"],
    },
  };
  const colors = themeColors[theme];

  // Function to determine the strategy name based on the active scheme
  const getStrategyName = (schemeName) => {
    if (schemeName === "Scheme Total") {
      return `${accountCodes} Zerodha Total Portfolio`;
    }

    // Check if the scheme name contains a letter (e.g., "Scheme A", "Scheme B")
    const match = schemeName.match(/Scheme\s+([A-Z])/);
    if (match && match[1]) {
      // First check if data exists for portfolio name with letter suffix
      const portfolioWithLetter = `${accountCodes} Zerodha Total Portfolio ${match[1]}`;
      const portfolioWithoutLetter = `${accountCodes} Zerodha Total Portfolio`;

      // Return the appropriate portfolio name based on what exists in the data
      if (data && Array.isArray(data)) {
        const schemeData = data.find(scheme => scheme.schemeName === schemeName);
        if (schemeData?.strategies?.some(s => s.strategy === portfolioWithLetter)) {
          return portfolioWithLetter;
        }
      }

      // If no match found with letter suffix, return without letter
      return portfolioWithoutLetter;
    }

    // Default case
    return `${accountCodes} Zerodha Total Portfolio`;
  };

  const strategyName = useMemo(() => getStrategyName(activeScheme), [activeScheme]);
  console.log(strategyName);

  // Find active scheme data
  const activeSchemeData = useMemo(() => {
    if (!Array.isArray(data)) return null;
    return data.find((scheme) => scheme.schemeName === activeScheme);
  }, [data, activeScheme]);

  // Fetch the relevant strategy data dynamically
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
          return null; // Skip invalid dates
        }
        const nav = parseFloat(sheet.nav);
        return [
          date.getTime(), // x value (timestamp)
          nav === 0 || isNaN(nav) ? 0 : (nav / firstNav) * 100, // y value normalized to 100
        ];
      })
      .filter((point) => point !== null); // Remove null values
  }, [sortedData]);

  // Prepare data for Donut Chart (Strategy-wise Allocation)
  // Prepare data for Donut Chart (Strategy-wise Allocation or Scheme-wise Allocation if Scheme Total)
const allocationData = useMemo(() => {
  if (activeScheme === "Scheme Total") {
    // For Scheme Total: aggregate allocation by scheme
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
    // For individual schemes: use strategy-wise allocation as before
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
      .filter((strategy) => strategy.y !== 0)
      .filter((strategy) => strategy.name !== totalStrategyName);
    const total = latestValues.reduce((sum, strategy) => sum + strategy.y, 0);
    return latestValues.map((strategy) => ({
      name: strategy.name,
      y: strategy.y,
      percentage: total > 0 ? ((strategy.y / total) * 100).toFixed(2) : 0,
    }));
  }
}, [activeScheme, activeSchemeData, schemeWiseCapitalInvested, totals.totalCapitalInvested]);


  const filteredCashInOutData = useMemo(() => {
    return activeScheme === "Scheme Total"
      ? cashInOutData
      : cashInOutData.filter(record => record.scheme === activeScheme);
  }, [cashInOutData, activeScheme]);

  // Define benchmark indices
  const benchmarkIndices = ["NIFTY 50"];

  // Get start and end dates from strategies data
  const { startDate, endDate } = useMemo(() => {
    if (!activeSchemeData?.strategies) return { startDate: null, endDate: null };

    // Flatten all masterSheetData from all strategies
    const allDates = activeSchemeData.strategies.flatMap(
      strategy => strategy.masterSheetData
    ).map(entry => new Date(entry.date));

    if (allDates.length === 0) return { startDate: null, endDate: null };

    // Find min and max dates
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    return {
      startDate: minDate.toISOString().split('T')[0],
      endDate: maxDate.toISOString().split('T')[0]
    };
  }, [activeSchemeData]);

  // Fetch benchmark data using the start and end dates from portfolio
  const { benchmarkData, isLoading: isBenchmarkLoading, error: benchmarkError } = useFetchBenchmarkData(
    benchmarkIndices,
    startDate && endDate ? startDate : null,
    startDate && endDate ? endDate : null
  );

  // Prepare benchmark series data
// Prepare benchmark series data
const benchmarkSeries = useMemo(() => {
  if (!benchmarkData || Object.keys(benchmarkData).length === 0) {
    console.log('benchmarkData is empty or not provided');
    return [];
  }

  // Transform benchmarkData into an array of objects
  const benchmarkArray = Object.values(benchmarkData);

  // Ensure the data is an array and not empty
  if (!Array.isArray(benchmarkArray) || benchmarkArray.length === 0) {
    console.log('benchmarkArray is not an array or is empty');
    return [];
  }

  // Sort the data by date to ensure chronological order
  const sortedBenchmarkData = benchmarkArray.slice().sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  console.log('sortedBenchmarkData:', sortedBenchmarkData);

  // Use portfolio's first timestamp from normalizedData as the benchmark start date.
  const portfolioStartTimestamp = normalizedData.length ? normalizedData[0][0] : null;

  let filteredBenchmarkData = sortedBenchmarkData;
  if (portfolioStartTimestamp) {
    // Filter out any benchmark records before the portfolio's first timestamp
    filteredBenchmarkData = sortedBenchmarkData.filter(
      item => new Date(item.date).getTime() >= portfolioStartTimestamp
    );
    // If the very first benchmark record is after the portfolio start timestamp,
    // prepend a new data point at the portfolio start timestamp using the first available value.
    if (filteredBenchmarkData.length && new Date(filteredBenchmarkData[0].date).getTime() !== portfolioStartTimestamp) {
      filteredBenchmarkData.unshift({
        date: new Date(portfolioStartTimestamp).toISOString().split('T')[0],
        nav: filteredBenchmarkData[0].nav
      });
    }
  }

  // Get the first NAV value for normalization from the filtered benchmark data
  const firstNavValue = parseFloat(filteredBenchmarkData[0].nav);
  console.log('firstNavValue:', firstNavValue);

  // Normalize the data to 100 and forward-fill missing dates
  let previousNavValue = firstNavValue;
  const normalizedDataBenchmark = filteredBenchmarkData.map(item => {
    const currentDate = new Date(item.date).getTime();
    let currentNavValue = parseFloat(item.nav);

    // Forward fill if NAV is missing or undefined
    if (isNaN(currentNavValue)) {
      currentNavValue = previousNavValue;
    } else {
      previousNavValue = currentNavValue;
    }

    // Normalize NAV to 100 based on the first NAV value
    return [currentDate, (currentNavValue / firstNavValue) * 100];
  });

  return [{
    name: 'Nifty 50',
    data: normalizedDataBenchmark,
    type: 'line',
    color: '#945c39',
    dashStyle: 'line',
    marker: {
      enabled: false
    },
    tooltip: {
      valueDecimals: 2,
      valueSuffix: ' %'
    },
    zIndex: 1,
  }];
}, [benchmarkData, normalizedData]);

  // Prepare data for Drawdown Chart
  const drawdownData = useMemo(() => {
    if (sortedData.length === 0) return [];
    return sortedData
      .map((sheet) => {
        const date = new Date(sheet.date);
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", sheet.date);
          return null; // Skip invalid dates
        }
        const drawdown = parseFloat((sheet.drawdown)*100) || 0;
        return [date.getTime(), drawdown];
      })
      .filter((point) => point !== null); // Remove null values
  }, [sortedData]);

  // Calculate financial numbers for the active scheme
  const { latestPortfolioValue, totalProfit, dailyPercentageChange, returns, monthlyPnL } = useMemo(() => {
    if (!activeSchemeData)
      return {
        totalInvestment: 0,
        latestPortfolioValue: 0,
        totalProfit: 0,
        dailyPercentageChange: 0,
        returns: 0,
        monthlyPnL: [],
      };
  
    // Flatten the masterSheetData from each strategy
    const strategiesData = activeSchemeData.strategies.flatMap(
      (strategy) => strategy.masterSheetData
    );
  
    // Get the latest portfolio value and investment amount
    const latestPortfolioValue = strategiesData.length > 0
      ? strategiesData[strategiesData.length - 1].portfolio_value || 0
      : 0;
  
    const investment = activeScheme === "Scheme Total"
      ? totals.totalCapitalInvested
      : schemeWiseCapitalInvested[activeScheme];
  
    const totalProfit = latestPortfolioValue - investment;
  
    // Calculate holding period in days
    const firstEntry = strategiesData[0];
    const lastEntry = strategiesData[strategiesData.length - 1];
    const startDate = new Date(firstEntry?.date);
    const endDate = new Date(lastEntry?.date);
    const holdingPeriodDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  
    // Calculate monthly PnL
    const monthlyPnL = strategiesData.reduce((acc, entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          pnl: 0,
          portfolioValue: 0,
          trades: 0
        };
      }
      
      // Add daily P&L to monthly total
      acc[monthKey].pnl += (entry.daily_pl__ || 0);
      acc[monthKey].portfolioValue = entry.portfolio_value || 0; // Latest portfolio value for the month
      acc[monthKey].trades += 1;
      
      return acc;
    }, {});
  
    // Convert monthly PnL object to sorted array
    const monthlyPnLArray = Object.values(monthlyPnL)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(month => ({
        ...month,
        pnl: Number(month.pnl.toFixed(2)),
        monthlyReturn: ((month.pnl / month.portfolioValue) * 100).toFixed(2)
      }));
  
    // Calculate returns
    let returns = 0;
    if (investment > 0) {
      if (holdingPeriodDays <= 365) {
        // Absolute return for period less than a year
        returns = (totalProfit / investment) * 100;
      } else {
        // XIRR calculation for period more than a year
        const years = holdingPeriodDays / 365;
        returns = (Math.pow((latestPortfolioValue / investment), 1 / years) - 1) * 100;
      }
    }
  
    // Calculate daily percentage change
    let dailyPercentageChange = 0;
    if (strategiesData.length > 0) {
      const lastEntryDailyPL = strategiesData[strategiesData.length - 1].daily_pl__ || 0;
      if (lastEntryDailyPL !== 0) {
        dailyPercentageChange = lastEntryDailyPL;
      } else {
        const sumDaily = strategiesData.reduce(
          (acc, entry) => acc + (entry.daily_pl__ || 0),
          0
        );
        dailyPercentageChange = sumDaily / strategiesData.length;
      }
    }
  
    return {
      latestPortfolioValue,
      totalProfit,
      dailyPercentageChange,
      returns,
      monthlyPnL: monthlyPnLArray
    };
  }, [activeSchemeData, activeScheme, totals.totalCapitalInvested, schemeWiseCapitalInvested]);
  
  // Update NAV chart options to include a subtitle with the inception and current data dates.
  const navChartOptions = useMemo(() => ({
    chart: {
      type: 'line',
      backgroundColor: colors.background,
    },
    title: {
      text: 'NAV Performance vs Benchmark',
      style: { color: colors.text }
    },
    // New subtitle added:
    subtitle: (startDate && endDate) ? {
      style: { color: colors.text, fontSize: '12px' }
    } : undefined,
    xAxis: {
      type: 'datetime',
      gridLineColor: colors.gridLines,
      labels: { style: { color: colors.text } }
    },
    yAxis: {
      title: {
        text: 'Normalized Value',
        style: { color: colors.text }
      },
      gridLineColor: colors.gridLines,
      labels: { style: { color: colors.text } }
    },
    series: [
      {
        name: 'Portfolio NAV',
        data: normalizedData,
        color: colors.accent,
        marker: {
          enabled: false
        },
        tooltip: {
          valueDecimals: 2,
          valueSuffix: ' %'
        },
        zIndex: 2,
      },
      ...benchmarkSeries
    ],
    tooltip: {
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.text }
    },
    legend: {
      itemStyle: { color: colors.text },
      itemHoverStyle: { color: colors.accent }
    }
  }), [normalizedData, benchmarkSeries, colors, startDate, endDate]);


  const chartColors = {
    background: '#ffffff',
    text: '#2d3748',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    donutColors: [
      '#2563eb', // Blue
      '#7c3aed', // Purple
      '#059669', // Green
      '#dc2626', // Red
      '#d97706', // Orange
      '#0891b2', // Cyan
      '#6d28d9', // Indigo
      '#be185d', // Pink
      '#15803d', // Emerald
      '#b45309', // Amber
      '#4f46e5', // Primary Blue
      '#9333ea', // Violet
      '#16a34a', // Success Green
      '#e11d48', // Rose
      '#0284c7', // Light Blue
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
      text:
        activeScheme === "Scheme Total"
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
      style: {
        color: chartColors.text,
        fontSize: "12px",
      },
      useHTML: true,
    },
    accessibility: {
      announceNewData: {
        enabled: true,
      },
      point: {
        valueSuffix: "%",
      },
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
            const formattedValue = this.point.y.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
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
          percentage: parseFloat(item.percentage), // Ensure percentage is a number
        })),
      },
    ],
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        color: chartColors.text,
        fontWeight: "normal",
      },
      itemHoverStyle: {
        color: "#718096",
      },
    },
    credits: { enabled: false },
  };
  

  const benchmarkDrawdownData = useMemo(() => {
    if (!benchmarkData || Object.keys(benchmarkData).length === 0) return [];

    const benchmarkArray = Object.values(benchmarkData);
    if (!Array.isArray(benchmarkArray) || benchmarkArray.length === 0) return [];

    const sortedData = benchmarkArray.slice().sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    let maxValue = -Infinity;
    let previousValue = null;
    
    return sortedData.map(point => {
      const currentDate = new Date(point.date).getTime();
      let value = parseFloat(point.nav);

      // Forward fill if value is missing
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
    }).filter(point => point !== null);
  }, [benchmarkData]);

  const ddStats = useMemo(() => {
    let portfolioCurrentDD = null;
    let portfolioMaxDD = null;
    let benchmarkCurrentDD = null;
    let benchmarkMaxDD = null;
  
    // Portfolio drawdowns are already calculated in drawdownData
    if (drawdownData.length > 0) {
      portfolioCurrentDD = drawdownData[drawdownData.length - 1][1];
      portfolioMaxDD = Math.min(...drawdownData.map(point => point[1]));
    }
  
    // Calculate benchmark drawdowns from price data
    if (benchmarkSeries.length && benchmarkSeries[0].data && benchmarkSeries[0].data.length > 0) {
      const benchData = benchmarkSeries[0].data;
      
      // Calculate running maximum (high water mark)
      let runningMax = benchData[0][1];  // Start with first price
      const drawdowns = benchData.map(point => {
        const price = point[1];
        runningMax = Math.max(runningMax, price);
        const drawdown = ((price - runningMax) / runningMax) * 100; // Convert to percentage
        return drawdown;
      });
  
      benchmarkCurrentDD = drawdowns[drawdowns.length - 1];
      benchmarkMaxDD = Math.min(...drawdowns);
    }
  
    return {
      portfolio: { currentDD: portfolioCurrentDD, maxDD: portfolioMaxDD },
      benchmark: { currentDD: benchmarkCurrentDD, maxDD: benchmarkMaxDD }
    };
  }, [drawdownData, benchmarkSeries]);

  // Update drawdown chart options
  const drawdownChartOptions = useMemo(() => ({
    chart: {
      type: 'area', // Area chart
      backgroundColor: colors.background,
    },
    title: {
      text: 'Drawdown Analysis',
      style: { color: colors.text }
    },
    xAxis: {
      type: 'datetime',
      gridLineColor: colors.gridLines,
      labels: { style: { color: colors.text } }
    },
    yAxis: {
      title: {
        text: 'Drawdown (%)',
        style: { color: colors.text }
      },
      gridLineColor: colors.gridLines,
      labels: { style: { color: colors.text } }
    },
    series: [
      {
        name: 'Portfolio Drawdown',
        data: drawdownData,
        type: 'area',
        color: '#FF0000', // Red for the line
        // Gradient fill: red fading to transparent
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [1, Highcharts.color('#FF0000').setOpacity(0.5).get('rgba')],
            [0, Highcharts.color('#FF0000').setOpacity(0.0).get('rgba')]
          ]
        },
        zIndex: 2,
        marker: {
          enabled: false
        },
      },
      {
        name: 'Nifty 50 Drawdown',
        data: benchmarkDrawdownData,
        type: 'area',
        color: '#FF0000', // Also red for the line
        // Gradient fill: red fading to transparent
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [1, Highcharts.color('#FF0000').setOpacity(0.5).get('rgba')],
            [0, Highcharts.color('#FF0000').setOpacity(0.0).get('rgba')]
          ]
        },
        dashStyle: 'line',
        zIndex: 1,
        marker: {
          enabled: false
        },
      }
    ],
    tooltip: {
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.text },
      valueDecimals: 2,
      valueSuffix: ' %'
    },
    legend: {
      itemStyle: { color: colors.text },
      itemHoverStyle: { color: colors.accent }
    }
  }), [drawdownData, benchmarkDrawdownData, colors]);
  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // Outputs format: dd/mm/yyyy
  };

  // Currency formatter for Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate Totals
  const cashFlowTotals = useMemo(() => {
    const totalIn = filteredCashInOutData
      .filter(record => record.capital_in_out > 0)
      .reduce((sum, record) => sum + record.capital_in_out, 0);

    const totalOut = filteredCashInOutData
      .filter(record => record.capital_in_out < 0)
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
    };

    const getTrailingReturn = (series, days) => {
      const periodMs = days * 24 * 60 * 60 * 1000;
      if (!series.length) return null;
      const lastPoint = series[series.length - 1];
      const targetTime = lastPoint[0] - periodMs;
      // Iterate backwards until we find a point with timestamp <= targetTime
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
   
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      return <div className="p-18 text-red-500">Error: {error}</div>;
    }

    if (!Array.isArray(data)) {
      return <div className="p-18 text-red-500">No data available.</div>;
    }

    return (
      <>
        {/* Dropdown for Schemes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-18 mb-6">
          <label htmlFor="scheme-select" className="text-md font-medium">
            Select Scheme:
          </label>
          <select
            id="scheme-select"
            value={activeScheme}
            onChange={(e) => setActiveScheme(e.target.value)}
            className="p-1  rounded border border-brown text-gray-700"
          >
            {data.map(({ schemeName }) => (
              <option key={schemeName} value={schemeName}>
                {schemeName}
              </option>
            ))}
          </select>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-18 mb-6">
          <div className="p-18 bg-white rounded-lg shadow">
            <h3 className="text-md font-medium">Amount Invested</h3>
            <p className="mt-2 text-sm">
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

          <div className="p-18 bg-white rounded-lg shadow flex-1">
            <h3 className="text-md font-medium">Current Portfolio Value</h3>
            <div className="mt-2 flex items-baseline gap-18">
              <span className="text-sm">
                ₹{latestPortfolioValue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <div className={`flex items-end text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpIcon className="h-18 w-18" />
                ) : (
                  <ArrowDownIcon className="h-18 w-18" />
                )}
                <span>
                  {dailyPercentageChange.toFixed(2)}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="p-18 bg-white rounded-lg shadow">
            <h3 className="text-md font-medium">Returns</h3>
            <div className="mt-2 flex items-baseline gap-18">
              <span className={`text-sm ${returns >= 0 ? "text-green-500" : "text-red-500"}`}>
                {returns.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="p-18 bg-white rounded-lg shadow">
            <h3 className="text-md font-medium">Total Profit</h3>
            <p
              className={`mt-2 text-sm ${totalProfit >= 0 ? "text-green-500" : "text-red-500"
                }`}
            >
              ₹
              {totalProfit.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="p-18 bg-white rounded-lg shadow">
            <h3 className="text-md font-medium">Total Dividends</h3>
            <p className="mt-2 text-sm">
              ₹
              {totals.totalDividends.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-18 mt-18">
                {startDate && (
                    <Text className="sm:text-sm italic text-xs font-subheading text-brown dark:text-beige text-left">
                        Inception Date: {formatDate(startDate)}
                    </Text>
                )}

                {endDate && (
                    <Text className="sm:text-sm italic text-xs font-subheading text-brown dark:text-beige text-right">
                        Data as of: {formatDate(endDate)}
                    </Text>
                )}
            </div>

        {/* NAV Chart */}
        <div className=" bg-white p-18 rounded-lg shadow">
          {normalizedData.length ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={navChartOptions}
              ref={chartComponentRef}
            />
          ) : (
            <div>No NAV data available.</div>
          )}
        </div>

        {/* Drawdown Chart */}
        <div className="mb-6 bg-white p-18 rounded-lg shadow">
          {drawdownData.length ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={drawdownChartOptions}
            />
          ) : (
            <div>No drawdown data available.</div>
          )}
        </div>

        <TrailingReturns trailingReturns={trailingReturns} ddStats={ddStats} />

        {/* Donut Chart for Strategy-wise Allocation */}
        <div className="mb-6 bg-white p-18 rounded-lg shadow">
          {/* Donut Chart for Strategy-wise Allocation */}
          {activeScheme !== "Scheme C" && (
            <div className="mb-6 bg-white p-18 rounded-lg shadow">
              {allocationData.length ? (
                <HighchartsReact
                  highcharts={Highcharts}
                  options={donutChartOptions}
                />
              ) : (
                <div>No allocation data available.</div>
              )}
            </div>
          )}

        </div>

        {filteredCashInOutData.length > 0 && (
          <div className="mb-4">
            <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-beige mb-4">
              Cash In/Out
            </Heading>
            <div className="overflow-x-auto w-full rounded-lg border border-brown dark:border-brown">
              <table className="min-w-full bg-white dark:bg-black">
                <thead className="bg-lightBeige">
                  <tr>
                    <th className="p-18 border-b border-brown dark:border-brown text-left text-md font-medium text-black dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="p-18 border-b border-brown dark:border-brown text-left text-md font-medium text-black dark:text-gray-400 uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="p-18 border-b border-brown dark:border-brown text-right text-md font-medium text-black dark:text-gray-400 uppercase tracking-wider">
                      Cash In/Out
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCashInOutData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-18 border-b border-brown dark:border-brown text-md text-gray-700 dark:text-gray-300">
                        {formatDate(record.date)}
                      </td>
                      <td className="p-18 border-b border-brown dark:border-brown text-md text-gray-700 dark:text-gray-300">
                        {record.scheme}
                      </td>
                      <td className={`p-18 border-b border-brown dark:border-brown text-md text-right ${record.capital_in_out > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(record.capital_in_out)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                    <td className="p-18 border-t border-brown dark:border-brown text-md text-gray-900 dark:text-gray-100">
                      Total
                    </td>
                    <td className="p-18 border-t border-brown dark:border-brown text-md text-right text-gray-900 dark:text-gray-100"></td>
                    <td className="p-18 border-t border-brown dark:border-brown text-md text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(cashFlowTotals.netFlow)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-md text-gray-600 dark:text-gray-400">
              <p>Total Cash In: <span className="text-green-600">{formatCurrency(cashFlowTotals.totalIn)}</span></p>
              <p>Total Cash Out: <span className="text-red-600">{formatCurrency(cashFlowTotals.totalOut)}</span></p>
              <p>Net Flow: <span className={cashFlowTotals.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(cashFlowTotals.netFlow)}
              </span></p>
            </div>
          </div>
        )}

      </>
    );
  };

  return (
      <div className="p-18">
        <div className="flex justify-between items-center mb-4">
          <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-beige mb-18 mt-4">
            Welcome, {username}
          </Heading>
          {/* Theme toggle button */}
          {/* <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button> */}
        </div>

        {/* Conditional Content Rendering */}
        {renderContent()}
      </div>
  );
};

export default ManagedAccountDashboard;
