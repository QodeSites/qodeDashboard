import React, { useState, useEffect } from "react";
import useCalculateCagr from "@/hooks/useCalculateCagr";
import { Spinner } from "@material-tailwind/react";



const TrailingReturns = ({ strategy, isLoading, error, data, name }) => {
    // console.log(name);

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
            // console.log(filteredData);

            calculatedReturns[period] = {
                [name]: calculateCAGR(filteredData, period, "total_portfolio_nav"),  // pass period instead of "Custom"
                [data[0].benchmark]: calculateCAGR(filteredData, period, "benchmark_values"),  // pass period instead of "Custom"
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
            <div className="min-w-[820px] relative">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr className="text-sm sm:text-body font-body">
                            <th className="sticky border border-brown border-r-0 left-0 z-20 p-18 font-semibold text-start text-beige">
                                <div className="absolute inset-y-0 right-0 w-[1px] bg-brown" />
                                Strategy
                            </th>
                            {periods.map((period) => (
                                <th
                                    key={period}
                                    className="relative p-18 font-semibold text-start text-beige border-t border-b border-brown"
                                >
                                    <div className="absolute inset-y-0 right-0  bg-brown" />
                                    {period}
                                </th>
                            ))}
                            <th className="p-18 text-start font-body text-beige border border-brown">
                                MDD
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {strategies.map((strat, index) => (
                            <tr key={strat} className="text-beige text-start">
                                <td className="sticky border border-brown border-r-0 left-0 z-20 p-18 font-semibold text-sm sm:text-body ">
                                    <div className="absolute inset-y-0 right-0 w-[1px] bg-brown" />
                                    {strat === strategy ? name : strat}
                                </td>
                                {periods.map((period) => (
                                    <td
                                        key={period}
                                        className={`relative p-18 text-beige font-body text-sm sm:text-body ${index === strategies.length - 1
                                            ? "border border-l-0 border-r-0 border-brown"
                                            : ""
                                            }`}
                                    >
                                        <div className="absolute inset-y-0 right-0  bg-brown" />
                                        {returns[period] && returns[period][strat]
                                            ? `${parseFloat(returns[period][strat]).toFixed(1)}%`
                                            : "0"}
                                    </td>
                                ))}
                                <td
                                    className={`p-18 text-start text-beige border border-brown ${index === strategies.length - 1 ? "border-b" : ""
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

    return (
        <div>
            <h2 className="sm:text-subheading text-mobileSubHeading font-subheading text-beige mb-18">
                Trailing Returns
            </h2>
            <p className="text-body font-body text-lightBeige mb-4">
                Trailing returns are annualised returns from the specified period till today.
            </p>
            <ResponsiveTable />
            <p className="text-beige text-sm sm:text-body font-body mt-4">
                *MDD (Maximum Drawdown) is how much money an investment loses from its
                highest point to its lowest point before it starts going up again.
            </p>
        </div>
    );
};


export default TrailingReturns;