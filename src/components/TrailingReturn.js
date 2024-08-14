import React, { useState, useEffect } from "react";

const TrailingReturns = ({ data }) => {
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

    const strategyNames = [
        { id: "strategy", name: "Strategy" },
        { id: "nifty", name: "Nifty" },
    ];

    return (
        <div className="sophia-pro-font overflow-x-auto">
            <h2 className="md:text-xl font-bold mb-2">Trailing Returns</h2>
            <table className="w-full min-w-[640px]">
                <thead>
                    <tr style={tableHeaderStyle} className="border-b-2 border-gray-200">
                        <th className="p-2 text-left">Strategy</th>
                        {periods.map((period) => (
                            <th key={period} className="p-2 text-left">
                                {period}
                            </th>
                        ))}
                        <th className="p-2 text-left border-l-2 border-gray-100">DD</th>
                        <th className="p-2 text-left border-l-2 border-gray-100">MDD</th>
                    </tr>
                </thead>
                <tbody>
                    {strategyNames.map((strat) => (
                        <tr
                            style={tableCellStyle}
                            key={strat.id}
                            className="border-b border-gray-100"
                        >
                            <td className="p-2 ">
                                {strat.name}
                            </td>

                            {periods.map((period) => (
                                <td style={tableCellStyle} key={period} className="p-2">
                                    {returns[period] && returns[period][strat.id]
                                        ? `${returns[period][strat.id].toFixed(1)}%`
                                        : "0%"}
                                </td>
                            ))}
                            <td
                                style={tableCellStyle}
                                className="p-2 border-l-2 border-gray-100"
                            >
                                {drawdowns.latest[strat.id]
                                    ? `${drawdowns.latest[strat.id].toFixed(1)}%`
                                    : "0%"}
                            </td>
                            <td
                                style={tableCellStyle}
                                className="p-2 border-l-2 border-gray-100"
                            >
                                {drawdowns.lowest[strat.id]
                                    ? `${drawdowns.lowest[strat.id].toFixed(1)}%`
                                    : "0%"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const tableHeaderStyle = {
    backgroundColor: "#F9FAFB",
    padding: "8px",
    textAlign: "left",
    fontSize: "14px",
};

const tableCellStyle = {
    padding: "8px",
    fontSize: "14px",
};

export default TrailingReturns;
