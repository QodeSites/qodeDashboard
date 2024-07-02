export const calculateDrawdown = (data) => {
  let peak = -Infinity;
  return data.map((item) => {
    const value = item["Total Portfolio NAV"];
    peak = Math.max(peak, value);
    const drawdown = ((value - peak) / peak) * 100;
    return [
      new Date(item.Date.split("-").reverse().join("-")).getTime(),
      drawdown,
    ];
  });
};
export const calculateTop10Drawdown = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid data provided to calculateTop10Drawdown");
    return [];
  }

  let peak = -Infinity;
  let peakDate = null;
  let drawdowns = [];
  let currentDrawdown = null;

  data.forEach((item, index) => {
    if (typeof item["Total Portfolio NAV"] !== "number") {
      console.error(
        "Invalid Total Portfolio NAV:",
        item["Total Portfolio NAV"]
      );
      return;
    }

    const value = item["Total Portfolio NAV"];
    const date = new Date(item.Date.split("-").reverse().join("-"));

    if (value > peak) {
      peak = value;
      peakDate = date;

      if (currentDrawdown) {
        currentDrawdown.recoveryDate = date;
        currentDrawdown.recoveryPeriod =
          (date - currentDrawdown.drawdownDate) / (1000 * 60 * 60 * 24); // in days
        currentDrawdown.peakToPeak =
          (date - currentDrawdown.peakDate) / (1000 * 60 * 60 * 24); // in days
        drawdowns.push(currentDrawdown);
        currentDrawdown = null;
      }
    } else {
      const drawdownPercent = ((value - peak) / peak) * 100;

      if (!currentDrawdown || drawdownPercent < currentDrawdown.worstDrawdown) {
        currentDrawdown = {
          peakDate: peakDate,
          drawdownDate: date,
          worstDrawdown: drawdownPercent,
          recoveryDate: null,
          recoveryPeriod: null,
          peakToPeak: null,
        };
      }
    }

    if (index === data.length - 1 && currentDrawdown) {
      drawdowns.push(currentDrawdown);
    }
  });

  return drawdowns
    .sort((a, b) => a.worstDrawdown - b.worstDrawdown)
    .slice(0, 10)
    .map((d) => ({
      ...d,
      worstDrawdown: d.worstDrawdown.toFixed(2),
      recoveryPeriod: d.recoveryPeriod
        ? Math.round(d.recoveryPeriod)
        : "Not Yet Recovered",
      peakToPeak: d.peakToPeak ? Math.round(d.peakToPeak) : "Not Yet Recovered",
    }));
};

export function calculateMonthlyPL(data) {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid or empty data array provided");
    return [];
  }

  // Sort data by date
  data.sort(
    (a, b) =>
      new Date(a.Date.split("-").reverse().join("-")) -
      new Date(b.Date.split("-").reverse().join("-"))
  );

  console.log(data);

  // Aggregate data by month
  const monthlyData = {};
  data.forEach((item) => {
    const date = new Date(item.Date.split("-").reverse().join("-"));
    const monthYearKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData[monthYearKey]) {
      monthlyData[monthYearKey] = {
        totalNAV: 0,
        count: 0,
      };
    }
    monthlyData[monthYearKey].totalNAV += item["Total Portfolio NAV"];
    monthlyData[monthYearKey].count++;
  });

  //   console.log(monthlyData);

  // Calculate average monthly NAV values
  const months = Object.keys(monthlyData).sort();
  const results = [];
  let previousAvgNAV = null;

  for (const month of months) {
    const averageNAV = monthlyData[month].totalNAV / monthlyData[month].count;
    monthlyData[month].averageNAV = averageNAV;

    if (previousAvgNAV !== null) {
      // Calculate percentage change from the previous month
      const percentChange =
        ((averageNAV - previousAvgNAV) / previousAvgNAV) * 100;
      results.push({
        month: month,
        percentChange: percentChange.toFixed(2) + "%",
      });
    }
    previousAvgNAV = averageNAV; // Update previousAvgNAV for the next iteration
  }

  return results;
}
