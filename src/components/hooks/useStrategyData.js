"use client";
import { useState, useEffect } from "react";

const useStrategyData = (strategy) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/mainData.json");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const jsonData = await response.json();
        if (!jsonData[strategy]) {
          throw new Error(`No data found for strategy: ${strategy}`);
        }
        setData(jsonData[strategy]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [strategy]);

  const calculateReturns = (period) => {
    // console.log("strategy data: ", data);
    // console.log("strategy: ", strategy);
    if (!data || data.length < 2) return "N/A";

    const latestData = data[data.length - 1];
    const latestDate = new Date(latestData.Date);
    const startDate = new Date(latestDate);

    switch (period) {
      case "1M":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "3Y":
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      case "5Y":
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      default:
        return "N/A";
    }

    const startIndex = data.findIndex((d) => new Date(d.Date) >= startDate);
    if (startIndex === -1) return "N/A"; // No data matches the start date

    const startValue = data[startIndex]["total_portfolio_nav"];
    const endValue = latestData["total_portfolio_nav"];

    console.log("startvalue", data[startIndex]);

    if (startValue === undefined || endValue === undefined) return "N/A";

    // Calculate return based on period
    if (period === "1Y" || period === "3Y" || period === "5Y") {
      const years = parseInt(period.slice(0, -1)); // Extract the number of years from the string
      const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
      return cagr.toFixed(2) + "%";
    } else {
      const returns = ((endValue - startValue) / startValue) * 100;
      return returns.toFixed(2) + "%";
    }
  };

  return { data, loading, error, calculateReturns };
};

export default useStrategyData;
