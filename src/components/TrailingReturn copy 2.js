import React, { useState, useEffect, useCallback } from "react";

const TrailingReturns = ({ data, name }) => {
    const [returns, setReturns] = useState({
        "10D": {},
        "1W": {},
        "1M": {},
        "3M": {},
        "6M": {},
        "1Y": {},
        "3Y": {},
        "5Y": {},
        YTD: {},
    });
    const [drawdowns, setDrawdowns] = useState({
        latest: {},
        lowest: {},
    });

    const calculateReturns = useCallback((data) => {
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestDate = new Date(sortedData[sortedData.length - 1].date);

        const periods = {
            "10D": 10,
            "1W": 7,
            "1M": 30,
            "3M": 91,
            "6M": 182,
            "1Y": 365,
            "3Y": 3 * 365,
            "5Y": 5 * 365,
            YTD:
                latestDate.getFullYear() === new Date().getFullYear()
                    ? (latestDate - new Date(latestDate.getFullYear(), 0, 1)) /
                    (1000 * 60 * 60 * 24)
                    : (new Date(latestDate.getFullYear(), 11, 31) -
                        new Date(latestDate.getFullYear(), 0, 1)) /
                    (1000 * 60 * 60 * 24),
        };

        const calculatedReturns = {};

        for (const [period, days] of Object.entries(periods)) {
            const startIndex = sortedData.findIndex((item) => {
                const itemDate = new Date(item.date);
                const diffDays = (latestDate - itemDate) / (1000 * 60 * 60 * 24);
                return diffDays <= days;
            });

            if (startIndex !== -1) {
                const startValues = sortedData[startIndex];
                const endValues = sortedData[sortedData.length - 1];

                calculatedReturns[period] = {
                    strategy: calculateReturn(
                        parseFloat(startValues.total_portfolio_nav),
                        parseFloat(endValues.total_portfolio_nav),
                        period
                    ),
                    benchmark: calculateReturn(
                        parseFloat(startValues.benchmark_values),
                        parseFloat(endValues.benchmark_values),
                        period
                    ),
                };
            }
        }

        setReturns(calculatedReturns);
    }, []);

    const calculateReturn = (startValue, endValue, period) => {
        if (period === "3Y" || period === "5Y") {
            const timeRange = period === "3Y" ? 3 : 5;
            return (Math.pow(endValue / startValue, 1 / timeRange) - 1) * 100;
        } else {
            return ((endValue - startValue) / startValue) * 100;
        }
    };

    const calculateDrawdowns = useCallback((data) => {
        const drawdowns = {
            latest: {},
            lowest: {},
        };

        // Calculate drawdowns for strategy
        let strategyCalc = calculateDrawdownForSeries(data, 'total_portfolio_nav');
        drawdowns.latest.strategy = strategyCalc.latestDrawdown;
        drawdowns.lowest.strategy = strategyCalc.lowestDrawdown;

        // Calculate drawdowns for benchmark
        let benchmarkCalc = calculateDrawdownForSeries(data, 'benchmark_values');
        drawdowns.latest.benchmark = benchmarkCalc.latestDrawdown;
        drawdowns.lowest.benchmark = benchmarkCalc.lowestDrawdown;

        setDrawdowns(drawdowns);
    }, []);

    const calculateDrawdownForSeries = (data, key) => {
        let peak = parseFloat(data[0][key]);
        let lowestDrawdown = 0;
        let latestPeak = peak;
        const lastValue = parseFloat(data[data.length - 1][key]);

        data.forEach((item) => {
            const value = parseFloat(item[key]);
            if (value > peak) peak = value;
            if (value > latestPeak) latestPeak = value;

            const drawdown = ((value - peak) / peak) * 100;
            if (drawdown < lowestDrawdown) lowestDrawdown = drawdown;
        });

        const latestDrawdown = ((lastValue - latestPeak) / latestPeak) * 100;

        return {
            latestDrawdown,
            lowestDrawdown
        };
    };

    useEffect(() => {
        if (data && data.length > 0) {
            calculateReturns(data);
            calculateDrawdowns(data);
        }
    }, [data, calculateReturns, calculateDrawdowns]);

    const periods = ["10D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "YTD"];
    const benchmarkName = data && data.length > 0 ? data[0].benchmark : "Benchmark";

    return (
        <div className="overflow-x-auto sm:p-4 mb-4 p-1">
            <h2 className="sm:text-subheading text-mobileSubHeading font-subheading text-beige mb-18">
                Trailing Returns
            </h2>
            <p className="text-body font-body text-lightBeige mb-4">
                Trailing returns are annualised returns from the specified period till today.
            </p>

            <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-brown scrollbar-track-black">
                <table className="w-full min-w-[640px]">
                    <thead>
                        <tr className="border text-body font-body p-3 border-brown">
                            <th className="sticky -left-18 t-0 z-10 p-1 font-body text-body border-r border-brown text-left text-lightBeige bg-black">Strategy</th>
                            {periods.map((period) => (
                                <th key={period} className="p-2 font-body text-left text-body text-lightBeige">
                                    {period}
                                </th>
                            ))}
                            <th className="p-1 text-center border-l border-brown font-body text-body text-lightBeige">MDD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border border-brown text-lightBeige text-left">
                            <td className="sticky -left-18 z-10 p-1 border-r border-brown bg-black">{name}</td>
                            {periods.map((period) => (
                                <td key={period} className="p-1 text-lightBeige">
                                    {returns[period]?.strategy
                                        ? `${returns[period].strategy.toFixed(1)}%`
                                        : "0"}
                                </td>
                            ))}
                            <td className="p-1 border-l text-center text-lightBeige border-brown">
                                {drawdowns.lowest.strategy
                                    ? `${drawdowns.lowest.strategy.toFixed(1)}%`
                                    : "0"}
                            </td>
                        </tr>
                        <tr className="border border-brown text-lightBeige text-left">
                            <td className="sticky -left-18 z-10 p-1 border-r border-brown bg-black">{benchmarkName}</td>
                            {periods.map((period) => (
                                <td key={period} className="p-1 text-lightBeige">
                                    {returns[period]?.benchmark
                                        ? `${returns[period].benchmark.toFixed(1)}%`
                                        : "0"}
                                </td>
                            ))}
                            <td className="p-1 border-l text-center text-lightBeige border-brown">
                                {drawdowns.lowest.benchmark
                                    ? `${drawdowns.lowest.benchmark.toFixed(1)}%`
                                    : "0"}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className="text-beige text-body font-body mt-1">
                *MDD (Maximum Drawdown) is how much money an investment loses from its highest point to its lowest point before it starts going up again.
            </p>
        </div>
    );
};

export default TrailingReturns;