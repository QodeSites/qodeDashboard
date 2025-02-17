import Highcharts from "highcharts";

export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString("en-GB");
};

// Helper to rebase a performance series so that its value at commonStart becomes 100.
const rebaseSeries = (seriesData, commonStart) => {
  // Filter out points before the common start date.
  const filtered = seriesData.filter((point) => point[0] >= commonStart);
  if (filtered.length === 0) return [];
  const baselineValue = filtered[0][1];
  if (baselineValue === 0) return filtered;
  return filtered.map((point) => [point[0], (point[1] / baselineValue) * 100]);
};

// For drawdown series, we simply filter out points before commonStart.
const filterSeries = (seriesData, commonStart) => {
  return seriesData.filter((point) => point[0] >= commonStart);
};

// Helper to filter series by common end timestamp.
const filterSeriesByEnd = (seriesData, commonEnd) =>
  seriesData.filter((point) => point[0] <= commonEnd);

export const getChartOptions = (
  chartData,
  strategy,
  isMobile,
  strategyName,
  theme,
  benchmarkSeries = [],
  isInvested = false // true if investor is invested; false if showing model portfolio
) => {
  if (!chartData || chartData.length === 0) {
    console.error("Data is not available for: ", strategy);
    return {};
  }
  console.log("chart data", chartData);

  // Define two color palettes.
  const investedColors = {
    portfolio: "#2E8B57", // Sea Green for client portfolio
    benchmark: "#4169E1", // Royal Blue for benchmark performance when invested
    portfolioDrawdown: "#FF4560", // Red for client drawdown
    benchmarkDrawdown: "#FF8F00", // Orange for model drawdown when invested
    gridLines: "#e6e6e6",
    background: (theme && theme.background) || "#ffffff",
    tooltipBg: (theme && theme.tooltipBg) || "#f0f0f0",
    tooltipBorder: (theme && theme.tooltipBorder) || "#cccccc",
    text: (theme && theme.text) || "#333333",
  };

  const nonInvestedColors = {
    // When not invested, use alternative colors for model portfolio series.
    portfolio: "#2E8B57", // Sea Green for client portfolio
    benchmark: "#4169E1", // Royal Blue for benchmark performance (BSE500)
    portfolioDrawdown: "#FF4560", // Red for client drawdown
    benchmarkDrawdown: "#FF8F00", // Lemon Yellow for benchmark drawdown
    gridLines: "#e6e6e6",
    background: (theme && theme.background) || "#ffffff",
    tooltipBg: (theme && theme.tooltipBg) || "#f0f0f0",
    tooltipBorder: (theme && theme.tooltipBorder) || "#cccccc",
    text: (theme && theme.text) || "#333333",
  };

  // Choose the appropriate palette.
  const colors = isInvested ? investedColors : nonInvestedColors;

  // Prepare the chart data for the portfolio.
  const prepareChartData = (data) => {
    const initialNav = parseFloat(data[0].nav);
    return data.map((item) => ({
      x: new Date(item.date).getTime(),
      strategyValue: (parseFloat(item.nav) / initialNav) * 100,
      drawdown: parseFloat(item.drawdown),
    }));
  };

  const preparedData = prepareChartData(chartData);
  const portfolioSeriesData = preparedData.map((item) => [item.x, item.strategyValue]);
  const portfolioDrawdownData = preparedData.map((item) => [item.x, item.drawdown]);

  // Determine the common start timestamp.
  const allStarts = [];
  if (portfolioSeriesData.length > 0) {
    allStarts.push(portfolioSeriesData[0][0]);
  }
  benchmarkSeries.forEach((series) => {
    if (series.data && series.data.length > 0) {
      allStarts.push(series.data[0][0]);
    }
  });
  const commonStart = Math.max(...allStarts);

  // Rebase portfolio performance series and filter drawdown.
  const rebasedPortfolioSeries = rebaseSeries(portfolioSeriesData, commonStart);
  const filteredPortfolioDrawdown = filterSeries(portfolioDrawdownData, commonStart);

  // Rebase each benchmark series.
  let rebasedBenchmarkSeries = benchmarkSeries.map((series) => ({
    ...series,
    data: rebaseSeries(series.data, commonStart),
  }));

  // Determine a common end timestamp so that all series align.
  const portfolioEnd = rebasedPortfolioSeries[rebasedPortfolioSeries.length - 1][0];
  const benchmarkEnds = rebasedBenchmarkSeries.map(
    (series) => series.data[series.data.length - 1][0]
  );
  const commonEnd = Math.min(portfolioEnd, ...benchmarkEnds);

  // Filter all series so they end at the commonEnd.
  const finalPortfolioSeries = filterSeriesByEnd(rebasedPortfolioSeries, commonEnd);
  const finalPortfolioDrawdown = filterSeriesByEnd(filteredPortfolioDrawdown, commonEnd);
  rebasedBenchmarkSeries = rebasedBenchmarkSeries.map((series) => ({
    ...series,
    data: filterSeriesByEnd(series.data, commonEnd),
  }));

  // Format benchmark series for the chart.
  const formattedBenchmarkSeries = rebasedBenchmarkSeries.map((series) => {
    // For BSE500, use Royal Blue.
    if (series.name === "BSE500") {
      return {
        name: series.name,
        data: series.data,
        color: "#4169E1", // Royal Blue for benchmark performance
        lineWidth: 2,
        yAxis: 0,
        zIndex: 1,
        marker: {
          enabled: false,
          symbol: "circle",
          states: { hover: { enabled: true, radius: 5 } },
        },
        type: "line", // Equity curve as a line chart.
      };
    }
    return {
      name: series.name,
      data: series.data,
      color: colors.portfolio,
      lineWidth: 2,
      yAxis: 0,
      zIndex: 1,
      marker: {
        enabled: false,
        symbol: "circle",
        states: { hover: { enabled: true, radius: 5 } },
      },
      type: "line", // Equity curve as a line chart.
    };
  });

  // Calculate benchmark drawdowns.
  const calculateBenchmarkDrawdown = (data) => {
    let maxValue = -Infinity;
    return data.map((point) => {
      const [timestamp, value] = point;
      maxValue = Math.max(maxValue, value);
      const drawdown = ((value - maxValue) / maxValue) * 100;
      return [timestamp, drawdown];
    });
  };

  // Format benchmark drawdown series.
  const formattedBenchmarkDrawdownSeries = rebasedBenchmarkSeries.map((series) => {
    const drawdownColor =
      series.name === "BSE500" ? "#FF8F00" : colors.portfolioDrawdown; // Lemon Yellow for BSE500 drawdown.
    return {
      name: `${series.name} Drawdown`,
      data: calculateBenchmarkDrawdown(series.data),
      type: "area", // Drawdown as area chart.
      yAxis: 1,
      threshold: 0,
      lineWidth: 1,
      color: drawdownColor,
      fillOpacity: 0.2,
      tooltip: { valueSuffix: "%" },
      marker: {
        enabled: false,
        symbol: "circle",
        states: { hover: { enabled: true, radius: 5 } },
      },
    };
  });

  // Build the series array.
  let allSeries = [];
  if (isInvested) {
    // For invested strategies: include client's portfolio performance and drawdown.
    allSeries.push(
      {
        name: strategyName,
        data: finalPortfolioSeries,
        color: investedColors.portfolio,
        lineWidth: 2,
        marker: {
          enabled: false,
          symbol: "circle",
          states: { hover: { enabled: true, radius: 5 } },
        },
        type: "line", // Equity curve as a line chart.
        yAxis: 0,
        zIndex: 2,
      },
      {
        name: "Strategy Drawdown",
        data: finalPortfolioDrawdown,
        type: "area", // Drawdown equity curve as area chart.
        yAxis: 1,
        threshold: 0,
        lineWidth: 1,
        color: investedColors.portfolioDrawdown,
        fillOpacity: 0.2,
        tooltip: { valueSuffix: "%" },
        marker: {
          enabled: false,
          symbol: "circle",
          states: { hover: { enabled: true, radius: 5 } },
        }
      }
    );
    // Optionally include BSE500 series if present.
    const bse500Perf = rebasedBenchmarkSeries.filter(
      (series) => series.name === "BSE500"
    );
    if (bse500Perf.length > 0) {
      const formattedBSE500 = bse500Perf.map((series) => ({
        name: series.name,
        data: series.data,
        color: "#4169E1", // Royal Blue for benchmark performance
        lineWidth: 2,
        yAxis: 0,
        zIndex: 1,
        marker: {
          enabled: false,
          symbol: "circle",
          states: { hover: { enabled: true, radius: 5 } },
        },
        type: "line", // Equity curve as a line chart.
      }));
      allSeries.push(...formattedBSE500);
      const bse500Drawdown = formattedBenchmarkDrawdownSeries.filter((series) =>
        series.name.startsWith("BSE500")
      );
      if (bse500Drawdown.length > 0) {
        allSeries.push(...bse500Drawdown);
      }
    }
  } else {
    // For non-invested strategies: show only benchmark series and their drawdown series.
    allSeries.push(...formattedBenchmarkSeries, ...formattedBenchmarkDrawdownSeries);
  }

  // Calculate axis ranges using the rebased data.
  const allValues = [
    ...finalPortfolioSeries.map((item) => item[1]),
    ...rebasedBenchmarkSeries.flatMap((series) =>
      series.data.map((point) => point[1])
    ),
  ];
  const maxValueOverall = Math.max(...allValues);
  const minValueOverall = Math.min(...allValues);
  const valueRange = maxValueOverall - minValueOverall;
  const padding = valueRange * 0.1;
  const tickInterval = valueRange <= 10 ? 1 : Math.ceil(valueRange / 5);

  // Calculate drawdown minimum.
  const allDrawdowns = [
    ...finalPortfolioDrawdown.map((item) => item[1]),
    ...formattedBenchmarkDrawdownSeries.flatMap((series) =>
      series.data.map((point) => point[1])
    ),
  ];
  const minDrawdownOverall = Math.min(...allDrawdowns);
  const drawdownMin = Math.floor(minDrawdownOverall / 10) * 10;

  return {
    title: {
      text: "",
      style: { fontSize: "12px", color: colors.text },
    },
    xAxis: {
      type: "datetime",
      labels: {
        formatter: function () {
          return Highcharts.dateFormat("%Y", this.value);
        },
        style: { color: colors.text, fontSize: "10px" },
      },
      gridLineColor: colors.gridLines,
      tickWidth: isMobile ? 0 : 1,
    },
    yAxis: [
      {
        title: { text: "Performance (%)" },
        height: "60%",
        top: "0%",
        min: 60,
        tickInterval,
        tickAmount: 7,
        labels: {
          formatter: function () {
            return Math.round(this.value);
          },
          style: { color: colors.text, fontSize: "10px" },
        },
        lineColor: colors.text,
        tickColor: colors.text,
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: colors.gridLines,
        plotLines: [
          {
            value: 100,
            color: colors.text,
            width: 1,
            zIndex: 5,
            dashStyle: "dot",
          },
        ],
      },
      {
        title: { text: "Drawdown (%)" },
        height: "20%",
        top: "70%",
        offset: 0,
        max: 0,
        tickAmount: 3,
        labels: {
          formatter: function () {
            return Math.round(this.value) + "%";
          },
          style: { color: colors.benchmarkDrawdown, fontSize: "10px" },
        },
        lineColor: colors.benchmarkDrawdown,
        tickColor: colors.benchmarkDrawdown,
        tickWidth: isMobile ? 0 : 1,
        gridLineColor: colors.gridLines,
      },
    ],
    tooltip: {
      shared: true,
      outside: isMobile,
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.text, fontSize: "12px" },
      formatter: function () {
        let tooltipText = `<div style="padding:10px;"><b>${Highcharts.dateFormat(
          "%Y-%m-%d",
          this.x
        )}</b><br/>`;
        const performancePoints = this.points.filter(
          (point) => point.series.yAxis.options.top === "0%"
        );
        const drawdownPoints = this.points.filter(
          (point) => point.series.yAxis.options.top === "70%"
        );
        tooltipText += "<br/><b>Performance:</b><br/>";
        performancePoints.forEach((point) => {
          tooltipText += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: ${point.y.toFixed(
            2
          )}<br/>`;
        });
        tooltipText += `<hr style="border: 0.5px solid ${colors.gridLines};"/>`;
        tooltipText += "<b>Drawdown:</b><br/>";
        drawdownPoints.forEach((point) => {
          tooltipText += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: ${point.y.toFixed(
            2
          )}%<br/>`;
        });
        return tooltipText + "</div>";
      },
    },
    chart: {
      height: isMobile ? 500 : 600,
      backgroundColor: colors.background,
      zoomType: "xy",
    },
    legend: {
      enabled: true,
      itemStyle: { color: colors.text },
      itemHoverStyle: { color: colors.text },
      align: "left",
      verticalAlign: "top",
      layout: "horizontal",
      x: 0,
      y: 0,
    },
    credits: { enabled: false },
    exporting: { enabled: !isMobile },
    plotOptions: {
      series: {
        animation: { duration: 2000 },
        states: { hover: { enabled: true, lineWidthPlus: 1 } },
      },
    },
    series: allSeries,
  };
};
