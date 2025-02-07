import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

const useManagedAccounts = () => {
  const [accountsData, setAccountsData] = useState(null);
  const [aggregatedTotals, setAggregatedTotals] = useState({
    totalInvestedAmount: 0,
    totalPortfolioValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchManagedAccounts = async () => {
      if (status !== "authenticated") {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "/api/managed-accounts?user_id=" + session.user.id
        );
        console.log("Managed Accounts Response:", response.data);

        const { accounts } = response.data.data;

        // Transform accounts data into a more usable format
        const transformedAccounts = Object.entries(accounts).map(
          ([accountCode, accountData]) => {
            const { clientName, schemes, totalPortfolio } = accountData;

            // Transform schemes data
            const transformedSchemes = Object.entries(schemes).map(
              ([schemeName, schemeData]) => ({
                schemeName,
                currentPortfolioValue: schemeData.currentPortfolioValue,
                investedAmount: schemeData.investedAmount,
                returns: schemeData.returns,
                trailingReturns: schemeData.trailingReturns,
                monthlyPnL: schemeData.monthlyPnL,
                navCurve: schemeData.navCurve,
                drawdown: schemeData.drawdown,
                drawdownCurve: schemeData.drawdownCurve, // Include drawdown curve here
                cashFlows: schemeData.cashFlows,
              })
            );

            return {
              accountCode,
              clientName,
              schemes: transformedSchemes,
              totalPortfolio: {
                investedAmount: totalPortfolio.investedAmount,
                schemeAllocation: totalPortfolio.schemeAllocation,
                currentPortfolioValue: totalPortfolio.currentPortfolioValue,
                returns: totalPortfolio.returns,
                trailingReturns: totalPortfolio.trailingReturns,
                monthlyPnL: totalPortfolio.monthlyPnL,
                navCurve: totalPortfolio.navCurve,
                drawdown: totalPortfolio.drawdown,
                drawdownCurve: totalPortfolio.drawdownCurve, // Include drawdown curve here as well
                cashFlows: totalPortfolio.cashFlows
              },
            };
          }
        );

        // Calculate aggregated totals across all accounts
        const totals = transformedAccounts.reduce(
          (acc, account) => {
            const accountInvestedAmount = account.totalPortfolio.investedAmount || 0;
            // Sum the portfolio value from each individual scheme
            const accountPortfolioValue = account.schemes.reduce(
              (sum, scheme) => sum + (scheme.currentPortfolioValue || 0),
              0
            );

            return {
              totalInvestedAmount:
                acc.totalInvestedAmount + accountInvestedAmount,
              totalPortfolioValue:
                acc.totalPortfolioValue + accountPortfolioValue,
            };
          },
          {
            totalInvestedAmount: 0,
            totalPortfolioValue: 0,
          }
        );

        setAccountsData(transformedAccounts);
        setAggregatedTotals(totals);
      } catch (err) {
        console.error("Error fetching managed accounts:", err);
        setError(err.response?.data?.error || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchManagedAccounts();
  }, [session, status]);

  // Helper functions for data access
  const getAccountByCode = (accountCode) =>
    accountsData?.find((account) => account.accountCode === accountCode);

  const getSchemesByAccount = (accountCode) =>
    getAccountByCode(accountCode)?.schemes || [];

  const getClientName = (accountCode) =>
    getAccountByCode(accountCode)?.clientName;

  const getAllSchemes = () =>
    accountsData?.flatMap((account) => account.schemes) || [];

  // New helper function to access total portfolio data by account code
  const getTotalPortfolioByAccount = (accountCode) =>
    getAccountByCode(accountCode)?.totalPortfolio;

  return {
    accountsData,
    aggregatedTotals,
    loading,
    error,
    // Helper functions
    getAccountByCode,
    getSchemesByAccount,
    getClientName,
    getAllSchemes,
    getTotalPortfolioByAccount,
  };
};

export default useManagedAccounts;
