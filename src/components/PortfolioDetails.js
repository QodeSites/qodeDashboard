import React from 'react';
import { Wallet, TrendingUp, PieChart, ArrowUpDown } from 'lucide-react';
import Text from './common/Text';
import Heading from './common/Heading';

const PortfolioDetails = ({ data, isCumulative = false }) => {
  if (!data) return null;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: 'currency',
      currency: 'INR'
    }).format(num);
  };

  const profit = parseFloat(data.portfolio_value) - parseFloat(data.initial_investment);
  const profitPercentage = (profit / parseFloat(data.initial_investment)) * 100;
  const cashPercentage = (parseFloat(data.cash) / parseFloat(data.portfolio_value)) * 100;

  const kpis = [
    {
      icon: <Wallet className="w-1 h-1" />,
      title: isCumulative ? "Total Investment" : "Initial Investment",
      value: formatNumber(data.initial_investment),
      className: "col-span-1"
    },
    {
      icon: <PieChart className="w-1 h-1" />,
      title: isCumulative ? "Total Portfolio Value" : "Portfolio Value",
      value: formatNumber(data.portfolio_value),
      className: "col-span-1"
    },
    {
      icon: <TrendingUp className="w-1 h-1" />,
      title: "Profit/Loss",
      value: formatNumber(Math.abs(profit)),
      subtext: `${profit >= 0 ? '+' : '-'}${Math.abs(profitPercentage).toFixed(2)}%`,
      className: "col-span-1",
      valueColor: profit >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
    },
    {
      icon: <ArrowUpDown className="w-1 h-1" />,
      title: "Cash Balance",
      value: formatNumber(data.cash),
      subtext: `${cashPercentage.toFixed(2)}%`,
      className: "col-span-1"
    },
  ];

  return (
    <div className="w-full mb-4">
      <Heading className="sm:text-subheading italic text-mobileSubHeading font-subheading text-brown dark:text-brown mb-18">
        Summary
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`
              ${kpi.className}
              p-18 
              bg-gray-50 rounded-lg dark:bg-gray-800
              border border-gray-200 dark:border-brown
              transition-colors duration-200
            `}
          >
            <div className="flex items-center mb-2">
              <span className="text-gray-600 dark:text-gray-300">
                {kpi.icon}
              </span>
              <Text className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                {kpi.title}
              </Text>
            </div>
            <div className="mt-2">
            <Text className={`text-lg font-semibold ${kpi.valueColor || 'text-gray-900 dark:text-white'}`}>

              {kpi.value}
              {kpi.subtext && (
                <span className="text-gray-400 text-xs font-normal ml-1">{kpi.subtext}</span>
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