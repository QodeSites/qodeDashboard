import { useCallback } from "react";

const useCalculateCagr = () => {
  const calculateCAGR = useCallback(
    (data, timeRange = "ALL", portfolioType = "total_portfolio_nav") => {
      const parseDate = (dateString) => new Date(dateString);
      const sortedData = [...data].sort(
        (a, b) => parseDate(a.date) - parseDate(b.date)
      );

      if (sortedData.length < 2) return "Loading...";

      const latestData = sortedData[sortedData.length - 1];
      const latestDate = parseDate(latestData.date);
      let startDate = new Date(latestDate);

      if (timeRange === "Custom") {
        startDate = parseDate(sortedData[0].date);
      } else {
        switch (timeRange) {
          case "10D":
            startDate.setDate(startDate.getDate() - 10);
            break;
          case "1W":
            startDate.setDate(startDate.getDate() - 7);
            break;
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
          case "ALL":
            startDate = parseDate(sortedData[0].date);
            break;
          case "YTD":
            startDate.setMonth(0, 1);
            break;
          default:
            return "Invalid time range";
        }
      }

      const startIndex = sortedData.findIndex(
        (d) => parseDate(d.date) >= startDate
      );
      if (startIndex === -1) return "N/A";

      const startValue = parseFloat(sortedData[startIndex][portfolioType]);
      const endValue = parseFloat(latestData[portfolioType]);

      if (isNaN(startValue) || isNaN(endValue)) return "N/A";

      const days =
        (latestDate - parseDate(sortedData[startIndex].date)) /
        (24 * 60 * 60 * 1000);
      const years = days / 365;

      if (years <= 0) return "Invalid date range";

      // For periods less than a year, use simple return
      if (years < 1) {
        const simpleReturn = ((endValue - startValue) / startValue) * 100;
        return simpleReturn.toFixed(2) + "%";
      }

      // For periods of a year or more, use CAGR
      const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
      return cagr.toFixed(2) + "%";
    },
    []
  );
  return {
    calculateCAGR,
  };
};

export default useCalculateCagr;
