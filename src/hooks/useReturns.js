import { useMemo } from 'react';
import useCalculateCagr from './useCalculateCagr';

const useReturns = (filteredData, timeRange) => {
    const { calculateCAGR } = useCalculateCagr();

    const calculateReturns = (data, key) => {
        if (data.length < 2) return "N/A";
        const startValue = parseFloat(data[0][key]);
        const endValue = parseFloat(data[data.length - 1][key]);
        return (((endValue - startValue) / startValue) * 100).toFixed(2) + "%";
    };

    const strategyCagr = useMemo(
        () => calculateCAGR(filteredData, timeRange, "total_portfolio_nav"),
        [calculateCAGR, filteredData, timeRange]
    );

    const niftyCagr = useMemo(
        () => calculateCAGR(filteredData, timeRange, "benchmark_values"),
        [calculateCAGR, filteredData, timeRange]
    );

    const strategyReturns = useMemo(
        () => calculateReturns(filteredData, "total_portfolio_nav"),
        [filteredData]
    );

    const niftyReturns = useMemo(
        () => calculateReturns(filteredData, "benchmark_values"),
        [filteredData]
    );

    return { strategyCagr, niftyCagr, strategyReturns, niftyReturns };
};

export default useReturns;