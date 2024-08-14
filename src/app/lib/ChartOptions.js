
export const getChartOptions = (chartData, strategy) => {
  console.log("chartdata", chartData);

  if (!chartData) {
    console.error("Data is not available for: ", strategy);
    return {};
  }

  const prepareChartData = (data) => {
    const strategyKey = "total_portfolio_nav";
    const initialStrategyValue = parseFloat(data[0][strategyKey]);
    const initialNiftyValue = parseFloat(data[0]["nifty"]);

    return data.map((item) => {
      console.log('Item Date:', item.date);

      const parsedDate = new Date(item.date.split("-").reverse().join("-"));
      console.log('Parsed Date:', parsedDate);
      return {
        date: item.date,
        strategyValue: (parseFloat(item[strategyKey]) / initialStrategyValue) * 100,
        niftyValue: (parseFloat(item["nifty"]) / initialNiftyValue) * 100,
      };
    });
  };


  const preparedData = prepareChartData(chartData);
  console.log("preparedData", preparedData);

  const dates = preparedData.map(item => item.date);
  const strategyValues = preparedData.map(item => item.strategyValue);
  const niftyValues = preparedData.map(item => item.niftyValue);

  const calculateDrawdown = (data) => {
    let peak = -Infinity;
    return data.map((item) => {
      const value = item.strategyValue;
      peak = Math.max(peak, value);
      const drawdown = ((value - peak) / peak) * 100;
      return [item.date, drawdown];
    });
  };

  const drawdownData = calculateDrawdown(preparedData);

  return {
    title: "",
    xAxis: {
      categories: dates,
      type: "datetime",
      labels: {
        formatter: function () {
          const date = new Date(this.value);
          return `${date.toLocaleString("default", {
            month: "short",
          })} ${date.getFullYear()}`;
        },
      },
      tickPositions: [0, Math.floor(dates.length / 2), dates.length - 1],
    },
    yAxis: [
      {
        title: { text: "" },
        height: "60%",
        min: 0,
        tickAmount: 10,
      },
      {
        title: { text: "Drawdown (%)" },
        opposite: false,
        top: "60%",
        height: "40%",
        // min: -30,
        max: 0,
      },
    ],
    series: [
      {
        name: strategy,
        data: strategyValues,
        color: "#9ddd55",
        lineWidth: 1,
        marker: { enabled: false },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Nifty 50",
        data: niftyValues,
        color: "#000",
        lineWidth: 2,
        marker: { enabled: false },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Drawdown",
        data: drawdownData,
        color: "rgba(250, 65, 65, 1)",
        lineWidth: 2,
        marker: { enabled: false },
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(250, 65, 65, 0.2)"],
            [1, "rgba(250, 65, 65, 0.9)"]
          ]
        },
        type: "area",
        yAxis: 1,
        threshold: 0,
      }
    ],
    chart: {
      height: 800,
      backgroundColor: "none",
      zoomType: "x",
    },
    tooltip: { shared: true },
    legend: { enabled: false },
    credits: { enabled: false },
    exporting: { enabled: true },
    plotOptions: {
      area: {
        marker: { radius: 2 },
        lineWidth: 1,
        states: { hover: { lineWidth: 1 } },
        threshold: null,
      },
    },
    navigation: {
      buttonOptions: { enabled: true },
    },
  };
};