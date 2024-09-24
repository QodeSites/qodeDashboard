import React, { useCallback, useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function CompoundedAnnualReturns({ data }) {
  const [chartOptions, setChartOptions] = useState(null);
  const [tableData, setTableData] = useState(null);


  const processData = useCallback((data) => {
    // Convert date strings to Date objects and sort
    const sortedData = data
      .map((item) => ({
        date: new Date(item.Date.split("-").reverse().join("-")),
        value: parseFloat(item["total_portfolio_nav"]),
      }))
      .sort((a, b) => a.date - b.date);

    return calculateCAGR(sortedData);
  }, []);

  const calculateCAGR = useCallback((sortedData) => {
    const periods = [
      { years: 1, days: 365 },
      { years: 3, days: 3 * 365 },
      { years: 5, days: 5 * 365 },
    ];

    const currentDate = new Date();
    const returns = periods.map((period) => {
      const periodReturns = [];
      for (let i = sortedData.length - 1; i >= period.days; i--) {
        const endValue = sortedData[i].value;
        const startValue = sortedData[i - period.days].value;
        const cagr =
          (Math.pow(endValue / startValue, 1 / period.years) - 1) * 100;
        periodReturns.push(cagr);

        // Break if we've gone back further than the period we're calculating
        if (
          currentDate - sortedData[i].date >
          period.days * 24 * 60 * 60 * 1000
        )
          break;
      }

      return {
        period: `${period.years}Y`,
        min: Math.min(...periodReturns),
        max: Math.max(...periodReturns),
        avg:
          periodReturns.reduce((sum, val) => sum + val, 0) /
          periodReturns.length,
      };
    });

    return returns;
  }, []);

  const createChartOptions = useCallback((cagrData) => {

    return {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: cagrData.map((data) => data.period).reverse(),
      },
      yAxis: {
        title: {
          text: "CAGR (%)",
        },
      },
      plotOptions: {
        column: {
          stacking: "normal",
        },
      },
      series: [
        {
          name: "Min",
          data: cagrData.map((data) => data.min),
        },
        {
          name: "Avg",
          data: cagrData.map((data) => data.avg - data.min),
        },
        {
          name: "Max",
          data: cagrData.map((data) => data.max - data.avg),
        },
      ],
      tooltip: {
        formatter: function () {
          let total = this.point.stackTotal;
          let value = this.y;
          let percentage = ((value / total) * 100).toFixed(2);
          return `<b>${this.series.name}</b><br/>
                  CAR: ${value.toFixed(2)}%<br/>
                  Percentage of Total: ${percentage}%`;
        },
      },
    };
  }, []);

  useEffect(() => {
    if (data) {
      const processedData = processData(data);
      const options = createChartOptions(processedData);
      setChartOptions(options);
      setTableData(processedData);
    }
  }, [data, processData, createChartOptions]);
  if (!chartOptions) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="w-2 h-2 border-t-4 rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="sm:p-4 p-1 border rounded-lg mt-5">
      <h1 className="text-lg mb-5 font-black">Compound Annual Returns</h1>

      <HighchartsReact highcharts={Highcharts} options={chartOptions} />

      <div className="mt-5">
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-300">
              <th className="border text-end border-gray-700 p-2"></th>
              <th className="border text-end border-gray-700 p-2">5 Year</th>
              <th className="border text-end border-gray-700 p-2">3 Year</th>
              <th className="border text-end border-gray-700 p-2">1 Year</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-700 p-2 font-bold">Avg</td>
              {tableData
                .map((item, index) => {
                  const avg =
                    isNaN(item.avg) || !isFinite(item.avg)
                      ? 0
                      : item.avg.toFixed(2);
                  return (
                    <td
                      key={index}
                      className="border text-end border-gray-700 p-2"
                    >
                      {avg}%
                    </td>
                  );
                })
                .reverse()}
            </tr>
            <tr>
              <td className="border border-gray-700 p-2 font-bold">Min</td>
              {tableData
                .map((item, index) => {
                  const min =
                    isNaN(item.min) || !isFinite(item.min)
                      ? 0
                      : item.min.toFixed(2);
                  return (
                    <td
                      key={index}
                      className="border text-end border-gray-700 p-2"
                    >
                      {min}%
                    </td>
                  );
                })
                .reverse()}
            </tr>
            <tr>
              <td className="border border-gray-700 p-2 font-bold">Max</td>
              {tableData
                .map((item, index) => {
                  const max =
                    isNaN(item.max) || !isFinite(item.max)
                      ? 0
                      : item.max.toFixed(2);
                  return (
                    <td
                      key={index}
                      className="border text-end border-gray-700 p-2"
                    >
                      {max}%
                    </td>
                  );
                })
                .reverse()}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
