// hooks/useFetchData.js
import { useState, useEffect } from "react";

export const useFetchData = (url) => {
  const [data, setData] = useState({ scheme1: [], scheme2: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(url);
        const jsonData = await response.json();
        setData({
          scheme1: jsonData.strategy1,
          scheme2: jsonData.strategy2,
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, isLoading, error };
};
