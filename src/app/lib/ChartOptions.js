import { color } from "highcharts";

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
        height: "60%",
        min: 5,
        tickAmount: 10,
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
          text: "Drawdown (%)",
          style: {
            color: "#d1a47b"
          }
        },
        opposite: false,
        top: "60%",
        height: "40%",
        left: isMobile ? "10%" : "2.6%",
        max: 0,
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
      marginLeft: isMobile ? 30 : 60,
      marginRight: isMobile ? 10 : 10,
    },
    tooltip: {
      shared: true,
      outside: isMobile,
      backgroundColor: '#000000', // Black background
      borderColor: '#000000', // Black border to match the background
      style: {
        color: '#fee9d6', // Light beige text color
        fontSize: '12px' // You can adjust the font size if needed
      },
      formatter: function () {
        // Format date to DD/MM/YYYY
        const date = new Date(this.x);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        // Tooltip content
        let tooltipContent = `<b>${formattedDate}</b><br/>`;

        // Loop through each series to display values in the tooltip
        this.points.forEach(point => {
          tooltipContent += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${point.y.toFixed(1)}</b><br/>`;
        });

        return tooltipContent;
      }
    },


    legend: {
      enabled: true,
      itemStyle: {
        color: '#fee9d6' // Sets the color of the legend text to brown
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