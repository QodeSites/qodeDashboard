export default function filterDataByCustomRange(data, range, start, end, latestDataDate) {
    const filterDataByTimeRange = (data, range, start, end, latestDataDate) => {
        const latestDate = new Date(latestDataDate);

        if (start && end) {
            return data.filter(
                (item) =>
                    new Date(item.date) >= new Date(start) &&
                    new Date(item.date) <= new Date(end)
            );
        }

        let filterDate = new Date(latestDate);

        switch (range) {
            case "YTD":
                filterDate = new Date(latestDate.getFullYear(), 0, 1);
                break;
            case "6M":
                filterDate = new Date(latestDate.setMonth(latestDate.getMonth() - 6));
                break;
            case "1Y":
                filterDate = new Date(
                    latestDate.setFullYear(latestDate.getFullYear() - 1)
                );
                break;
            case "3Y":
                filterDate = new Date(
                    latestDate.setFullYear(latestDate.getFullYear() - 3)
                );
                break;
            case "5Y":
                filterDate = new Date(
                    latestDate.setFullYear(latestDate.getFullYear() - 5)
                );
                break;
            case "3M":
                filterDate = new Date(latestDate.setMonth(latestDate.getMonth() - 3));
                break;
            case "1M":
                filterDate = new Date(latestDate.setMonth(latestDate.getMonth() - 1));
                break;
            default:
                return data; // "ALL" case or undefined time range
        }

        return data.filter((item) => new Date(item.date) >= filterDate);
    };
    return filterDataByTimeRange(data, range, start, end, latestDataDate);
}