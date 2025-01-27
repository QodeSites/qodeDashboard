"use client";
import React, { useState, useRef, useMemo } from "react";
import DefaultLayout from "@/components/Layouts/Layouts";
import useManagedAccounts from "@/hooks/useManagedAccounts";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const ManagedAccountDashboard = ({ accountCodes }) => {
  // State Hooks
  const [activeScheme, setActiveScheme] = useState("Scheme Total");
  const [theme, setTheme] = useState("light");

  // Ref Hooks
  const chartComponentRef = useRef(null);

  // Custom Hook to fetch data
  const { data, loading, error } = useManagedAccounts();

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

  console.log(ac5ZerodhaData);

  // Sort the data by date
  const sortedData = useMemo(() => {
    return [...ac5ZerodhaData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [ac5ZerodhaData]);

  // Normalize NAV Data
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
          nav === 0 || isNaN(nav) ? 0 : (nav / firstNav) * 100, // y value
        ];
      })
      .filter((point) => point !== null); // Remove null values
  }, [sortedData]);

  // Prepare data for Donut Chart (Strategy-wise Allocation)
  const allocationData = useMemo(() => {
    if (!activeSchemeData) return [];
    const strategies = activeSchemeData.strategies;

    // Extract latest portfolio_value for each strategy
    const latestValues = strategies
      .map((strategy) => {
        const sortedStrategyData = [...strategy.masterSheetData].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        const latestEntry = sortedStrategyData[0];
        return {
          name: strategy.strategy,
          y: parseFloat(latestEntry.portfolio_value) || 0,
        };
      })
      .filter((strategy) => strategy.y > 0); // Exclude zero allocations

    // Calculate total portfolio value
    const total = latestValues.reduce((sum, strategy) => sum + strategy.y, 0);

    // Calculate percentage allocation
    return latestValues.map((strategy) => ({
      name: strategy.name,
      y: strategy.y,
      percentage: total > 0 ? ((strategy.y / total) * 100).toFixed(2) : 0,
    }));
  }, [activeSchemeData]);

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
        const drawdown = parseFloat(sheet.drawdown) || 0;
        return [date.getTime(), drawdown];
      })
      .filter((point) => point !== null); // Remove null values
  }, [sortedData]);

  // Calculate financial numbers for the active scheme
  const { totalInvestment, latestPortfolioValue, totalProfit } = useMemo(() => {
    if (!activeSchemeData) return { totalInvestment: 0, latestPortfolioValue: 0, totalProfit: 0 };
    const strategiesData = activeSchemeData.strategies.flatMap(
      (strategy) => strategy.masterSheetData
    );

    const totalInvestment = strategiesData.reduce(
      (sum, entry) => sum + (entry.capital_in_out || 0),
      0
    );

    const latestPortfolioValue = strategiesData.reduce(
      (sum, entry) => entry.portfolio_value || 0,
      0
    );

    const totalProfit = latestPortfolioValue - totalInvestment;

    return { totalInvestment, latestPortfolioValue, totalProfit };
  }, [activeSchemeData]);

  // Chart Options for NAV Trend
  const navChartOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        backgroundColor: colors.background,
        height: 400,
        zoomType: "x",
      },
      title: {
        text: `NAV Trend - ${strategyName}`,
        align: "left",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          color: colors.text,
        },
      },
      xAxis: {
        type: "datetime",
        labels: {
          formatter: function () {
            return Highcharts.dateFormat("%Y-%m-%d", this.value);
          },
          style: {
            color: colors.accent,
            fontSize: "10px",
          },
        },
        gridLineColor: colors.gridLines,
      },
      yAxis: {
        title: {
          text: "NAV (Normalized)",
          style: {
            color: colors.accent,
          },
        },
        labels: {
          style: {
            color: colors.accent,
            fontSize: "10px",
          },
        },
        gridLineColor: colors.gridLines,
      },
      series: [
        {
          name: "NAV",
          data: normalizedData,
          color: colors.accent,
          lineWidth: 2,
          marker: {
            enabled: false, // Removed marker circles
          },
        },
      ],
      tooltip: {
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        style: {
          color: colors.text,
          fontSize: "12px",
        },
        formatter: function () {
          return `
            <b>${Highcharts.dateFormat("%Y-%m-%d", this.x)}</b><br/>
            NAV (Normalized): <b>${this.y.toFixed(2)}</b>
          `;
        },
      },
      legend: {
        enabled: false,
        itemStyle: { color: colors.text },
      },
      credits: { enabled: false },
      plotOptions: {
        series: {
          animation: { duration: 2000 },
          states: {
            hover: {
              enabled: true,
              lineWidthPlus: 1,
            },
          },
        },
      },
    }),
    [colors, strategyName, normalizedData]
  );

  // Chart Options for Donut Chart (Strategy-wise Allocation)
  const donutChartOptions = useMemo(
    () => ({
      chart: {
        type: "pie",
        backgroundColor: colors.background,
        height: 400,
      },
      title: {
        text: `Strategy-wise Allocation - ${activeScheme}`,
        align: "left",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          color: colors.text,
        },
      },
      tooltip: {
        pointFormat: "{series.name}: <b>{point.percentage:.2f}%</b><br/>Value: ₹{point.y:,.2f}",
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        style: {
          color: colors.text,
          fontSize: "12px",
        },
      },
      accessibility: {
        point: {
          valueSuffix: "%",
        },
      },
      plotOptions: {
        pie: {
          innerSize: "50%", // Creates the donut hole
          allowPointSelect: true,
          cursor: "pointer",
          colors: colors.donutColors,
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b>: {point.percentage:.1f} %",
            style: {
              color: colors.text,
              fontSize: "10px",
            },
          },
        },
      },
      series: [
        {
          name: "Allocation",
          colorByPoint: true,
          data: allocationData.map((strategy) => ({
            name: strategy.name,
            y: strategy.y,
          })),
        },
      ],
      legend: {
        enabled: true,
        itemStyle: { color: colors.text },
      },
      credits: { enabled: false },
    }),
    [colors, activeScheme, allocationData]
  );

  // Chart Options for Drawdown Trend
  const drawdownChartOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        backgroundColor: colors.background,
        height: 400,
        zoomType: "x",
      },
      title: {
        text: `Drawdown Trend - ${strategyName}`,
        align: "left",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          color: colors.text,
        },
      },
      xAxis: {
        type: "datetime",
        labels: {
          formatter: function () {
            return Highcharts.dateFormat("%Y-%m-%d", this.value);
          },
          style: {
            color: colors.accent,
            fontSize: "10px",
          },
        },
        gridLineColor: colors.gridLines,
      },
      yAxis: {
        title: {
          text: "Drawdown (%)",
          style: {
            color: colors.accent,
          },
        },
        labels: {
          style: {
            color: colors.accent,
            fontSize: "10px",
          },
        },
        gridLineColor: colors.gridLines,
      },
      series: [
        {
          name: "Drawdown",
          data: drawdownData,
          color: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "#FF0000"], // Red at the top
              [1, "rgba(255,0,0,0)"], // Transparent at the bottom
            ],
          },
          lineWidth: 2,
          marker: {
            enabled: false,
          },
          fillOpacity: 0.5,
        },
      ],
      tooltip: {
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        style: {
          color: colors.text,
          fontSize: "12px",
        },
        formatter: function () {
          return `
            <b>${Highcharts.dateFormat("%Y-%m-%d", this.x)}</b><br/>
            Drawdown: <b>${this.y.toFixed(2)}%</b>
          `;
        },
      },
      legend: {
        enabled: false,
        itemStyle: { color: colors.text },
      },
      credits: { enabled: false },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "#FF0000"], // Red at the top
              [1, "rgba(255,0,0,0)"], // Transparent at the bottom
            ],
          },
          marker: {
            enabled: false,
          },
          lineWidth: 2,
          states: {
            hover: {
              enabled: true,
              lineWidthPlus: 1,
            },
          },
        },
      },
    }),
    [colors, strategyName, drawdownData]
  );

  // Determine what to render based on data state
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

    if (!Array.isArray(data)) {
      return <div className="p-4 text-red-500">No data available.</div>;
    }

    return (
      <>
        {/* Dropdown for Schemes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
          <label htmlFor="scheme-select" className="text-lg font-medium">
            Select Scheme:
          </label>
          <select
            id="scheme-select"
            value={activeScheme}
            onChange={(e) => setActiveScheme(e.target.value)}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700"
          >
            {data.map(({ schemeName }) => (
              <option key={schemeName} value={schemeName}>
                {schemeName}
              </option>
            ))}
          </select>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium">Amount Invested</h3>
            <p className="mt-2 text-2xl">
              ₹
              {totalInvestment.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium">Current Portfolio Value</h3>
            <p className="mt-2 text-2xl">
              ₹
              {latestPortfolioValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium">Total Profit</h3>
            <p
              className={`mt-2 text-2xl ${totalProfit >= 0 ? "text-green-500" : "text-red-500"
                }`}
            >
              ₹
              {totalProfit.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* NAV Chart */}
        <div className=" bg-white p-4 rounded-lg shadow">
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
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          {drawdownData.length ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={drawdownChartOptions}
            />
          ) : (
            <div>No drawdown data available.</div>
          )}
        </div>

        {/* Donut Chart for Strategy-wise Allocation */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          {allocationData.length ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={donutChartOptions}
            />
          ) : (
            <div>No allocation data available.</div>
          )}
        </div>
      </>
    );
  };

  return (
    <DefaultLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Managed Account Dashboard</h1>
          {/* Theme toggle button */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
        </div>

        {/* Conditional Content Rendering */}
        {renderContent()}
      </div>
    </DefaultLayout>
  );
};

export default ManagedAccountDashboard;