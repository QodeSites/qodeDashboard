import { color } from "highcharts";

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
      gridLineColor: "#fefefe",
      labels: {
        style: {
          color: "#d1a47b", // Set the color of the tick labels
          fontSize: "10px"
        },
      },
    },
    yAxis: [
      {
        title: { text: "" },
        height: "60%",
        min: 5,
        tickAmount: 10,
        labels: {
          style: {
            color: "#d1a47b", // Set the color of the tick labels
            fontSize: "10px"
          },
        },
        lineColor: "#d1a47b", // Optional: change the line color of the axis
        tickColor: "#d1a47b", // Optional: change the tick color on the axis
        gridLineColor: "#292929",
      },
      {
        title: {
          text: "Drawdown (%)",
          style: {
            color: "#d1a47b"
          }
        },
        opposite: false,
        top: "60%",
        height: "40%",
        left: "3.6%",
        max: 0,
        labels: {
          style: {
            color: "#d1a47b", // Set the color of the tick labels
            fontSize: "10px"

          },
        },
        lineColor: "#d1a47b", // Optional: change the line color of the axis
        tickColor: "#d1a47b", // Optional: change the tick color on the axis
        gridLineColor: "#292929",
      },
    ],

    series: [
      {
        name: strategy,
        data: strategyValues,
        color: "#fee9d6",
        lineWidth: 1,
        marker: { enabled: false },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Nifty 50",
        data: niftyValues,
        color: "#945c39",
        lineWidth: 2,
        marker: { enabled: false },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Drawdown",
        data: drawdownData,
        color: "#B10606",
        lineWidth: 2,
        marker: { enabled: false },

        type: "line",
        yAxis: 1,
        threshold: 0,
      }
    ],
    chart: {
      height: 800,
      backgroundColor: "none",
      zoomType: "x",
      marginLeft: 55,  // Reduce left margin to shift chart left
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