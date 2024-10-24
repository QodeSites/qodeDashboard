import React, { useState, useEffect } from "react";
import useCalculateCagr from "@/hooks/useCalculateCagr";
import { Spinner } from "@material-tailwind/react";
import Text from "./common/Text";
import Heading from "./common/Heading";

const TrailingReturns = ({ strategy, isLoading, error, data, name }) => {
    const [returns, setReturns] = useState({
        "10D": {},
        "1W": {},
        "1M": {},
        "3M": {},
        "6M": {},
        "1Y": {},
        "3Y": {},
        "5Y": {},
        "Inception": {},
    });
    const [drawdowns, setDrawdowns] = useState({
        latest: {},
        lowest: {},
    });

    const { calculateCAGR } = useCalculateCagr();

    useEffect(() => {
        if (data && data.length > 0) {
            calculateReturns(data);
            calculateDrawdowns(data);
        }
    }, [data, calculateCAGR]);

    const calculateReturns = (data) => {
        const periods = {
            "1M": "1M",
            "3M": "3M",
            "6M": "6M",
            "1Y": "1Y",
            "3Y": "3Y",
            "5Y": "5Y",
            "Inception": "Inception",
        };

        const calculatedReturns = {};

        for (const [period, cagrPeriod] of Object.entries(periods)) {
            calculatedReturns[period] = {
                [name]: calculateCAGR(data, cagrPeriod, "total_portfolio_nav"),
                [data[0].benchmark]: calculateCAGR(data, cagrPeriod, "benchmark_values"),
            };
        }

        // Handle custom periods (10D and 1W)
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestDate = new Date(sortedData[sortedData.length - 1].date);

        ["10D", "1W"].forEach((period) => {
            const days = period === "10D" ? 10 : 7;
            const startDate = new Date(latestDate.getTime() - days * 24 * 60 * 60 * 1000);
            const filteredData = sortedData.filter((item) => new Date(item.date) >= startDate);

            calculatedReturns[period] = {
                [name]: calculateCAGR(filteredData, period, "total_portfolio_nav"),
                [data[0].benchmark]: calculateCAGR(filteredData, period, "benchmark_values"),
            };
        });

        setReturns(calculatedReturns);
    };

    const calculateDrawdowns = (data) => {
        const benchmark = data[0]?.benchmark || "Default Benchmark";
        const strategies = [name, benchmark];
        const calculatedDrawdowns = {
            latest: {},
            lowest: {},
        };

        strategies.forEach((strat) => {
            const values = data.map((item) =>
                parseFloat(strat === name ? item.total_portfolio_nav : item.benchmark_values)
            );

            let peaks = [values[0]];
            let drawdowns = [0];

            for (let i = 1; i < values.length; i++) {
                peaks[i] = Math.max(peaks[i - 1], values[i]);
                drawdowns[i] = ((values[i] - peaks[i]) / peaks[i]) * 100;
            }

            calculatedDrawdowns.latest[strat] = drawdowns[drawdowns.length - 1];
            calculatedDrawdowns.lowest[strat] = Math.min(...drawdowns);
        });

        setDrawdowns(calculatedDrawdowns);
    };

    if (isLoading)
        return (
            <div className="text-start flex justify-center items-center">
                <Spinner className="text-brown" />
            </div>
        );
    if (error) return <div>Error: {error}</div>;

    const benchmark = data[0]?.benchmark || "Default Benchmark";
    const strategies = [name, benchmark];
    const periods = ["10D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "Inception"];

    const ResponsiveTable = () => (
        <div className="overflow-x-auto">
            <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-brown scrollbar-track-black">
                <table className="w-full text-center min-w-[640px]">
                    <thead>

                        <tr className="border text-body font-body p-3 border-brown">

                            <th className="sticky -left-18 t-0 z-10 p-1 font-body text-body border-r border-brown  text-lightBeige bg-black">
                                <div className="absolute inset-y-0 right-0 w-[1px] bg-brown" />

                                Strategy
                            </th>
                            {periods.map((period) => (
                                <th
                                    key={period}
                                    className="p-2 font-body  text-body text-lightBeige"
                                >
                                    {period}
                                </th>
                            ))}
                            <th className="p-1 text-center border-l border-brown font-body text-body text-lightBeige">
                                MDD
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {strategies.map((strat, index) => (
                            <tr key={strat} className="border border-brown text-lightBeige text-center">
                                <td className="sticky  text-nowrap -left-18 z-10 p-18 border-r border-brown bg-black">
                                    <div className="absolute inset-y-0 right-0 w-[1px] bg-brown" />

                                    {strat === strategy ? name : strat}
                                </td>
                                {periods.map((period) => (
                                    <td
                                        key={period}
                                        className={`p-1 text-lightBeige ${index === strategies.length - 1
                                            ? "border border-l-0 border-r-0 border-brown"
                                            : ""
                                            }`}
                                    >
                                        {returns[period] && returns[period][strat]
                                            ? `${parseFloat(returns[period][strat]).toFixed(1)}%`
                                            : "0"}
                                    </td>
                                ))}
                                <td
                                    className={`xl:p-1 text-center text-lightBeige border-l border-brown ${index === strategies.length - 1 ? "border-b" : ""
                                        }`}
                                >
                                    {drawdowns.lowest[strat]
                                        ? `${drawdowns.lowest[strat].toFixed(1)}%`
                                        : "0"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: "numeric", month: "long", year: "numeric" };
        return date.toLocaleDateString("en-GB", options);
    };

    // Extract the earliest and latest dates from the data
    const extractDateRange = (data) => {
        if (!data || data.length === 0) return { startDate: "0", endDate: "0" };

        const dates = data.map((entry) => new Date(entry.date));
        const startDate = new Date(Math.min(...dates));
        const endDate = new Date(Math.max(...dates));

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        };
    };

    const { startDate, endDate } = extractDateRange(data);


    return (
        <div>
            <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-beige mb-18">
                Returns
            </Heading>
            <div className="flex justify-between flex-col sm:flex-row">
                <Text className="text-sm sm:text-body font-body text-black mb-18">
                    Returns as of {endDate}.
                </Text>
                <Text className="text-xs text-right sm:text-xs font-body mb-18 text-beige italic ">
                    *Data from {startDate} to {endDate}.
                </Text>
            </div>
            <ResponsiveTable />
            <Text className="text-beige text-body font-body mt-1 mb-6">
                MDD (Maximum Drawdown) refers to the maximum loss an investment can incur from its highest point.
            </Text>
        </div>
    );
};

export default TrailingReturns;
