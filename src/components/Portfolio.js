import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Highcharts from "highcharts";
import { getChartOptions } from "@/app/lib/ChartOptions";
import Button from "./common/Button";
import Text from "./common/Text";
import useCustomTimeRange from "@/hooks/useCustomRangeHook";
import useMobileWidth from "@/hooks/useMobileWidth";
import useFetchStrategyData from "@/hooks/useFetchStrategyData";
import useFilteredData from "@/hooks/useFilteredData";
import Heading from "./common/Heading";
import { useTheme } from "@/components/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    const { timeRange, startDate, endDate } = useCustomTimeRange();
    const { isMobile } = useMobileWidth();
    const { theme } = useTheme();

    const filteredData = useFilteredData(
        viewMode === "individual" ? data?.dailyNAV || [] : [],
        timeRange,
        startDate,
        endDate
    );

    const chartOptions = useMemo(() => {
        if (typeof window === 'undefined') return null;
        if (filteredData.length > 0 && viewMode === "individual") {
            const options = getChartOptions(filteredData, activeTab, isMobile, "Performance Chart", theme);
            // Add theme-specific chart colors
            options.chart.backgroundColor = theme === 'dark' ? '#000' : '#fefefe';
            options.xAxis.labels = { style: { color: theme === 'dark' ? '#ffffff' : '#000000' } };
            options.yAxis.labels = { style: { color: theme === 'dark' ? '#ffffff' : '#000000' } };
            return options;
        }
        return null;
    }, [filteredData, activeTab, isMobile, viewMode, theme]);

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
                            ? "bg-brown text-white" 
                            : "border border-brown dark:border-beige"}`}
                    >
                        Individual Portfolio
                    </Button>
                    <Button 
                        onClick={() => handleViewModeChange("cumulative")}
                        className={`p-1 text-xs ${viewMode === "cumulative" 
                            ? "bg-brown text-white" 
                            : "border border-brown dark:border-beige"}`}
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
                        className="border border-brown dark:border-beige bg-white dark:bg-black text-gray-900 dark:text-white p-18 w-full sm:w-auto text-xs transition-colors duration-300"
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

            {isLoading ? (
                <div className="flex justify-center items-center p-4">
                    <div className="w-1 h-1 border-t-4 border-brown dark:border-beige rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-red-500 p-1 text-xs">{error}</div>
            ) : (
                viewMode === "individual" && (
                    <>
                        <div suppressHydrationWarning className="mb-4">
                            <TrailingReturns data={data?.trailingReturns} isLoading={isLoading} error={error} name={selectedNuvama} />
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