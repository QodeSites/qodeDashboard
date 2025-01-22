import { formatDate } from '@/utils/chartUtils';

export const getChartOptions = (chartData, strategy, isMobile, strategyName, theme) => {
  if (!chartData || chartData.length === 0) {
    console.error("Data is not available for: ", strategy);
    return {};
  }

  // Theme-specific colors
  const themeColors = {
    dark: {
      text: '#fee9d6',
      accent: '#d1a47b',
      gridLines: '#292929',
      background: 'none',
      tooltipBg: '#000000',
      tooltipBorder: '#000000',
      // Updated darker reds (slightly more contrast, smoother transitions)
      drawdownGradient: [
        [0, 'rgba(150, 30, 30, 0.7)'],  // Deeper red with some transparency
        [1, 'rgba(255, 69, 58, 0.9)']   // Slightly lighter red but less transparent
      ]
    },
    light: {
      text: '#333333',
      accent: '#d1a47b',
      gridLines: '#d3d3d3',
      background: '#ffffff',
      tooltipBg: '#ffffff',
      tooltipBorder: '#cccccc',
      // Updated lighter reds (still noticeable but subtler for light theme)
      drawdownGradient: [
        [0, 'rgba(200, 40, 40, 0.6)'],  // A moderate red with some transparency
        [1, 'rgba(255, 70, 70, 0.8)']   // Lighter red with less transparency
      ]
    }
  };
  

  const colors = themeColors[theme];

  const prepareChartData = (data) => {
    const initialNav = parseFloat(data[0].nav);
    return data.map((item) => ({
      date: item.date,
      strategyValue: (parseFloat(item.nav) / initialNav) * 100,
      drawdown: parseFloat(item.drawdown)
    }));
  };

  const preparedData = prepareChartData(chartData);
  const dates = preparedData.map(item => item.date);
  const strategyValues = preparedData.map(item => item.strategyValue);
  const drawdownValues = preparedData.map(item => [item.date, item.drawdown]);

  const maxValue = Math.max(...strategyValues);
  const minValue = Math.min(...strategyValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;
  const topAxisMax = Math.ceil((maxValue + padding) / 10) * 10;
  const bottomAxisMin = Math.floor((minValue - padding) / 10) * 10;
  const tickInterval = range <= 10 ? 1 : Math.ceil(range / 5);

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
          color: colors.accent,
          fontSize: "10px"
        },
      },
      tickPositions: [0, Math.floor(dates.length / 2), dates.length - 1],
      gridLineColor: colors.gridLines,
      tickWidth: isMobile ? 0 : 1,
      tickPixelInterval: 10,
    },
    yAxis: [
      {
        title: { text: "" },
        height: "50%",
        top: "0%",
        min: bottomAxisMin,
        max: topAxisMax,
        tickInterval: tickInterval,
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
          value: 0,
          color: colors.accent,
          width: 1,
          zIndex: 5
        }]
      },
      {
        title: { text: "", style: { color: colors.accent } },
        height: "50%",
        top: "50%",
        offset: 0,
        max: 0,
        min: Math.floor(Math.min(...preparedData.map(item => item.drawdown)) / 10) * 10,
        tickAmount: 5,
        labels: {
          formatter: function () {
            return Math.round(this.value) + '%';
          },
          style: {
            color: colors.accent,
            fontSize: "10px"
          },
        },
        lineColor: colors.accent,
        tickColor: colors.accent,
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: colors.gridLines,
        plotLines: [{
          value: 0,
          color: colors.accent,
          width: 1,
          zIndex: 5
        }]
      },
    ],
    series: [
      {
        name: strategyName,
        data: strategyValues,
        color: colors.accent,
        lineWidth: 2,
        marker: {
          enabled: false,
          symbol: 'circle',
          states: { hover: { enabled: true, radius: 5 } }
        },
        type: "line",
        yAxis: 0,
      },
      {
        name: "Drawdown",
        data: drawdownValues,
        type: "area",
        yAxis: 1,
        threshold: 0,
        lineWidth: 1,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: colors.drawdownGradient
        },
        fillOpacity: 1,
        marker: {
          enabled: false,
          symbol: 'circle',
          states: { hover: { enabled: true, radius: 5 } }
        }
      }
    ],
    chart: {
      height: isMobile ? 900 : 800,
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
          let value = point.series.name === "Drawdown" ? point.y.toFixed(1) + '%' : Math.round(point.y);
          tooltipContent += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${value}</b><br/>`;
        });
        return tooltipContent;
      }
    },
    legend: { 
      enabled: true, 
      itemStyle: { color: colors.text },
      itemHoverStyle: { color: colors.accent }
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
              style: {
                color: colors.background
              }
            }
          },
          style: {
            color: colors.accent
          }
        }
      } 
    },
  };
};