

import { useState, useEffect } from "react";



export const useFetchHoldings = (url) => {
  const [holding, setHolding] = useState({
    momentum: [],
    qgf: [],
    strategy1: [],
    strategy2: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(url);
        const jsonData = await response.json();
        setHolding({
          momentum: jsonData.momentum,
          qgf: jsonData.qgf,
          lowvol: jsonData.lowvol,
          strategy1: jsonData.strategy1,
          strategy2: jsonData.strategy2,
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHoldings();
  }, [url]);

  return { holding, isLoading, error };
};
const fetchStrategyData = async (strategy, timeRange, startDate, endDate) => {
  console.log(timeRange);
  if (!strategy) {
    throw new Error("No strategy provided");
  } else if (strategy === "strategy1") {
    strategy = "SchemeA";
  } else if (strategy === "strategy2") {
    strategy = "SchemeB";
  } else if (strategy === "momentum") {
    strategy = "QMF";
  } else if (strategy === "qgf") {
    strategy = "QGF";
  } else if (strategy === "lowvol") {
    strategy = "LVF"
  }

  try {
    // Replace this URL with your actual localhost URL
    const response = await fetch(
      `https://api.qodeinvestments.com/api/strategies/${strategy}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = await response.json();
    console.log("dataasssss", data);

    if (!data || data.length === 0) {
      throw new Error(`No data found for strategy: ${strategy}`);
    }

    // Find the latest date in the data to use as the reference for filtering
    const latestDate = data.reduce((latest, current) => {
      const currentDate = new Date(current.date);
      return currentDate > new Date(latest.date) ? current : latest;
    }, data[0]);

    const filteredData = filterDataByTimeRange(
      data,
      timeRange,
      startDate,
      endDate,
      latestDate.date // Pass the latest date from your data
    );
    return filteredData;
  } catch (error) {
    console.error("Error fetching data: ", error);
    throw error;
  }
};

const filterDataByTimeRange = (data, range, start, end, latestDataDate) => {
  const latestDate = new Date(latestDataDate);

  if (start && end) {
    return data.filter(
      (item) =>
        new Date(item.date) >= new Date(start) &&
        new Date(item.date) <= new Date(end)
    );
  }

  let filterDate = new Date(latestDate);

  switch (range) {
    case "YTD":
      filterDate = new Date(latestDate.getFullYear(), 0, 1);
      break;
    case "6M":
      filterDate = new Date(latestDate.setMonth(latestDate.getMonth() - 6));
      break;
    case "1Y":
      filterDate = new Date(
        latestDate.setFullYear(latestDate.getFullYear() - 1)
      );
      break;
    case "3Y":
      filterDate = new Date(
        latestDate.setFullYear(latestDate.getFullYear() - 3)
      );
      break;
    case "5Y":
      filterDate = new Date(
        latestDate.setFullYear(latestDate.getFullYear() - 5)
      );
      break;
    case "3M":
      filterDate = new Date(latestDate.setMonth(latestDate.getMonth() - 3));
      break;
    case "1M":
      filterDate = new Date(latestDate.setMonth(latestDate.getMonth() - 1));
      break;
    default:
      return data; // "ALL" case or undefined time range
  }

  return data.filter((item) => new Date(item.date) >= filterDate);
};

export default fetchStrategyData;
