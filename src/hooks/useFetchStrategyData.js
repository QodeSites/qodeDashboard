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
        monthlyPnL: [], // Initialized here
    });

    // Initialize nuvama codes and usernames from session
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        if (session?.user) {
            const nuvamaCodes = Array.isArray(session.user.nuvama_codes)
                ? session.user.nuvama_codes
                : [session.user.nuvama_codes];
            
            const usernames = Array.isArray(session.user.usernames)
                ? session.user.usernames
                : [session.user.usernames];

            setData(prev => ({
                ...prev,
                nuvama_codes: nuvamaCodes,
                usernames: usernames,
            }));

            // Only set initial selectedNuvama if not already set
            if (!selectedNuvama && viewMode === 'individual') {
                setSelectedNuvama(nuvamaCodes[0]);
            }
        }
    }, [session, selectedNuvama, viewMode]);

    // Memoized fetch function to prevent unnecessary recreations
    const fetchData = useCallback(async (mode = viewMode, nuvamaCode = selectedNuvama) => {
        if (typeof window === 'undefined') return;
        
        setIsLoading(true);
        setError(null);

        try {
            let url = '/api/portfolio-data?view_type=' + mode;
            console.log("URL: ", url);
            
            // Add nuvama_code parameter only for individual view
            if (mode === 'individual' && nuvamaCode) {
                url += `&nuvama_code=${nuvamaCode}`;
            }

            const response = await fetch(url);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to fetch data');
            }

            setData(prev => ({
                ...prev,
                dailyNAV: responseData.dailyNAV || [],
                trailingReturns: responseData.trailingReturns || null,
                portfolioDetails: responseData.portfolioDetails || null,
                portfoliosWithRatios: responseData.portfoliosWithRatios || [],
                monthlyPnL: responseData.monthlyPnL || [], // **Added monthlyPnL**
            }));
        } catch (error) {
            console.error("Error fetching data: ", error);
            setError(error.message || 'An error occurred while fetching data');
            setData(prev => ({
                ...prev,
                dailyNAV: [],
                portfolioDetails: null,
                trailingReturns: null,
                portfoliosWithRatios: [],
                monthlyPnL: [], // **Reset monthlyPnL on error**
            }));
        } finally {
            setIsLoading(false);
        }
    }, [viewMode, selectedNuvama]);

    // Handle view mode changes
    const handleViewModeChange = useCallback(async (newMode) => {
        setViewMode(newMode);
        
        if (newMode === 'cumulative') {
            setSelectedNuvama(null);
            await fetchData('cumulative', null);
        } else {
            // For individual view, ensure we have a selected Nuvama code
            const nuvamaCode = data.nuvama_codes[0];
            setSelectedNuvama(nuvamaCode);
            await fetchData('individual', nuvamaCode);
        }
    }, [fetchData, data.nuvama_codes]);

    // Effect for handling selectedNuvama changes in individual view
    useEffect(() => {
        if (viewMode === 'individual' && selectedNuvama) {
            fetchData('individual', selectedNuvama);
        }
    }, [selectedNuvama, viewMode, fetchData]);

    return {
        data,
        isLoading,
        error,
        selectedNuvama,
        setSelectedNuvama,
        viewMode,
        handleViewModeChange
    };
};

export default useFetchStrategyData;
