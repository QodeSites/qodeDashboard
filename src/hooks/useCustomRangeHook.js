import { useCallback, useState } from "react";

const useCustomTimeRange = () => {
    const [timeRange, setTimeRange] = useState("ALL");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [activeButton, setActiveButton] = useState("ALL");

    const handleTimeRangeChange = useCallback((range) => {
        setTimeRange(range);
        setActiveButton(range);
        if (range !== "ALL" && range !== "Custom") {
            setStartDate(null);
            setEndDate(null);
        }
        if (range === "YTD") {
            const currentDate = new Date();
            setStartDate(
                new Date(currentDate.getFullYear(), 0, 1).toISOString().split("T")[0]
            );
            setEndDate(currentDate.toISOString().split("T")[0]);
        }
        setIsCustomDateOpen(false);
    }, []);

    const handleCustomDateClick = () => {
        setIsCustomDateOpen(!isCustomDateOpen);
    };

    const setCustomDateRange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        setTimeRange("Custom");
        setActiveButton("Custom");
    };

    const handleCustomDateSubmit = () => {
        if (startDate && endDate) {
            setTimeRange("Custom");
            setActiveButton("Custom");
            setIsCustomDateOpen(false);
            loadData();
        } else {
            alert("Please select both start and end dates.");
        }
    };

    return {
        timeRange,
        startDate,
        endDate,
        activeButton,
        isCustomDateOpen,
        setCustomDateRange,
        handleCustomDateClick,
        handleTimeRangeChange,
    };
};

export default useCustomTimeRange;
