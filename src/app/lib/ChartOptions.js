export const getChartOptions = (chartData, strategy, isMobile) => {
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
        strategyValue: parseFloat(((parseFloat(item[strategyKey]) / initialStrategyValue) * 100).toFixed(1)),
        niftyValue: parseFloat(((parseFloat(item["nifty"]) / initialNiftyValue) * 100).toFixed(1)),
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
      return [item.date, parseFloat(drawdown.toFixed(1))];
    });
  };

  const drawdownData = calculateDrawdown(preparedData);

  // Calculate the maximum value for the top y-axis
  const maxValue = Math.max(...strategyValues, ...niftyValues);
  const topAxisMax = Math.ceil(maxValue / 10) * 10;

  // Calculate the minimum value for the bottom y-axis (drawdown)
  const minDrawdown = Math.min(...drawdownData.map(item => item[1]));
  const bottomAxisMin = Math.floor(minDrawdown / 10) * 10;

  return {
    title: "",
    xAxis: {
      categories: dates,
      type: "datetime",
      labels: {
        formatter: function () {
          const date = new Date(this.value);
          return `${date.getFullYear()}`;
        },
        style: {
          color: "#d1a47b",
          fontSize: "10px"
        },
      },
      tickPositions: [0, Math.floor(dates.length / 2), dates.length - 1],
      gridLineColor: "#fefefe",
    },
    yAxis: [
      {
        title: { text: "" },
        height: "50%",
        top: "0%",
        offset: 0,
        min: 0,
        max: topAxisMax,
        tickAmount: 5,
        labels: {
          style: {
            color: "#d1a47b",
            fontSize: "10px"
          },
        },
        lineColor: "#d1a47b",
        tickColor: "#d1a47b",
        gridLineColor: "#292929",
      },
      {
        title: {
          text: "",
          style: {
            color: "#d1a47b"
          }
        },
        height: "50%",
        top: "50%",
        offset: 0,
        max: 0,
        min: bottomAxisMin,
        tickAmount: 5,
        labels: {
          style: {
            color: "#d1a47b",
            fontSize: "10px"
          },
        },
        lineColor: "#d1a47b",
        tickColor: "#d1a47b",
        gridLineColor: "#292929",
      },
    ],
    series: [
      {
        name: strategy,
        data: strategyValues,
        color: "#fee9d6",
        lineWidth: 1,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 5,
            },
          },
        },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Nifty 50",
        data: niftyValues,
        color: "#945c39",
        lineWidth: 2,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 5,
            },
          },
        },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Drawdown",
        data: drawdownData,
        color: "#B10606",
        lineWidth: 2,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 5,
            },
          },
        },
        type: "line",
        yAxis: 1,
        threshold: 0,
      }
    ],
    chart: {
      height: isMobile ? 900 : 800,
      backgroundColor: "none",
      zoomType: "x",
      marginLeft: isMobile ? 35 : 60,
      marginRight: isMobile ? 10 : 10,
      spacingBottom: 20,
    },
    tooltip: {
      shared: true,
      outside: isMobile,
      backgroundColor: '#000000',
      borderColor: '#000000',
      style: {
        color: '#fee9d6',
        fontSize: '12px'
      },
      formatter: function () {
        const date = new Date(this.x);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        let tooltipContent = `<b>${formattedDate}</b><br/>`;

        this.points.forEach(point => {
          tooltipContent += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${point.y.toFixed(1)}</b><br/>`;
        });

        return tooltipContent;
      }
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: '#fee9d6'
      }
    },
    credits: { enabled: false },
    exporting: { enabled: !isMobile },
    plotOptions: {
      series: {
        animation: {
          duration: 2000,
        },
        states: {
          hover: {
            enabled: true,
            lineWidthPlus: 1,
          },
        },
      },
    },
    navigation: {
      buttonOptions: { enabled: !isMobile },
    },
  };
};