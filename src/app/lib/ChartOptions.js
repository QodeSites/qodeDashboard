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

  const themeColors = {
    dark: {
      text: '#fee9d6',
      accent: '#d1a47b',
      gridLines: '#292929',
      background: 'none',
      tooltipBg: '#000000',
      tooltipBorder: '#000000',
      drawdownGradient: [
        [0, 'rgba(150, 30, 30, 0.7)'],
        [1, 'rgba(255, 69, 58, 0.9)']
      ],
      benchmarkDrawdownGradient: [
        [0, 'rgba(30, 30, 150, 0.7)'],
        [1, 'rgba(58, 69, 255, 0.9)']
      ]
    },
    light: {
      text: '#333333',
      accent: '#d1a47b',
      gridLines: '#d3d3d3',
      background: '#ffffff',
      tooltipBg: '#ffffff',
      tooltipBorder: '#cccccc',
      drawdownGradient: [
        [0, 'rgba(200, 40, 40, 0.6)'],
        [1, 'rgba(255, 70, 70, 0.8)']
      ],
      benchmarkDrawdownGradient: [
        [0, 'rgba(200, 40, 40, 0.6)'],
        [1, 'rgba(255, 70, 70, 0.8)']
      ]
    }
  };

  const colors = themeColors[theme];

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

  // Calculate benchmark drawdowns
  const benchmarkDrawdowns = benchmarkSeries.map(series => ({
    name: `${series.name} Drawdown`,
    data: calculateDrawdown(series.data),
    type: 'area',
    yAxis: 1,
    threshold: 0,
    strokeWidth: 1,
    lineWidth: 1,
    color: {
      linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: colors.benchmarkDrawdownGradient,
    },
    fillOpacity: 0.2,
    marker: {
      enabled: false,
      symbol: 'circle',
      states: { hover: { enabled: true, radius: 5 } }
    }
  }));

  // Calculate all value ranges including benchmark data
  const allSeriesValues = [
    ...preparedData.map((item) => item.strategyValue),
    ...benchmarkSeries.flatMap(series => series.data.map(point => point[1]))
  ];

  const maxValue = Math.max(...allSeriesValues);
  const minValue = Math.min(...allSeriesValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;
  const topAxisMax = Math.ceil((maxValue + padding) / 10) * 10;
  const bottomAxisMin = Math.floor((minValue - padding) / 10) * 10;
  const tickInterval = range <= 10 ? 1 : Math.ceil(range / 5);

  // Calculate minimum drawdown including benchmark drawdowns
  const allDrawdowns = [
    ...preparedData.map(item => item.drawdown),
    ...benchmarkDrawdowns.flatMap(series => series.data.map(point => point[1]))
  ];
  const minDrawdown = Math.min(...allDrawdowns);
  const drawdownMin = Math.floor(minDrawdown / 10) * 10;

  // Prepare all series data
  const allSeries = [
    {
      name: strategyName,
      data: strategySeries,
      color: colors.accent,
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
        stops: colors.drawdownGradient,
      },
      fillOpacity: 0.31,
      marker: {
        enabled: false,
        symbol: 'circle',
        states: { hover: { enabled: true, radius: 5 } }
      }
    },
    ...benchmarkSeries.map(series => ({
      ...series,
      yAxis: 0,
      zIndex: 1,
    })),
    ...benchmarkDrawdowns
  ];

  return {
    // ... rest of the chart options remain the same ...
    title: "",
    xAxis: {
      type: "datetime",
      labels: {
        formatter: function () {
          return Highcharts.dateFormat('%Y', this.value);
        },
        style: {
          color: colors.accent,
          fontSize: "10px",
        },
      },
      gridLineColor: colors.gridLines,
      tickWidth: isMobile ? 0 : 1,
    },
    yAxis: [
      {
        title: { text: "" },
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
            color: colors.accent,
            fontSize: "10px",
          },
        },
        lineColor: colors.accent,
        tickColor: colors.accent,
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: colors.gridLines,
        plotLines: [{
          value: 100,
          color: colors.accent,
          width: 1,
          zIndex: 5,
          dashStyle: 'dot'
        }],
      },
      {
        title: { text: "", style: { color: colors.accent } },
        height: "50%",
        top: "50%",
        offset: 0,
        max: 0,
        min: drawdownMin,
        tickAmount: 5,
        labels: {
          formatter: function () {
            return Math.round(this.value) + '%';
          },
          style: {
            color: colors.accent,
            fontSize: "10px",
          },
        },
        lineColor: colors.accent,
        tickColor: colors.accent,
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: colors.gridLines,
      },
    ],
    series: allSeries,
    chart: {
      height: isMobile ? 500 : 800,
      backgroundColor: colors.background,
      zoomType: "x",
      marginLeft: isMobile ? 0 : 10,
      marginRight: isMobile ? 0 : 2,
      spacingBottom: 20,
    },
    tooltip: {
      shared: true,
      outside: isMobile,
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.text, fontSize: '12px' },
      formatter: function () {
        const formattedDate = formatDate(this.x);
        let tooltipContent = `<b>${formattedDate}</b><br/>`;
        this.points.forEach(point => {
          const isDrawdown = point.series.name.includes('Drawdown');
          const value = isDrawdown ? point.y.toFixed(1) + '%' : point.y.toFixed(2);
          tooltipContent += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${value}</b><br/>`;
        });
        return tooltipContent;
      }
    },
    legend: {
      enabled: true,
      itemStyle: { color: colors.text },
      itemHoverStyle: { color: colors.accent },
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
    navigation: {
      buttonOptions: {
        enabled: !isMobile,
        theme: {
          fill: colors.background,
          stroke: colors.accent,
          states: {
            hover: {
              fill: colors.accent,
              style: { color: colors.background },
            },
          },
          style: { color: colors.accent },
        },
      },
    },
  };
};