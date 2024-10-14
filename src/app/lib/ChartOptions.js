import { formatDate, calculateDrawdown } from '@/utils/chartUtils';

export const getChartOptions = (chartData, strategy, isMobile, strategyName) => {
  if (!chartData || chartData.length === 0) {
    console.error("Data is not available for: ", strategy);
    return {};
  }

  const prepareChartData = (data) => {
    const initialStrategyValue = parseFloat(data[0].total_portfolio_nav);
    const initialBenchmarkValue = parseFloat(data[0].benchmark_values);

    return data.map((item) => ({
      date: item.date,
      strategyValue: parseFloat(((parseFloat(item.total_portfolio_nav) / initialStrategyValue) * 100).toFixed(1)),
      benchmarkValue: parseFloat(((parseFloat(item.benchmark_values) / initialBenchmarkValue) * 100).toFixed(1)),
    }));
  };

  const preparedData = prepareChartData(chartData);
  const dates = preparedData.map(item => item.date);
  const strategyValues = preparedData.map(item => item.strategyValue);
  const benchmarkValues = preparedData.map(item => item.benchmarkValue);
  const drawdownData = calculateDrawdown(preparedData);

  const maxValue = Math.max(...strategyValues, ...benchmarkValues);
  const topAxisMax = Math.ceil(maxValue / 10) * 10;
  const minDrawdown = Math.min(...drawdownData.map(item => item[1]));
  const bottomAxisMin = Math.floor(minDrawdown / 10) * 10;

  return {
    title: "",
    xAxis: {
      categories: dates,
      type: "datetime",
      labels: {
        formatter: function () {
          return new Date(this.value).getFullYear();
        },
        style: {
          color: "#d1a47b",
          fontSize: "10px"
        },
      },
      tickPositions: [0, Math.floor(dates.length / 2), dates.length - 1],
      gridLineColor: "#fefefe",
      tickWidth: isMobile ? 0 : 1,
      tickPixelInterval: 150,
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
        left: isMobile ? 0 : 40,
        labels: {
          style: {
            color: "#d1a47b",
            fontSize: "10px",
          },
        },
        lineColor: "#d1a47b",
        tickColor: "#d1a47b",
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: "#292929",
        // Add a plot line at 0 for the first axis
        plotLines: [{
          value: 0,
          color: '#d1a47b',
          width: 1,
          zIndex: 5 // Ensure the line is on top
        }]
      },
      {
        title: { text: "", style: { color: "#d1a47b" } },
        height: "50%",
        top: "50%",
        offset: 0,
        max: 0,
        min: bottomAxisMin,
        tickAmount: 5,
        labels: {
          formatter: function () {
            return this.value + '%';
          },
          style: {
            color: "#d1a47b",
            fontSize: "10px"
          },
        },
        lineColor: "#d1a47b",
        tickColor: "#d1a47b",
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: "#292929",
        // Add a plot line at 0 for the second axis
        plotLines: [{
          value: 0,
          color: '#d1a47b',
          width: 1,
          zIndex: 5 // Ensure the line is on top
        }]
      },
    ],
    series: [
      {
        name: strategyName,
        data: strategyValues,
        color: "#fee9d6",
        lineWidth: 1,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 5 } } },
        type: "line",
        yAxis: 0,
      },
      {
        name: chartData[0].benchmark,
        data: benchmarkValues,
        color: "#945c39",
        lineWidth: 2,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 5 } } },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Drawdown",
        data: drawdownData,
        color: "#B10606",
        lineWidth: 2,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 5 } } },
        type: "line",
        yAxis: 1,
        threshold: 0,
      }
    ],
    chart: {
      height: isMobile ? 900 : 800,
      backgroundColor: "none",
      zoomType: "x",
      marginLeft: isMobile ? 0 : 50,
      marginRight: isMobile ? 0 : 10,
      spacingBottom: 20,
    },
    tooltip: {
      shared: true,
      outside: isMobile,
      backgroundColor: '#000000',
      borderColor: '#000000',
      style: { color: '#fee9d6', fontSize: '12px' },
      formatter: function () {
        const formattedDate = formatDate(this.x);
        let tooltipContent = `<b>${formattedDate}</b><br/>`;
        this.points.forEach(point => {
          let value = point.y.toFixed(1);
          if (point.series.name === "Drawdown") {
            value += '%';
          }
          tooltipContent += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${value}</b><br/>`;
        });
        return tooltipContent;
      }
    },
    legend: { enabled: true, itemStyle: { color: '#fee9d6' } },
    credits: { enabled: false },
    exporting: { enabled: !isMobile },
    plotOptions: {
      series: {
        animation: { duration: 2000 },
        states: { hover: { enabled: true, lineWidthPlus: 1 } },
      },
    },
    navigation: { buttonOptions: { enabled: !isMobile } },
  };

};