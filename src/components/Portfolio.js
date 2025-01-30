// components/PerformanceAndDrawdownChart.jsx

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Highcharts from "highcharts";
import HighchartsMore from "highcharts/highcharts-more"; // Import highcharts-more for additional chart types
import Button from "./common/Button";
import Text from "./common/Text";
import useCustomTimeRange from "@/hooks/useCustomRangeHook";
import useMobileWidth from "@/hooks/useMobileWidth";
import useFetchStrategyData from "@/hooks/useFetchStrategyData";
import useFilteredData from "@/hooks/useFilteredData";
import Heading from "./common/Heading";
import { useTheme } from "@/components/ThemeContext";
import useFetchBenchmarkData from "@/hooks/useFetchBenchmarkData"; // Import the new hook
import { getChartOptions } from "@/app/lib/ChartOptions";

// Initialize Highcharts modules
// HighchartsMore(Highcharts);

// Dynamically import components
const TrailingReturns = dynamic(() => import("./TrailingReturn"), {
    ssr: false
});

const PortfolioDetails = dynamic(() => import("./PortfolioDetails"), {
    ssr: false
});

const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
    ssr: false,
    loading: () => <div className="h-80 bg-gray-200 dark:bg-gray-800 animate-pulse" />
});

const PerformanceAndDrawdownChart = () => {
    const [activeTab, setActiveTab] = useState("QGF");
    const { data, isLoading, error, selectedNuvama, setSelectedNuvama, viewMode, handleViewModeChange } = useFetchStrategyData();
    const { timeRange } = useCustomTimeRange();
    const { isMobile } = useMobileWidth();
    const { theme } = useTheme();

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

        console.log('normalizedData with forward fill:', normalizedData);  // Log normalized data for debugging

        return [{
            name: 'Benchmark',  // Use a single name since all data points belong to the same benchmark
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
                "Performance Chart",
                theme,
                benchmarkSeries // Pass benchmark series here
            );

            return clientOptions;
        }

        return null;
    }, [filteredData, activeTab, isMobile, viewMode, theme, benchmarkSeries]);

    // Prepare Donut Chart options
    const donutChartOptions = useMemo(() => {
        if (!data.portfoliosWithRatios || data.portfoliosWithRatios.length === 0) return null;

        // Transform portfoliosWithRatios into Highcharts series data
        const seriesData = data.portfoliosWithRatios.map(portfolio => ({
            name: `${portfolio.name} (${portfolio.nuvama_code})`, // Using nuvama_code as the name. Replace with a more descriptive name if available.
            y: portfolio.ratio * 100, // Convert ratio to percentage
            portfolioValue: portfolio.portfolio_value // Include portfolio value for tooltip
        }));

        return {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Portfolio Allocation'
            },
            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b>: {point.percentage:.1f}%<br/><b>Value:</b> ₹{point.portfolioValue:,.2f}'
            },
            accessibility: {
                point: {
                    valueSuffix: '%'
                }
            },
            plotOptions: {
                pie: {
                    innerSize: '50%', // This makes it a donut chart
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.percentage:.1f} %'
                    }
                }
            },
            series: [{
                name: 'Allocation',
                colorByPoint: true,
                data: seriesData
            }],
            colors: ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1']
        };
    }, [data.portfoliosWithRatios]);

    // Helper function to format the date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // Outputs format: dd/mm/yyyy
    };

    return (
        <div className="p-18 tracking-wide bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-beige mb-18 mt-4">
                        {data?.usernames?.[0]
                            ? `Welcome, ${data.usernames[0].charAt(0).toUpperCase()}${data.usernames[0].slice(1).toLowerCase()}`
                            : "Welcome, Guest"}
                    </Heading>

                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                        View your portfolio performance and details
                    </Text>
                </div>
            </div>

            {data?.nuvama_codes?.length > 1 && (
                <div className="flex gap-2 mb-2">
                    <Button
                        onClick={() => handleViewModeChange("individual")}
                        className={`p-1 text-xs ${viewMode === "individual"
                            ? "bg-brown text-white rounded-lg"
                            : "border border-brown rounded-lg dark:border-beige"}`}
                    >
                        Individual Portfolio
                    </Button>
                    <Button
                        onClick={() => handleViewModeChange("cumulative")}
                        className={`p-1 text-xs ${viewMode === "cumulative"
                            ? "bg-brown text-white rounded-lg"
                            : "border border-brown rounded-lg dark:border-beige"}`}
                    >
                        Total Portfolio
                    </Button>
                </div>
            )}

            {viewMode === "individual" && data?.nuvama_codes?.length > 1 && (
                <div className="mb-2">
                    <select
                        value={selectedNuvama || ""}
                        onChange={(e) => setSelectedNuvama(e.target.value)}
                        className="border border-brown rounded-lg dark:border-beige bg-white dark:bg-black text-gray-900 dark:text-white p-18 w-full sm:w-auto text-xs transition-colors duration-300"
                    >
                        {data.nuvama_codes.map((code, index) => (
                            <option key={code} value={code}>{data.usernames[index]} ({code})</option>
                        ))}
                    </select>
                </div>
            )}

            <div suppressHydrationWarning>
                <PortfolioDetails data={data?.portfolioDetails} isCumulative={viewMode === "cumulative"} />
            </div>

            <div className="flex justify-between items-center mb-18 mt-18">
                {startDate && (
                    <Text className="sm:text-sm italic text-xs font-subheading text-brown dark:text-beige text-left">
                        Inception Date: {formatDate(startDate)}
                    </Text>
                )}

                {latestData && (
                    <Text className="sm:text-sm italic text-xs font-subheading text-brown dark:text-beige text-right">
                        Data as of: {formatDate(latestData.date)}
                    </Text>
                )}
            </div>


            {/* Donut Chart Section */}
            {viewMode === "cumulative" && data.portfoliosWithRatios && data.portfoliosWithRatios.length > 0 && (
                <div className="mb-4">
                    <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-beige mb-4">
                        Portfolio Allocation
                    </Heading>
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={donutChartOptions}
                    />
                </div>
            )}

            {isLoading || isBenchmarkLoading ? (
                <div className="flex justify-center items-center p-4">
                    <div className="w-1 h-1 border-t-4 border-brown dark:border-beige rounded-full animate-spin" />
                </div>
            ) : error || benchmarkError ? (
                <div className="text-red-500 p-1 text-xs">
                    {error || benchmarkError}
                </div>
            ) : (
                viewMode === "individual" && (
                    <>
                        <div suppressHydrationWarning className="mb-4">
                            <TrailingReturns data={data} isLoading={isLoading} error={error} name={selectedNuvama} />
                            <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-beige mb-18 mt-4">
                                Performance Chart
                            </Heading>
                            {typeof window !== 'undefined' && chartOptions && (
                                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                            )}
                        </div>
                    </>
                )
            )}
        </div>
    );
};

export default PerformanceAndDrawdownChart;
