import React, { useState, useEffect } from "react";
import Text from "./common/Text";

const TrailingReturns = ({ data, strategyName }) => {
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

    useEffect(() => {
        calculateReturns(data);
        calculateDrawdowns(data);
    }, [data]);

    const calculateReturns = (data) => {
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
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
                        parseFloat(startValues['total_portfolio_nav']),
                        parseFloat(endValues['total_portfolio_nav']),
                        period
                    ),
                    nifty: calculateReturn(
                        parseFloat(startValues["nifty"]),
                        parseFloat(endValues["nifty"]),
                        period
                    ),
                };
            }
        }

        setReturns(calculatedReturns);
    };

    const calculateReturn = (startValue, endValue, period) => {
        if (period === "3Y" || period === "5Y") {
            const timeRange = period === "3Y" ? 3 : 5;
            return (Math.pow(endValue / startValue, 1 / timeRange) - 1) * 100;
        } else {
            return ((endValue - startValue) / startValue) * 100;
        }
    };

    const calculateDrawdowns = (data) => {
        const drawdowns = {
            latest: {},
            lowest: {},
        };

        let peak = parseFloat(data[0]["total_portfolio_nav"]);
        let lowestDrawdown = 0;
        let latestPeak = parseFloat(data[0]["total_portfolio_nav"]);
        const lastValue = parseFloat(data[data.length - 1]["total_portfolio_nav"]);

        data.forEach((item) => {
            const value = parseFloat(item["total_portfolio_nav"]);

            if (value > peak) {
                peak = value;
            }

            const drawdown = ((value - peak) / peak) * 100;

            if (drawdown < lowestDrawdown) {
                lowestDrawdown = drawdown;
            }

            if (value > latestPeak) {
                latestPeak = value;
            }
        });

        const latestDrawdown = ((lastValue - latestPeak) / latestPeak) * 100;

        drawdowns.latest.strategy = latestDrawdown;
        drawdowns.lowest.strategy = lowestDrawdown;

        // Calculate drawdowns for Nifty
        peak = parseFloat(data[0]["nifty"]);
        lowestDrawdown = 0;
        latestPeak = parseFloat(data[0]["nifty"]);
        const lastNiftyValue = parseFloat(data[data.length - 1]["nifty"]);

        data.forEach((item) => {
            const value = parseFloat(item["nifty"]);

            if (value > peak) {
                peak = value;
            }

            const drawdown = ((value - peak) / peak) * 100;

            if (drawdown < lowestDrawdown) {
                lowestDrawdown = drawdown;
            }

            if (value > latestPeak) {
                latestPeak = value;
            }
        });

        const latestNiftyDrawdown = ((lastNiftyValue - latestPeak) / latestPeak) * 100;

        drawdowns.latest.nifty = latestNiftyDrawdown;
        drawdowns.lowest.nifty = lowestDrawdown;

        setDrawdowns(drawdowns);
    };

    const periods = ["10D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "YTD"];
    console.log(data)
    const strategyNames = [
        { id: "strategy", name: strategyName },
        { id: "nifty", name: "Nifty" },
    ];

    return (
        <div className="overflow-x-auto border border-brown p-4">
            <h2 className="text-subheading font-subheading text-beige mb-18">Trailing Returns</h2>
            <Text className="text-body font-body text-lightBeige mb-4">Trailing returns are annualised returns from the specified period till today.</Text>
            <table className="w-full min-w-[640px]">
                <thead>
                    <tr className="border text-body font-body p-3 border-brown">
                        <th className="p-1 font-body text-body border-r border-brown text-left text-lightBeige">Strategy</th>
                        {periods.map((period) => (
                            <th key={period} className="p-2 font-body  text-left  text-body text-lightBeige ">
                                {period}
                            </th>
                        ))}
                        {/* <th className="p-1 text-center border-l border-brown">DD</th> */}
                        <th className="p-1 text-center border-l border-brown font-body text-body text-lightBeige">MDD</th>
                    </tr>
                </thead>
                <tbody>
                    {strategyNames.map((strat) => (
                        <tr key={strat.id} className="border border-brown text-lightBeige text-left">
                            <td className="p-1 border-r border-brown">{strat.name}</td>

                            {periods.map((period) => (
                                <td key={period} className="p-1 text-lightBeige">
                                    {returns[period] && returns[period][strat.id]
                                        ? `${returns[period][strat.id].toFixed(1)}%`
                                        : "0%"}
                                </td>
                            ))}
                            {/* <td className="p-1 border-l border-brown">
                                {drawdowns.latest[strat.id]
                                    ? `${drawdowns.latest[strat.id].toFixed(1)}%`
                                    : "0%"}
                            </td> */}
                            <td className="p-1 border-l text-center text-lightBeige border-brown">
                                {drawdowns.lowest[strat.id]
                                    ? `${drawdowns.lowest[strat.id].toFixed(1)}%`
                                    : "0%"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Text className="text-beige text-body font-body mt-1">*MDD(Maximum Drawdown) is how much money an investments loses from it's highest point to it's lowest point before it starts going up again.</Text>

        </div>
    );

};


export default TrailingReturns;
