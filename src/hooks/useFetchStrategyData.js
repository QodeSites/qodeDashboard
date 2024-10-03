'use client'
import { useEffect, useState } from "react";

const useFetchStrategyData = (strategy) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const API_URL = process.env.API_URL;
    useEffect(() => {
        const fetchStrategyData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://api.qodeinvestments.com/api/strategies/${strategy}`);
                const strategyData = await response.json();
                setData(strategyData);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching data: ", error);
                setError(error.message);
                setIsLoading(false);
            }
        };
        fetchStrategyData();
    }, [strategy]);

    return { data, isLoading, error };
};
export default useFetchStrategyData;
