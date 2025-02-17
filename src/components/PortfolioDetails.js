import React from 'react';
import { Wallet, TrendingUp, PieChart, ArrowUpDown } from 'lucide-react';
import Text from './common/Text';
import Heading from './common/Heading';

const PortfolioDetails = ({ data, isCumulative = false }) => {
  if (!data) return null;

  // Helper: Format a number into INR currency.
  const formatNumber = (num, showNegative = false) => {
    // If num is not a valid number, default to 0.
    if (isNaN(num)) num = 0;
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: 'currency',
      currency: 'INR',
      signDisplay: showNegative ? 'auto' : 'never',
    }).format(num);
  };

  // Parse values from data and default to 0 if invalid.
  const initialInvestment = parseFloat(data.initial_investment) || 0;
  const portfolioValue = parseFloat(data.portfolio_value) || 0;
  const cash = parseFloat(data.cash) || 0;

  // Calculate profit and profit percentage safely.
  const profit = portfolioValue - initialInvestment;
  const profitPercentage =
    initialInvestment === 0 ? 0 : (profit / initialInvestment) * 100;

  // Calculate cash percentage safely.
  const cashPercentage =
    portfolioValue === 0 ? 0 : (cash / portfolioValue) * 100;

  const kpis = [
    {
      icon: <Wallet className="w-4 h-4" />,
      title: isCumulative ? "Total Investment" : "Initial Investment",
      value: formatNumber(initialInvestment),
      className: "col-span-1",
    },
    {
      icon: <PieChart className="w-4 h-4" />,
      title: isCumulative ? "Total Portfolio Value" : "Portfolio Value",
      value: formatNumber(portfolioValue),
      className: "col-span-1",
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Profit/Loss",
      value: formatNumber(profit, true),
      subtext: `${profit >= 0 ? '+' : '-'}${Math.abs(profitPercentage).toFixed(
        2
      )}%`,
      className: "col-span-1",
      valueColor: profit >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      icon: <ArrowUpDown className="w-4 h-4" />,
      title: "Cash Balance",
      value: formatNumber(cash),
      subtext: `${cashPercentage.toFixed(2)}%`,
      className: "col-span-1",
    },
  ];

  return (
    <div className="w-full mb-4">
      <h3 className="text-lg leading-6 mb-4 font-medium text-gray-900">
        Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`
              ${kpi.className}
              p-6 
              bg-gray-50 rounded-lg
              border border-gray-200
              transition-colors duration-200
            `}
          >
            <div className="flex items-center mb-2">
              <span className="text-gray-600">{kpi.icon}</span>
              <Text className="ml-2 text-xs text-gray-600">{kpi.title}</Text>
            </div>
            <div className="mt-2">
              <Text className={`text-lg font-semibold ${kpi.valueColor || 'text-gray-900'}`}>
                {kpi.value}
                {kpi.subtext && (
                  <span className="text-gray-400 text-xs font-normal ml-1">
                    {kpi.subtext}
                  </span>
                )}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioDetails;
