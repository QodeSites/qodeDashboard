import React from "react";
import { Spinner } from "@material-tailwind/react";
import Text from "./common/Text";
import Heading from "./common/Heading";

const TrailingReturns = ({ data, isLoading, error, name }) => {
    if (isLoading)
        return (
            <div className="text-start flex justify-center items-center">
                <Spinner className="text-gray-700 dark:text-gray-300" />
            </div>
        );
    if (error) return <div>Error: {error}</div>;
    if (!data) return null;
    
    const periods = [
        { key: "d10", label: "10D" },
        { key: "m1", label: "1M" },
        { key: "m3", label: "3M" },
        { key: "m6", label: "6M" },
        { key: "y1", label: "1Y" },
        { key: "y2", label: "2Y" },
        { key: "y5", label: "5Y" },
        { key: "since_inception", label: "Inception" }
    ];

    const formatValue = (value) => {
        if (!value || value === "nan") return "-";
        return `${parseFloat(value).toFixed(1)}%`;
    };

    const ResponsiveTable = () => (
        <div className="overflow-x-auto">
            <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 rounded-lg  dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                <table className="w-full text-center min-w-[640px]">
                    <thead>
                        <tr className="border border-gray-200 dark:border-gray-700">
                            <th className="sticky -left-18 t-0 p-1 font-body text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-black">
                                <div className="absolute inset-y-0 right-0 w-[1px] bg-gray-200 dark:bg-gray-700" />
                                Strategy
                            </th>
                            {periods.map(({ label }) => (
                                <th
                                    key={label}
                                    className="p-2 font-body text-sm text-gray-900 dark:text-gray-100"
                                >
                                    {label}
                                </th>
                            ))}
                            <th className="p-1 text-center border-l border-gray-200 dark:border-gray-700 font-body text-sm text-gray-900 dark:text-gray-100">
                                MDD
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border border-gray-200 dark:border-gray-700 text-xs text-center">
                            <td className="sticky  -left-18 p-18 bg-white dark:bg-black">
                                <div className="absolute inset-y-0 right-0 w-[1px] bg-gray-200 dark:bg-gray-700" />
                                {data.name}
                            </td>
                            {periods.map(({ key }) => (
                                <td key={key} className="p-1 text-gray-900 dark:text-gray-100">
                                    {formatValue(data[key])}
                                </td>
                            ))}
                            <td className="xl:p-1 text-center text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700">
                                {formatValue(data.mdd)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div>
            <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-brown mb-18">
                Returns
            </Heading>
            <ResponsiveTable />
            <Text className="text-gray-700 dark:text-gray-300 text-sm font-body mt-1">
                MDD (Maximum Drawdown) refers to the maximum loss an investment can incur from its highest point.
                Current Drawdown: {formatValue(data.current_drawdown)}
            </Text>
        </div>
    );
};

export default TrailingReturns;