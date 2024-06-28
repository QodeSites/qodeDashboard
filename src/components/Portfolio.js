"use client";
import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from "@material-tailwind/react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const SimplePortfolio = () => {
  const [activeTab, setActiveTab] = useState("scheme1");
  const [chartData, setChartData] = useState({ scheme1: [], scheme2: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/investment-data.json");
        const data = await response.json();
        setChartData({
          scheme1: data.strategy1,
          scheme2: data.strategy2,
        });
      } catch (error) {
        console.log(error.message);
      }
    };
    fetchData();
  }, []);

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

  const getChartOptions = (scheme) => {
    const performanceData = chartData[scheme].map((item) => [
      new Date(item.Date.split("-").reverse().join("-")).getTime(),
      item["Total Portfolio NAV"],
    ]);

    const drawdownData = calculateDrawdown(chartData[scheme]);

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
              [
                0,
                Highcharts.color(Highcharts.getOptions().colors[0])
                  .setOpacity(0.5)
                  .get("rgba"),
              ],
              [
                1,
                Highcharts.color(Highcharts.getOptions().colors[0])
                  .setOpacity(0)
                  .get("rgba"),
              ],
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
              [
                0,
                Highcharts.color("rgba(250, 65, 65, 1)")
                  .setOpacity(0)
                  .get("rgba"),
              ],
              [
                1,
                Highcharts.color("rgba(250, 65, 65, 1)")
                  .setOpacity(0)
                  .get("rgba"),
              ],
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

  return (
    <Tabs value={activeTab}>
      <TabsHeader
        className="rounded-none border-b w-1/3 border-blue-gray-50 bg-transparent p-0"
        indicatorProps={{
          className:
            "bg-transparent border-b-2 border-gray-900 shadow-none rounded-none",
        }}
      >
        <Tab value="scheme1" onClick={() => setActiveTab("scheme1")}>
          Scheme 1
        </Tab>
        <Tab value="scheme2" onClick={() => setActiveTab("scheme2")}>
          Scheme 2
        </Tab>
      </TabsHeader>
      <TabsBody>
        <TabPanel value="scheme1">
          <HighchartsReact
            highcharts={Highcharts}
            options={getChartOptions("scheme1")}
          />
        </TabPanel>
        <TabPanel value="scheme2">
          <HighchartsReact
            highcharts={Highcharts}
            options={getChartOptions("scheme2")}
          />
        </TabPanel>
      </TabsBody>
    </Tabs>
  );
};

export default SimplePortfolio;
