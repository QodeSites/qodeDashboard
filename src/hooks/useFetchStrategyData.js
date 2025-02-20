import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

const useFetchStrategyData = () => {
  const { data: session } = useSession();
  const [selectedNuvama, setSelectedNuvama] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Set default view mode to cumulative
  const [viewMode, setViewMode] = useState("cumulative");
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

  // Memoized fetch function to prevent unnecessary recreations
  const fetchData = useCallback(
    async (mode = viewMode, nuvamaCode = selectedNuvama) => {
      if (typeof window === "undefined") return;

      setIsLoading(true);
      setError(null);

      try {
        let url = "/api/portfolio-data?view_type=" + mode;
        //console.log("URL: ", url);

        // For individual view, add nuvama_code parameter.
        if (mode === "individual" && nuvamaCode) {
          url += `&nuvama_code=${nuvamaCode}`;
        } else if (mode === "cumulative") {
          // For cumulative view, pass all nuvama codes
          if (data.nuvama_codes && data.nuvama_codes.length > 0) {
            url += `&nuvama_codes=${data.nuvama_codes.join(",")}`;
          }
        }

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

        // Process cash in/out data if needed
        if (responseData.cashInOutData) {
          const processedCashInOut = responseData.cashInOutData.map((record) => ({
            ...record,
            date: new Date(record.date), // Ensure date is properly formatted
            cash_in_out: parseFloat(record.cash_in_out), // Ensure numeric value
          }));

          setData((prev) => ({
            ...prev,
            cashInOutData: processedCashInOut,
          }));
        }
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
    },
    [viewMode, selectedNuvama, data.nuvama_codes]
  );

  // Initialize nuvama codes and usernames from session.
  // For cumulative view, immediately fetch the aggregated data.
  useEffect(() => {
    if (typeof window === "undefined") return;

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

      // For individual view, set the initial selection if needed.
      if (viewMode === "individual" && !selectedNuvama) {
        setSelectedNuvama(nuvamaCodes[0]);
      }

      // For cumulative view, fetch the aggregated data immediately.
      if (viewMode === "cumulative") {
        fetchData("cumulative", null);
      }
    }
  }, [session, selectedNuvama, viewMode, fetchData]);

  // Handle view mode changes
  const handleViewModeChange = useCallback(
    async (newMode) => {
      setViewMode(newMode);
  
      if (newMode === "cumulative") {
        setSelectedNuvama(null);
        await fetchData("cumulative", null);
      } else {
        // Use the current selectedNuvama if available; otherwise, default to the first code.
        const nuvamaCode = selectedNuvama || data.nuvama_codes[0];
        setSelectedNuvama(nuvamaCode);
        await fetchData("individual", nuvamaCode);
      }
    },
    [fetchData, data.nuvama_codes, selectedNuvama]
  );
  
  // Effect for handling selectedNuvama changes in individual view
  useEffect(() => {
    if (viewMode === "individual" && selectedNuvama) {
      fetchData("individual", selectedNuvama);
    }
  }, [selectedNuvama, viewMode, fetchData]);

  // Utility function to summarize cash flow
  const getCashFlowSummary = useCallback(() => {
    if (!data.cashInOutData.length)
      return { totalIn: 0, totalOut: 0, netFlow: 0 };

    return data.cashInOutData.reduce(
      (acc, flow) => {
        const amount = flow.cash_in_out;
        if (amount > 0) {
          acc.totalIn += amount;
        } else {
          acc.totalOut += Math.abs(amount);
        }
        acc.netFlow += amount;
        return acc;
      },
      { totalIn: 0, totalOut: 0, netFlow: 0 }
    );
  }, [data.cashInOutData]);

  return {
    data,
    isLoading,
    error,
    selectedNuvama,
    setSelectedNuvama,
    viewMode,
    handleViewModeChange,
    getCashFlowSummary,
  };
};

export default useFetchStrategyData;
