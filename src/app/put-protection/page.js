import React from 'react';

export default function Page() {
  // Sample data (similar to the one you provided)
  const data = {
    particulars: {
      Date: "Year 1",
      PnL: "% PnL",
      AmountRs: "Amount (Rs.)",
      Year: "Year",
      "Profit and Loss": [
        {
          Strategy: "Put Protection",
          Symbol: "NIFTY25DEC24000PE",
          TradeType: "Long",
          Quantity: 825,
          EntryPrice: 877.13,
          CurrentPrice: 594,
          ProfitAndLoss: -234620.0734,
          Exposure: 20000000,
          Profit: -234620.0734,
          ProfitPercentage: -0.011731004,
          Cost: 723632.25,
          CostPercentage: 0.072363225
        },
        {
          Strategy: "Covered Calls",
          Symbol: "NIFTY24DEC25000CE",
          TradeType: "Short",
          Quantity: 200,
          EntryPrice: 78,
          CurrentPrice: 100,
          ProfitAndLoss: -4458.8064,
          Exposure: 5000000,
          Profit: -1897.436973,
          ProfitPercentage: -0.000379487,
          Cost: 700728.7908,
          CostPercentage: 0.968349311
        },
        {
          Strategy: "Long Options",
          Exposure: 5000000,
          Profit: 24800.89618,
          ProfitPercentage: 0.004960179,
          Cost: 0.06854558
        }
      ],
      NetAmountToBeRecovered: {
        NetAmount: 1288283.386,
        NetAmountToBeRecoveredPercentage: "14 Nov 2024 onwards"
      },
      MonthlyPlTable: {
        TotalPercentagePl: -0.008136376,
        NiftyPercentage: 0.024281539,
        PutProtection: -0.007669753,
        CoveredCalls: 0.000334174,
        LongOptions: 0.014268922
      },
      CurrentPortfolioValueUnderHedge: {
        Value: 10000000
      },
      TotalAmountInvested: {
        TotalAmountInvestedRs: 1500000
      },
      Realised: {
        PutProtection: -234620.0734,
        CoveredCalls: -1897.436973,
        LongOptions: 24800.89618
      },
      Unrealised: {
        PutProtection: 0,
        CoveredCalls: 0,
        LongOptions: 0
      },
      Total: {
        Realised: -234620.0734,
        Unrealised: 0,
        TotalAmount: -234620.0734
      },
      RealisedPercentage: {
        PutProtection: -0.011731004,
        CoveredCalls: -0.000379487,
        LongOptions: 0.004960179
      },
      UnrealisedPercentage: {
        PutProtection: 0,
        CoveredCalls: 0,
        LongOptions: 0
      },
      TotalPercentage: {
        PutProtection: -0.011731004,
        CoveredCalls: -0.000379487,
        LongOptions: 0.004960179
      }
    }
  };

  return (
    <div className="p-6  mx-auto">
      <h1 className="text-3xl font-semibold mb-6">Portfolio Summary</h1>
      
      {/* Net Amount To Be Recovered */}
      <section className="mb-6">
        <h2 className="text-xl font-medium mb-2">Net Amount To Be Recovered</h2>
        <p className="text-lg">Net Amount: ₹{data.particulars.NetAmountToBeRecovered.NetAmount.toFixed(2)}</p>
        <p className="text-lg">Net Amount Recovery Date: {data.particulars.NetAmountToBeRecovered.NetAmountToBeRecoveredPercentage}</p>
      </section>

      {/* Monthly P/L Table */}
      <section className="mb-6">
        <h2 className="text-xl font-medium mb-2">Monthly P/L Table</h2>
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th className="px-4 py-2 border-b border-black text-left">Total % P/L</th>
              <th className="px-4 py-2 border-b border-black text-left">Nifty %</th>
              <th className="px-4 py-2 border-b border-black text-left">Put Protection</th>
              <th className="px-4 py-2 border-b border-black text-left">Covered Calls</th>
              <th className="px-4 py-2 border-b border-black text-left">Long Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border-b border-black">{data.particulars.MonthlyPlTable.TotalPercentagePl.toFixed(4)}</td>
              <td className="px-4 py-2 border-b border-black">{data.particulars.MonthlyPlTable.NiftyPercentage.toFixed(4)}</td>
              <td className="px-4 py-2 border-b border-black">{data.particulars.MonthlyPlTable.PutProtection.toFixed(4)}</td>
              <td className="px-4 py-2 border-b border-black">{data.particulars.MonthlyPlTable.CoveredCalls.toFixed(4)}</td>
              <td className="px-4 py-2 border-b border-black">{data.particulars.MonthlyPlTable.LongOptions.toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Profit and Loss Details */}
      <section className="mb-6">
        <h2 className="text-xl font-medium mb-2">Profit and Loss Details</h2>
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th className="px-4 py-2 border-b border-black text-left">Strategy</th>
              <th className="px-4 py-2 border-b border-black text-left">Symbol</th>
              <th className="px-4 py-2 border-b border-black text-left">Trade Type</th>
              <th className="px-4 py-2 border-b border-black text-left">Quantity</th>
              <th className="px-4 py-2 border-b border-black text-left">Entry Price</th>
              <th className="px-4 py-2 border-b border-black text-left">Current Price</th>
              <th className="px-4 py-2 border-b border-black text-left">Profit and Loss</th>
              <th className="px-4 py-2 border-b border-black text-left">Exposure</th>
              <th className="px-4 py-2 border-b border-black text-left">Profit (%)</th>
              <th className="px-4 py-2 border-b border-black text-left">Cost</th>
              <th className="px-4 py-2 border-b border-black text-left">Cost (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.particulars["Profit and Loss"].map((entry, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50 text-black" : ""}>
                <td className="px-4 py-2 border-b border-black">{entry.Strategy}</td>
                <td className="px-4 py-2 border-b border-black">{entry.Symbol}</td>
                <td className="px-4 py-2 border-b border-black">{entry.TradeType}</td>
                <td className="px-4 py-2 border-b border-black">{entry.Quantity}</td>
                <td className="px-4 py-2 border-b border-black">{entry.EntryPrice}</td>
                <td className="px-4 py-2 border-b border-black">{entry.CurrentPrice}</td>
                <td className="px-4 py-2 border-b border-black">₹{entry.ProfitAndLoss}</td>
                <td className="px-4 py-2 border-b border-black">₹{entry.Exposure.toFixed(2)}</td>
                <td className="px-4 py-2 border-b border-black">{entry.ProfitPercentage.toFixed(4)}</td>
                <td className="px-4 py-2 border-b border-black">₹{entry.Cost.toFixed(2)}</td>
                <td className="px-4 py-2 border-b border-black">{entry.CostPercentage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Current Portfolio Value */}
      <section className="mb-6">
        <h2 className="text-xl font-medium mb-2">Current Portfolio Value Under Hedge</h2>
        <p className="text-lg">Portfolio Value: ₹{data.particulars.CurrentPortfolioValueUnderHedge.Value.toFixed(2)}</p>
      </section>

      {/* Total Amount Invested */}
      <section className="mb-6">
        <h2 className="text-xl font-medium mb-2">Total Amount Invested</h2>
        <p className="text-lg">Total Investment: ₹{data.particulars.TotalAmountInvested.TotalAmountInvestedRs}</p>
      </section>

      {/* Realised and Unrealised P/L */}
      <section className="mb-6">
        <h2 className="text-xl font-medium mb-2">Realised and Unrealised P/L</h2>
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th className="px-4 py-2 border-b border-black text-left">Strategy</th>
              <th className="px-4 py-2 border-b border-black text-left">Realised P/L</th>
              <th className="px-4 py-2 border-b border-black text-left">Unrealised P/L</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border-b border-black">Put Protection</td>
              <td className="px-4 py-2 border-b border-black">₹{data.particulars.Realised.PutProtection.toFixed(2)}</td>
              <td className="px-4 py-2 border-b border-black">₹{data.particulars.Unrealised.PutProtection.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-black">Covered Calls</td>
              <td className="px-4 py-2 border-b border-black">₹{data.particulars.Realised.CoveredCalls.toFixed(2)}</td>
              <td className="px-4 py-2 border-b border-black">₹{data.particulars.Unrealised.CoveredCalls.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-black">Long Options</td>
              <td className="px-4 py-2 border-b border-black">₹{data.particulars.Realised.LongOptions.toFixed(2)}</td>
              <td className="px-4 py-2 border-b border-black">₹{data.particulars.Unrealised.LongOptions.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
