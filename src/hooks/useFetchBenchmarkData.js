import { useState, useEffect } from 'react';

const useFetchBenchmarkData = (indices, startDate, endDate) => {
  const [benchmarkData, setBenchmarkData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to remove any timestamp and keep only the date portion
  const cleanDate = (dateStr) => {
    return dateStr ? dateStr.split(" ")[0] : "";
  };

  // Clean the start and end dates
  const formattedStartDate = cleanDate(startDate);
  const formattedEndDate = cleanDate(endDate);

  // Create a cache key from the parameters (using the cleaned dates)
  const cacheKey = `${indices.join(',')}-${formattedStartDate}-${formattedEndDate}`;

  useEffect(() => {
    if (!indices || indices.length === 0) return;
    if (!startDate || !endDate) return;

    const fetchBenchmarkData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const indicesParam = indices.join(',');
        const url = `https://research.qodeinvest.com/api/getIndices?indices=${encodeURIComponent(
          indicesParam
        )}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
        //console.log('url', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Error fetching benchmark data: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        setBenchmarkData(result.data);
        //console.log('Fetched benchmark data:', result.data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch benchmark data');
        setBenchmarkData({}); // Clear the data on error
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data when the cache key changes
    fetchBenchmarkData();
  }, [cacheKey]);

  return { benchmarkData, isLoading, error };
};

export default useFetchBenchmarkData;
