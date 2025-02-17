import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

const useFetchStrategyData = () => {
  const { data: session } = useSession();
  const [selectedNuvama, setSelectedNuvama] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("individual");
  const [data, setData] = useState({
    dailyNAV: [],
    nuvama_codes: [],
    usernames: [],
    portfolioDetails: null,
    trailingReturns: null,
    portfoliosWithRatios: [],
    monthlyPnL: [],
    cashInOutData: [], // Added cash in/out data
  });

  // Initialize nuvama codes and usernames from session
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

      // Only set initial selectedNuvama if not already set and in individual view
      if (!selectedNuvama && viewMode === "individual") {
        setSelectedNuvama(nuvamaCodes[0]);
      }
    }
  }, [session, selectedNuvama, viewMode]);

  // Memoized fetch function to prevent unnecessary recreations
  const fetchData = useCallback(
    async (mode = viewMode, nuvamaCode = selectedNuvama) => {
      if (typeof window === "undefined") return;

      setIsLoading(true);
      setError(null);

      try {
        let url = "/api/portfolio-data?view_type=" + mode;
        // console.log("URL: ", url);

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

  // Handle view mode changes
  const handleViewModeChange = useCallback(
    async (newMode) => {
      setViewMode(newMode);

      if (newMode === "cumulative") {
        // When switching to cumulative (Total Portfolio) view,
        // clear the individual selection and fetch aggregated data.
        setSelectedNuvama(null);
        await fetchData("cumulative", null);
      } else {
        // For individual view, ensure we have a selected Nuvama code
        const nuvamaCode = data.nuvama_codes[0];
        setSelectedNuvama(nuvamaCode);
        await fetchData("individual", nuvamaCode);
      }
    },
    [fetchData, data.nuvama_codes]
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
