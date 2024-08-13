import { color, Tick } from "highcharts";

export const getChartOptions = (chartData, scheme) => {
  // console.log("chartData: ", chartData);
  if (!chartData) {
    // Handle the case where chartData or chartData[scheme] is not available
    console.error("Data is not available for: ", scheme);
    return {}; // Return an empty object or some default configuration
  }

  const schemeData = chartData;
  const performanceData = schemeData.map((item) => [
    new Date(item.Date.split("-").reverse().join("-")).getTime(),
    item["Total Portfolio NAV"],
  ]);

  const niftyData = schemeData.map((item) => [
    new Date(item.Date.split("-").reverse().join("-")).getTime(),
    item["Nifty"],
  ]);

  const calculateDrawdown = (data) => {
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

  const drawdownData = calculateDrawdown(schemeData);

  return {
    chart: {
      type: "line",
      zoomType: "x",
      height: 800,
      backgroundColor: "none",
    },
    title: {
      text: "",
    },
    xAxis: {
      type: "datetime",
      title: {
        text: "Date",
      },
    },
    yAxis: [
      {
        title: {
          text: "Total Portfolio NAV",
        },
        gridLineWidth: 1,
        height: "60%",
        min: 0,
        // max: 1500,
        // tickPositions: [0, 50,],
        TickAmount: 10,
      },
      {
        title: {
          text: "Drawdown (%)",
        },
        opposite: false,
        gridLineWidth: 1,
        top: "60%",
        height: "40%",
        offset: 0,
        min: -30,
        max: 0,
      },
    ],
    series: [
      {
        name: "Portfolio Value",
        data: performanceData,
        yAxis: 0,
        type: "line",
        marker: {
          enabled: false,
        },
        color: "#9ddd55",
      },
      {
        name: "Nifty",
        data: niftyData,
        yAxis: 0,
        type: "line",
        marker: {
          enabled: false,
        },
        color: "#000",
      },
      {
        name: "Drawdown",
        data: drawdownData,
        color: "rgba(250, 65, 65, 1)",
        lineWidth: 2,
        marker: {
          enabled: false,
        },
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, "rgba(250, 65, 65, 0.2)"],  // More opaque at the top
            [1, "rgba(250, 65, 65, 0.9)"]   // More transparent at the bottom
          ]
        },
        type: "area",
        yAxis: 1,
        threshold: 0,
      }
    ],
    plotOptions: {
      area: {
        marker: {
          radius: 2,
        },
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 1,
          },
        },
        threshold: null,
      },
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      shared: true,
    },
    credits: {
      enabled: false,
    },
    exporting: {
      enabled: true,
    },
    navigation: {
      buttonOptions: {
        enabled: true,
      },
    },
  };

};
