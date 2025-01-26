// hooks/useManagedAccounts.js

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

const useManagedAccounts = () => {
    const [data, setData] = useState(null); // Now expects an array
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
          console.log("Managed Accounts:", response.data.data);
  
          // Transform the data from an object to an array
          const transformedData = Object.entries(response.data.data).map(
            ([schemeName, strategies]) => ({
              schemeName,
              strategies: Object.entries(strategies).map(([strategy, masterSheetData]) => ({
                strategy,
                masterSheetData,
              })),
            })
          );
  
          setData(transformedData);
        } catch (err) {
          console.error("Error fetching managed accounts:", err);
          setError(err.response?.data?.error || "An error occurred");
        } finally {
          setLoading(false);
        }
      };
  
      fetchManagedAccounts();
    }, [session, status]);
  
    return { data, loading, error };
  };
  

export default useManagedAccounts;
