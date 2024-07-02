import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function PortfolioAllocation() {
  const options = {
    chart: {
      type: "pie",
    },
    title: {
      text: "",
    },
    series: [
      {
        name: "Allocation",
        data: [
          { name: "Long", y: 60 },
          { name: "Short", y: 30 },
          { name: "Options", y: 10 },
        ],
      },
    ],
    plotOptions: {
      pie: {
        dataLabels: {
          enabled: true,
          format: "{point.name}: {point.percentage:.1f} %",
        },
      },
    },
  };

  return (
    <>
      <div className="border mt-5 w-1/2 rounded-lg p-5">
        <h1 className="text-2xl mb-5 font-black">Portfolio Allocation</h1>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>
    </>
  );
}
