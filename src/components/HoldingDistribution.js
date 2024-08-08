import React, { useState, useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const HoldingDistribution = ({ activeStrategy }) => {
  // console.log("activeStrategy: ", activeStrategy);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/holdingDistribution.json");
        const jsonData = await response.json();
        const filteredData = jsonData.Sheet1.filter(
          (item) => item.Strategy === activeStrategy
        );
        setData(filteredData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [activeStrategy]);

  const { percentages, chartOptions } = useMemo(() => {
    const totals = data.reduce(
      (acc, item) => {
        const marketCap = parseFloat(item["Market Cap"]);

        if (marketCap > 20000) {
          acc.large += marketCap;
        } else if (marketCap >= 5000 && marketCap <= 20000) {
          acc.mid += marketCap;
        } else if (marketCap < 5000) {
          acc.small += marketCap;
        }
        acc.total += marketCap;
        return acc;
      },
      { large: 0, mid: 0, small: 0, total: 0 }
    );

    const percentages = {
      large: ((totals.large / totals.total) * 100).toFixed(2),
      mid: ((totals.mid / totals.total) * 100).toFixed(2),
      small: ((totals.small / totals.total) * 100).toFixed(2),
    };

    const chartOptions = {
      chart: {
        type: "bar",
        height: 160,
        backgroundColor: "rgba(0, 0, 0, 0)",
      },
      title: {
        text: null,
      },
      xAxis: {
        categories: [""],
        labels: {
          enabled: false,
        },
        lineWidth: 0,
        minorGridLineWidth: 0,
        minorTickLength: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        max: 100,
        title: {
          text: null,
        },
        labels: {
          enabled: false,
        },
        gridLineWidth: 0,
      },
      legend: {
        reversed: true,
        enabled: true,
        align: "center",
        verticalAlign: "bottom",
        layout: "horizontal",
        itemStyle: {
          color: "#333333",
          fontWeight: "normal",
        },
      },
      plotOptions: {
        series: {
          stacking: "percent",
        },
        bar: {
          dataLabels: {
            enabled: true,
            useHTML: true,
            format:
              '<span style="font-size: 14px;">{y}%</span>',
            align: "center",
            verticalAlign: "middle",
            inside: true,
            style: {
              textOutline: "none",
              color: "#000",
            },
          },
        },
      },
      tooltip: {
        pointFormat: "<b>{point.percentage:.1f}%</b>",
      },
      series: [
        {
          name: "Large Cap",
          data: [parseFloat(percentages.large)],
          color: "#58A992", // Soft mint green
          borderColor: "#000",
        },
        {
          name: "Mid Cap",
          data: [parseFloat(percentages.mid)],
          color: "#7BCBA5", // Light seafoam green
          borderColor: "#000",
        },
        {
          name: "Small Cap",
          data: [parseFloat(percentages.small)],
          color: "#A3E4B6", // Pale spring green
          borderColor: "#000",
        },
      ],
      credits: {
        enabled: false,
      },
    };

    return { percentages, chartOptions };
  }, [data]);

  return (
    <div className="w-full ">
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  );
};

export default HoldingDistribution;
