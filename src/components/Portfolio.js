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

// Dynamically import components
const TrailingReturns = dynamic(() => import("./TrailingReturn"), {
  ssr: false
});

const PortfolioDetails = dynamic(() => import("./PortfolioDetails"), {
  ssr: false
});

const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-200  animate-pulse" />
});

const PerformanceAndDrawdownChart = () => {
  const [activeTab, setActiveTab] = useState("QGF");
  const { data, isLoading, error, selectedNuvama, setSelectedNuvama, viewMode, handleViewModeChange } = useFetchStrategyData();
  const { timeRange } = useCustomTimeRange();
  const { isMobile } = useMobileWidth();
  const { theme } = useTheme();
  const chartRef = useRef(null); // Ref for HighchartsReact

  // Define benchmark indices
  const benchmarkIndices = ["NIFTY 50"];

  // Extract startDate and endDate from data.dailyNAV
  const startDate = useMemo(() => {
    if (!data?.dailyNAV || data.dailyNAV.length === 0) return null;
    // Sort data.dailyNAV by date in ascending order
    const sortedDailyNAV = data.dailyNAV.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log('sortedDailyNAV:', sortedDailyNAV);  // Log sorted data for debugging

    return sortedDailyNAV[0].date;
  }, [data]);

  const endDate = useMemo(() => {
    if (!data?.dailyNAV || data.dailyNAV.length === 0) return null;
    // Sort data.dailyNAV by date in ascending order
    const sortedDailyNAV = data.dailyNAV.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log('sortedDailyNAV:', sortedDailyNAV);  // Log sorted data for debugging
    return sortedDailyNAV[sortedDailyNAV.length - 1].date;
  }, [data]);

  // Only fetch benchmark data if both startDate and endDate are valid
  const { benchmarkData, isLoading: isBenchmarkLoading, error: benchmarkError } = useFetchBenchmarkData(
    benchmarkIndices,
    startDate && endDate ? startDate : null,
    startDate && endDate ? endDate : null
  );

  // Log the dates for debugging
  useEffect(() => {
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
  }, [startDate, endDate]);

  // Filtered data based on view mode and time range
  const filteredData = useFilteredData(
    viewMode === "individual" ? data?.dailyNAV || [] : [],
    timeRange,
    startDate,
    endDate
  );

  // Extract the latest data point
  const latestData = useMemo(() => {
    if (!data?.dailyNAV || data.dailyNAV.length === 0) return null;
    // Assuming data.dailyNAV is sorted in ascending order by date
    return data.dailyNAV[data.dailyNAV.length - 1];
  }, [data]);

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
    const sortedBenchmarkData = benchmarkArray.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log('sortedBenchmarkData:', sortedBenchmarkData);  // Log sorted data for debugging

    // Get the first NAV value for normalization
    const firstNavValue = parseFloat(sortedBenchmarkData[0].nav);
    console.log('firstNavValue:', firstNavValue);  // Log first NAV value for debugging

    // Normalize the data to 100 and forward-fill missing dates
    let previousNavValue = firstNavValue;  // Initialize with the first value
    const normalizedData = sortedBenchmarkData.map(item => {
      const currentDate = new Date(item.date).getTime();
      let currentNavValue = parseFloat(item.nav);

      // Forward fill if NAV is missing or undefined
      if (isNaN(currentNavValue)) {
        currentNavValue = previousNavValue;  // Use the previous value
      } else {
        previousNavValue = currentNavValue;  // Update previousNavValue
      }

      // Normalize NAV to 100 based on the first NAV value
      return [currentDate, (currentNavValue / firstNavValue) * 100];
    });

    return [{
      name: 'Nifty 50',  // Use a single name since all data points belong to the same benchmark
      data: normalizedData,
      type: 'line',
      color: '#945c39',  // Assign a color
      dashStyle: 'line',  // Dashed lines for benchmarks
      marker: {
        enabled: false
      },
      tooltip: {
        valueDecimals: 2,
        valueSuffix: ' %'  // Display as percentage
      },
      zIndex: 1,  // Ensure benchmarks appear behind client data
    }];
  }, [benchmarkData]);

  // Prepare Highcharts options with both client and benchmark data
  const chartOptions = useMemo(() => {
    if (typeof window === 'undefined') return null;

    if (filteredData.length > 0 && viewMode === "individual") {
      // Prepare client data series
      const clientOptions = getChartOptions(
        filteredData,
        activeTab,
        isMobile,
        "Portfolio",
        theme,
        benchmarkSeries // Pass benchmark series here
      );

      return clientOptions;
    }

    return null;
  }, [filteredData, activeTab, isMobile, viewMode, theme, benchmarkSeries]);

  // Prepare Donut Chart options with responsiveness
  const donutChartOptions = useMemo(() => {
    if (!data.portfoliosWithRatios || data.portfoliosWithRatios.length === 0) return null;

    // Transform portfoliosWithRatios into Highcharts series data
    const seriesData = data.portfoliosWithRatios.map(portfolio => ({
      name: `${portfolio.name} (${portfolio.nuvama_code})`,
      y: portfolio.ratio * 100,
      portfolioValue: portfolio.portfolio_value
    }));

    return {
      chart: {
        type: 'pie',
        backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
        // Responsive sizing handled by container
      },
      title: {
        text: 'Portfolio Allocation',
        style: {
          fontSize: isMobile ? '16px' : '20px',
        }
      },
      tooltip: {
        formatter: function () {
          const formattedValue = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
          }).format(this.point.portfolioValue);

          return `
                        <span style="color:${this.color}">\u25CF</span> 
                        <b>${this.point.name}</b>: ${this.percentage.toFixed(1)}%<br/>
                        <b>Value:</b> ${formattedValue}
                    `;
        }
      },
      accessibility: {
        point: {
          valueSuffix: '%'
        }
      },
      plotOptions: {
        pie: {
          innerSize: '50%',
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.1f} %',
            style: {
              fontSize: isMobile ? '10px' : '12px'
            }
          }
        }
      },
      series: [{
        name: 'Allocation',
        colorByPoint: true,
        data: seriesData
      }],
      colors: ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
      responsive: {
        rules: [{
          condition: {
            maxWidth: 400
          },
          chartOptions: {
            legend: {
              enabled: false
            },
            plotOptions: {
              pie: {
                dataLabels: {
                  enabled: false
                }
              }
            }
          }
        }]
      }
    };
  }, [data.portfoliosWithRatios, isMobile, theme]);

  // Helper function to format the date
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

  // Filtered Cash In/Out Data (non-zero)
  const filteredCashInOutData = useMemo(() => {
    return data.cashInOutData
      .filter(record => record.cash_in_out !== 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data.cashInOutData]);

  // Calculate Totals
  const cashFlowTotals = useMemo(() => {
    const totalIn = filteredCashInOutData
      .filter(record => record.cash_in_out > 0)
      .reduce((sum, record) => sum + record.cash_in_out, 0);

    const totalOut = filteredCashInOutData
      .filter(record => record.cash_in_out < 0)
      .reduce((sum, record) => sum + Math.abs(record.cash_in_out), 0);

    const netFlow = totalIn - totalOut;

    return { totalIn, totalOut, netFlow };
  }, [filteredCashInOutData]);

  // Optional: Handle window resize to reflow chart
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.chart.reflow();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="text-gray-900 transition-colors duration-300">
      {/* Welcome & Portfolio Details Card */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div>
            <Heading className="text-xl italic font-semibold text-gray-800 mb-2">
              {data?.portfolioDetails?.name
                ? `Welcome, ${data.portfolioDetails.name.charAt(0).toUpperCase()}${data.portfolioDetails.name
                  .slice(1)
                  .toLowerCase()}`
                : "Welcome, Guest"}
            </Heading>
            <Text className="text-sm text-gray-600">
              View your portfolio performance and details
            </Text>
          </div>
        </div>

        {/* Tabs with inline select dropdown */}
        {data?.nuvama_codes?.length > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            {/* Tabs */}
            <div className="flex gap-4 border-b w-full sm:w-auto">
              <button
                onClick={() => handleViewModeChange("individual")}
                className={`px-4 py-2 text-xs sm:text-sm font-medium uppercase tracking-wider focus:outline-none border-b-2 ${viewMode === "individual"
                    ? "border-green-500 text-green-500"
                    : "border-transparent text-gray-700"
                  }`}
              >
                Individual Portfolio
              </button>
              <button
                onClick={() => handleViewModeChange("cumulative")}
                className={`px-4 py-2 text-xs sm:text-sm font-medium uppercase tracking-wider focus:outline-none border-b-2 ${viewMode === "cumulative"
                    ? "border-green-500 text-green-500"
                    : "border-transparent text-gray-700"
                  }`}
              >
                Total Portfolio
              </button>
            </div>

            {/* Inline Select (only shown when in individual view) */}
            {viewMode === "individual" && (
              <div className="mt-2 sm:mt-0">
                <select
                  value={selectedNuvama || ""}
                  onChange={(e) => setSelectedNuvama(e.target.value)}
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
        )}

        {/* Dates */}
        <div className="flex flex-col sm:flex-row justify-between items-center my-4">
          {startDate && (
            <Text className="text-sm italic text-gray-700 mb-2 sm:mb-0">
              Inception Date: {formatDate(startDate)}
            </Text>
          )}
          {latestData && (
            <Text className="text-sm italic text-gray-700">
              Data as of: {formatDate(latestData.date)}
            </Text>
          )}
        </div>

        {/* Portfolio Details Component */}
        <div suppressHydrationWarning>
          <PortfolioDetails
            data={data?.portfolioDetails}
            isCumulative={viewMode === "cumulative"}
          />
        </div>
      </div>



      {/* Donut Chart Card for Cumulative View */}
      {viewMode === "cumulative" &&
        data.portfoliosWithRatios &&
        data.portfoliosWithRatios.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <Heading className="text-xl italic font-semibold text-gray-800 mb-4">
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

      {/* Loading / Error / Performance Chart Card */}
      {isLoading || isBenchmarkLoading ? (
        <div className="flex justify-center items-center p-4">
          <div className="w-4 h-4 border-t-4 border-blue-600 rounded-full animate-spin" />
        </div>
      ) : error || benchmarkError ? (
        <div className="text-red-500 p-2 text-xs">
          {error || benchmarkError}
        </div>
      ) : (
        viewMode === "individual" && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              {/* Trailing Returns */}
              <TrailingReturns
                data={data}
                isLoading={isLoading}
                error={error}
                benchmarkData={benchmarkData}
                name={selectedNuvama}
              />
              <Heading className="text-xl italic font-semibold text-gray-800 mt-4 mb-4">
                Performance Chart
              </Heading>
              {typeof window !== "undefined" && chartOptions && (
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
              )}
            </div>
            <div >
              <YearlyMonthlyPLTable monthlyPnL={data.monthlyPnL} />
            </div>
          </>

        )
      )}

      {/* Cash In/Out Card */}
      {filteredCashInOutData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <Heading className="text-xl italic font-semibold text-gray-800 mb-4">
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
                      className={`px-4 py-2 border-b border-brown text-xs text-right ${record.cash_in_out > 0
                        ? "text-green-600"
                        : "text-red-600"
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
  );

};

export default PerformanceAndDrawdownChart;
