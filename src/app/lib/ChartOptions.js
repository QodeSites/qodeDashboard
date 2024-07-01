export const getChartOptions = (chartData, scheme) => {
  if (!chartData || !chartData[scheme]) {
    // Handle the case where chartData or chartData[scheme] is not available
    console.error("Data is not available for: ", scheme);
    return {}; // Return an empty object or some default configuration
  }

  const schemeData = chartData[scheme];

  const performanceData = schemeData.map((item) => [
    new Date(item.Date.split("-").reverse().join("-")).getTime(),
    item["Total Portfolio NAV"],
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
      height: 500,
      backgroundColor: "none",
    },
    title: {
      text: `Performance and Drawdown for ${
        scheme === "scheme1" ? "Scheme 1" : "Scheme 2"
      }`,
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
      },
      {
        title: {
          text: "Drawdown (%)",
        },
        opposite: false,
        gridLineWidth: 0,
        top: "60%",
        height: "40%",
        offset: 0,
        min: -30,
        max: 0,
        tickPositions: [-20, -10, 0],
      },
    ],
    series: [
      {
        name: "Portfolio Value",
        data: performanceData,
        yAxis: 0,
        type: "area",
        marker: {
          enabled: false,
        },
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(135,206,235, 0.9)"], // Light green at the top
            [1, "rgba(135,206,235, 0)"], // Transparent green at the bottom
          ],
        },
      },
      {
        name: "Drawdown",
        data: drawdownData,
        color: "rgba(250, 65, 65, 1)",
        lineWidth: 1,
        marker: {
          enabled: false,
        },
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(250, 65, 65, 0)"], // Light red at the top
            [1, "rgba(250, 65, 65, 0)"], // Transparent red at the bottom
          ],
        },
        type: "area",
        yAxis: 1,
      },
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
