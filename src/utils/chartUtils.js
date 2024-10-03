export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const calculateDrawdown = (data) => {
    let peak = -Infinity;
    return data.map((item) => {
        const value = item.strategyValue;
        peak = Math.max(peak, value);
        const drawdown = ((value - peak) / peak) * 100;
        return [item.date, parseFloat(drawdown.toFixed(1))];
    });
};