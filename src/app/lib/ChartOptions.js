import Highcharts from 'highcharts';

export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-GB');
};

// Helper function to calculate drawdown
const calculateDrawdown = (data) => {
  let peak = data[0][1];
  return data.map(point => {
    const value = point[1];
    peak = Math.max(peak, value);
    const drawdown = ((value - peak) / peak) * 100;
    return [point[0], drawdown];
  });
};

export const getChartOptions = (
  chartData, 
  strategy, 
  isMobile, 
  strategyName, 
  theme,
  benchmarkSeries = []
) => {
  if (!chartData || chartData.length === 0) {
    console.error("Data is not available for: ", strategy);
    return {};
  }

  // Define colors with additional benchmark colors from mergedChartOptions
  const colors = {
    portfolio: "#2E8B57",  // Sea Green for portfolio (primary series)
    benchmark: "#4169E1",  // Royal Blue for benchmark
    portfolioDrawdown: "#FF4560", // Red for portfolio drawdown
    benchmarkDrawdown: "#FF8F00", // Orange for benchmark drawdown
    gridLines: "#e6e6e6",
    background: (theme && theme.background) || "#ffffff",
    tooltipBg: (theme && theme.tooltipBg) || "#f0f0f0",
    tooltipBorder: (theme && theme.tooltipBorder) || "#cccccc",
    text: (theme && theme.text) || "#333333",
  };

  // Prepare gradients
  const drawdownGradients = {
    portfolio: [
      [0, 'rgba(255, 69, 96, 0.8)'],
      [1, 'rgba(255, 69, 96, 0.2)']
    ],
    benchmark: [
      [0, 'rgba(255, 143, 0, 0.8)'],
      [1, 'rgba(255, 143, 0, 0.2)']
    ]
  };

  // Prepare the chart data
  const prepareChartData = (data) => {
    const initialNav = parseFloat(data[0].nav);
    return data.map((item) => ({
      x: new Date(item.date).getTime(),
      strategyValue: (parseFloat(item.nav) / initialNav) * 100,
      drawdown: parseFloat(item.drawdown),
    }));
  };

  const preparedData = prepareChartData(chartData);
  const strategySeries = preparedData.map((item) => [item.x, item.strategyValue]);
  const drawdownSeries = preparedData.map((item) => [item.x, item.drawdown]);

  // Calculate benchmark drawdowns using the formula from mergedChartOptions
  const calculateBenchmarkDrawdown = (data) => {
    let maxValue = -Infinity;
    return data.map(point => {
      const [timestamp, value] = point;
      maxValue = Math.max(maxValue, value);
      const drawdown = ((value - maxValue) / maxValue) * 100;
      return [timestamp, drawdown];
    });
  };

  // Create benchmark series with consistent styling
  const formattedBenchmarkSeries = benchmarkSeries.map(series => ({
    name: series.name,
    data: series.data,
    color: colors.benchmark,
    lineWidth: 2,
    yAxis: 0,
    zIndex: 1,
    marker: {
      enabled: false,
      symbol: 'circle',
      states: { hover: { enabled: true, radius: 5 } }
    },
  }));

  // Create benchmark drawdown series
  const benchmarkDrawdowns = benchmarkSeries.map(series => ({
    name: `${series.name} Drawdown`,
    data: calculateBenchmarkDrawdown(series.data),
    type: 'area',
    yAxis: 1,
    threshold: 0,
    lineWidth: 1,
    color: {
      linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: drawdownGradients.benchmark
    },
    fillOpacity: 0.31,
    marker: {
      enabled: false,
      symbol: 'circle',
      states: { hover: { enabled: true, radius: 5 } }
    }
  }));

  // Calculate value ranges including benchmark data
  const allValues = [
    ...preparedData.map(item => item.strategyValue),
    ...benchmarkSeries.flatMap(series => series.data.map(point => point[1]))
  ];
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;
  const topAxisMax = Math.ceil((maxValue + padding) / 10) * 10;
  const bottomAxisMin = Math.floor((minValue - padding) / 10) * 10;
  const tickInterval = range <= 10 ? 1 : Math.ceil(range / 5);

  // Calculate drawdown minimum including benchmark drawdowns
  const allDrawdowns = [
    ...preparedData.map(item => item.drawdown),
    ...benchmarkDrawdowns.flatMap(series => series.data.map(point => point[1]))
  ];
  const minDrawdown = Math.min(...allDrawdowns);
  const drawdownMin = Math.floor(minDrawdown / 10) * 10;

  // Build series array with consistent styling
  const allSeries = [
    {
      name: strategyName,
      data: strategySeries,
      color: colors.portfolio,
      lineWidth: 2,
      marker: {
        enabled: false,
        symbol: 'circle',
        states: { hover: { enabled: true, radius: 5 } }
      },
      type: "line",
      yAxis: 0,
      zIndex: 2,
    },
    {
      name: "Strategy Drawdown",
      data: drawdownSeries,
      type: "area",
      yAxis: 1,
      threshold: 0,
      lineWidth: 1,
      color: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: drawdownGradients.portfolio
      },
      fillOpacity: 0.31,
      marker: {
        enabled: false,
        symbol: 'circle',
        states: { hover: { enabled: true, radius: 5 } }
      }
    },
    ...formattedBenchmarkSeries,
    ...benchmarkDrawdowns
  ];

  // Define chart options with merged styling
  return {
    title: {
      text: "Strategy Performance & Drawdown",
      style: { 
        fontSize: "16px",
        color: colors.text 
      },
    },
    xAxis: {
      type: "datetime",
      labels: {
        formatter: function () {
          return Highcharts.dateFormat('%Y', this.value);
        },
        style: {
          color: colors.portfolio,
          fontSize: "10px",
        },
      },
      gridLineColor: colors.gridLines,
      tickWidth: isMobile ? 0 : 1,
    },
    yAxis: [
      {
        title: { text: "Performance (%)" },
        height: "50%",
        top: "0%",
        min: bottomAxisMin,
        max: topAxisMax,
        tickInterval,
        tickAmount: 5,
        left: isMobile ? 0 : 40,
        labels: {
          formatter: function () {
            return Math.round(this.value);
          },
          style: {
            color: colors.portfolio,
            fontSize: "10px",
          },
        },
        lineColor: colors.portfolio,
        tickColor: colors.portfolio,
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: colors.gridLines,
        plotLines: [{
          value: 100,
          color: colors.portfolio,
          width: 1,
          zIndex: 5,
          dashStyle: 'dot'
        }],
      },
      {
        title: { text: "Drawdown (%)" },
        height: "50%",
        top: "50%",
        offset: 0,
        max: 0,
        min: drawdownMin,
        tickAmount: 4,
        left: isMobile ? 0 : 35,
        labels: {
          formatter: function () {
            return Math.round(this.value) + '%';
          },
          style: {
            color: colors.portfolioDrawdown,
            fontSize: "10px",
          },
        },
        lineColor: colors.portfolioDrawdown,
        tickColor: colors.portfolioDrawdown,
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: colors.gridLines,
      },
    ],
    tooltip: {
      shared: true,
      outside: isMobile,
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.text, fontSize: '12px' },
      formatter: function () {
        let tooltipText = `<div style="padding:10px;">
          <b>${Highcharts.dateFormat("%Y-%m-%d", this.x)}</b><br/>`;

        // Group series by type
        const performancePoints = this.points.filter(point => point.series.yAxis.options.top === "0%");
        const drawdownPoints = this.points.filter(point => point.series.yAxis.options.top === "50%");

        // Add performance metrics
        tooltipText += "<br/><b>Performance:</b><br/>";
        performancePoints.forEach(point => {
          tooltipText += `<span style="color:${point.series.color}">\u25CF</span> 
            ${point.series.name}: ${point.y.toFixed(2)}<br/>`;
        });

        // Add drawdown metrics
        tooltipText += `<hr style="border: 0.5px solid ${colors.gridLines};"/>`;
        tooltipText += "<b>Drawdown:</b><br/>";
        drawdownPoints.forEach(point => {
          tooltipText += `<span style="color:${typeof point.series.color === 'object' ? 
            point.series.color.stops[0][1] : point.series.color}">\u25CF</span> 
            ${point.series.name}: ${point.y.toFixed(2)}%<br/>`;
        });

        return tooltipText + "</div>";
      }
    },
    chart: {
      height: isMobile ? 500 : 800,
      backgroundColor: colors.background,
      zoomType: "xy",
      marginLeft: isMobile ? 0 : 10,
      marginRight: isMobile ? 0 : 2,
      spacingBottom: 20,
    },
    legend: {
      enabled: true,
      itemStyle: { color: colors.text },
      itemHoverStyle: { color: colors.portfolio },
      align: 'left',
      verticalAlign: 'top',
      layout: 'horizontal',
      x: 0,
      y: 0
    },
    credits: { enabled: false },
    exporting: { enabled: !isMobile },
    plotOptions: {
      series: {
        animation: { duration: 2000 },
        states: { hover: { enabled: true, lineWidthPlus: 1 } },
      },
    },
    series: allSeries
  };
};

