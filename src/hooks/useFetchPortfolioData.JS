// src/hooks/useFetchPortfolioData.js

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

const useFetchPortfolioData = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    dailyNAV: [],
    nuvama_codes: [],
    usernames: [],
    portfolioDetails: null,
    trailingReturns: null,
    portfoliosWithRatios: [],
    monthlyPnL: [],
    cashInOutData: [],
  });

  const fetchData = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsLoading(true);
    setError(null);
    try {
      // Always call the cumulative view endpoint
      const url = "/api/portfolio-data?view_type=cumulative";
      const response = await fetch(url);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to fetch data");
      }

      setData((prev) => ({
        ...prev,
        dailyNAV: responseData.dailyNAV || [],
        trailingReturns: responseData.trailingReturns || null,
        portfolioDetails: responseData.portfolioDetails || null,
        portfoliosWithRatios: responseData.portfoliosWithRatios || [],
        monthlyPnL: responseData.monthlyPnL || [],
        cashInOutData: responseData.cashInOutData || [],
      }));
    } catch (error) {
      console.error("Error fetching data: ", error);
      setError(error.message || "An error occurred while fetching data");
      setData((prev) => ({
        ...prev,
        dailyNAV: [],
        portfolioDetails: null,
        trailingReturns: null,
        portfoliosWithRatios: [],
        monthlyPnL: [],
        cashInOutData: [],
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      const nuvamaCodes = Array.isArray(session.user.nuvama_codes)
        ? session.user.nuvama_codes
        : [session.user.nuvama_codes];
      const usernames = Array.isArray(session.user.usernames)
        ? session.user.usernames
        : [session.user.usernames];

      setData((prev) => ({
        ...prev,
        nuvama_codes: nuvamaCodes,
        usernames: usernames,
      }));
      fetchData();
    }
  }, [session, fetchData]);

  return { data, isLoading, error };
};

export default useFetchPortfolioData;
