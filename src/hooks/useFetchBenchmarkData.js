import { useState, useEffect } from 'react';

const useFetchBenchmarkData = (indices, startDate, endDate) => {
    const [benchmarkData, setBenchmarkData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Create a cache key from the parameters
    const cacheKey = `${indices.join(',')}-${startDate}-${endDate}`;

    useEffect(() => {
        // console.log("useEffect triggered with new dates - indices:", indices, "startDate:", startDate, "endDate:", endDate);

        if (!indices || indices.length === 0) return;
        if (!startDate || !endDate) return;

        const fetchBenchmarkData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const indicesParam = indices.join(',');
                const response = await fetch(
                    `https://research.qodeinvest.com/api/getIndices?indices=${encodeURIComponent(indicesParam)}&startDate=${startDate}&endDate=${endDate}`
                );

                if (!response.ok) {
                    throw new Error(`Error fetching benchmark data: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                setBenchmarkData(result.data);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Failed to fetch benchmark data');
                setBenchmarkData({}); // Clear the data on error
            } finally {
                setIsLoading(false);
            }
        };

        // Always fetch when the cache key changes
        fetchBenchmarkData();
        
    }, [cacheKey]); // Use cacheKey in dependency array instead of benchmarkData

    return { benchmarkData, isLoading, error };
};

export default useFetchBenchmarkData;