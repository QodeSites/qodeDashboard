import React, { useState, useEffect } from "react";

const TrailingReturns = ({ strategy }) => {
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
        fetchData();
    }, [strategy]);




    const fetchData = async () => {
        try {
            const response = await fetch('/mainData.json');
            const jsonData = await response.json();

            calculateReturns(jsonData[strategy]);
            calculateDrawdowns(jsonData[strategy]);
        } catch (error) {
            console.log(error.message);
        }
    };




    const calculateReturns = (data) => {
        const sortedData = data.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        const latestDate = new Date(sortedData[sortedData.length - 1].Date);
        console.log("data", latestDate);

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
                const itemDate = new Date(item.Date);
                const diffDays = (latestDate - itemDate) / (1000 * 60 * 60 * 24);
                return diffDays <= days;
            });

            if (startIndex !== -1) {
                const startValues = sortedData[startIndex];
                const endValues = sortedData[sortedData.length - 1];

                calculatedReturns[period] = {
                    [strategy]: calculateReturn(
                        startValues['Total Portfolio NAV'],
                        endValues['Total Portfolio NAV'],
                        period
                    ),
                    "Nifty": calculateReturn(
                        startValues["Nifty"],
                        endValues["Nifty"],
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
        const strategies = [strategy, "Nifty"];
        const drawdowns = {
            latest: {},
            lowest: {},
        };

        strategies.forEach((strat) => {
            let peak = data[0][strat];
            let lowestDrawdown = 0;
            let latestPeak = data[0][strat];
            const lastValue = data[data.length - 1][strat];

            data.forEach((item) => {
                const value = item[strat];

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

            drawdowns.latest[strat] = latestDrawdown;
            drawdowns.lowest[strat] = lowestDrawdown;
        });

        setDrawdowns(drawdowns);
    };

    const strategies = [strategy, "Nifty"];
    const periods = ["10D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "YTD"];

    const strategyNames = [
        { id: "qgf", name: "Quality Fund" },
        { id: "momentum", name: "High-Return & Churn Fund" },
        { id: "lowvol", name: "Steady Fund" },
        { id: "strategy1", name: "Risk-managed Quality Fund" },
        { id: "strategy2", name: "Additional Return Fund" },
        { id: "Nifty", name: "Nifty" }, // Added Nifty to the list
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
                    {strategies.map((strat) => (
                        <tr
                            style={tableCellStyle}
                            key={strat}
                            className="border-b border-gray-100"
                        >
                            <td className="p-2 ">
                                {strategyNames.filter((item) => item.id === strat).map((item) => item.name)}
                            </td>

                            {periods.map((period) => (
                                <td style={tableCellStyle} key={period} className="p-2">
                                    {returns[period] && returns[period][strat]
                                        ? `${returns[period][strat].toFixed(1)}%`
                                        : "0%"}
                                </td>
                            ))}
                            <td
                                style={tableCellStyle}
                                className="p-2 border-l-2 border-gray-100"
                            >
                                {drawdowns.latest[strat]
                                    ? `${drawdowns.latest[strat].toFixed(1)}%`
                                    : "0%"}
                            </td>
                            <td
                                style={tableCellStyle}
                                className="p-2 border-l-2 border-gray-100"
                            >
                                {drawdowns.lowest[strat]
                                    ? `${drawdowns.lowest[strat].toFixed(1)}%`
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
