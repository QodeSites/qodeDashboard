import { useMemo } from 'react';
import filterDataByCustomRange from '@/utils/filterDataByTimeRange';

const useFilteredData = (data, timeRange, startDate, endDate) => {
    return useMemo(() => {
        if (data && data.length > 0) {
            const latestDate = data.reduce((latest, current) => {
                const currentDate = new Date(current.date);
                return currentDate > new Date(latest.date) ? current : latest;
            }, data[0]);

            return filterDataByCustomRange(data, timeRange, startDate, endDate, latestDate.date);
        }
        return [];
    }, [data, timeRange, startDate, endDate]);
};

export default useFilteredData;