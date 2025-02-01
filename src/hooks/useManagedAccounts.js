import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

const useManagedAccounts = () => {
    const [data, setData] = useState(null); // Holds the transformed grouped data
    const [totals, setTotals] = useState({ totalCapitalInvested: 0, totalDividends: 0 }); // Holds the totals
    const [cashInOutData, setCashInOutData] = useState([]); // Holds the cash in/out data
    const [schemeWiseCapitalInvested, setSchemeWiseCapitalInvested] = useState({}); // Holds scheme-wise capital invested
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

                // Extract grouped data, totals, and scheme-wise capital invested from the response
                const {
                    data: groupedData,
                    totalCapitalInvested,
                    totalDividends,
                    cashInOutData,
                    schemeWiseCapitalInvested, // New field from the API
                } = response.data;

                // Transform the grouped data from an object to an array
                const transformedData = Object.entries(groupedData).map(
                    ([schemeName, strategies]) => ({
                        schemeName,
                        strategies: Object.entries(strategies).map(([strategy, masterSheetData]) => ({
                            strategy,
                            masterSheetData,
                        })),
                    })
                );

                // Update state with transformed data, totals, and scheme-wise capital invested
                setData(transformedData);
                setTotals({ totalCapitalInvested, totalDividends });
                setCashInOutData(cashInOutData);
                setSchemeWiseCapitalInvested(schemeWiseCapitalInvested); // Update scheme-wise capital invested
            } catch (err) {
                console.error("Error fetching managed accounts:", err);
                setError(err.response?.data?.error || "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchManagedAccounts();
    }, [session, status]);

    return { data, totals, cashInOutData, schemeWiseCapitalInvested, loading, error };
};

export default useManagedAccounts;