// pages/strategies.js
"use client";
import { useState } from "react";
import Link from "next/link";
import DefaultLayout from "@/components/Layouts/Layouts";
import useStrategyData from "@/components/hooks/useStrategyData";

const StrategyCard = ({ strategy, name, description, slug }) => {
  const { loading, error, calculateReturns } = useStrategyData(strategy);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const periods = ["1M", "3M", "6M", "1Y", "3Y", "5Y"];

  return (
    <Link
      href={`/strategies/${slug}`}
      className={`block bg-white p-10 relative`}
    >
      <h1 className="text-4xl font-bold playfair-display-font my-5">{name}</h1>
      <p className="text-lg mb-3">{description}</p>
      <div className="flex flex-row gap-20">
        {periods.map((period) => (
          <div key={period} className="flex flex-col">
            <h1 className="text-3xl font-bold playfair-display-font">
              {period}
            </h1>
            <p className="text-lg">{calculateReturns(period)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end">
        <div className="py-3 px-5 mt-5 text-center flex justify-between items-center border border-black font-medium hover:bg-white/10 transition duration-300 text-black hover:before:bg-black relative h-[50px] overflow-hidden before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-black before:transition-all before:duration-500 hover:text-white hover:before:left-0 hover:before:w-full">
          <span className="relative z-10">Know more</span>
        </div>
      </div>
    </Link>
  );
};

const Strategies = () => {
  const strategies = [
    {
      id: "qgf",
      name: "Quant Growth Fund",
      slug: "quant-growth-fund",
      description:
        "Our strategies are designed to help you achieve your financial goals. We offer a range of strategies to suit your investment needs.",
    },
    {
      id: "momentum",
      name: "Quant Momentum Fund",
      slug: "quant-growth-momentum",
      description:
        "Our strategies are designed to help you achieve your financial goals. We offer a range of strategies to suit your investment needs.",
    },
    {
      id: "lowvol",
      name: "Low Vol Fund",
      slug: "quant-debt-fund",
      description:
        "Our strategies are designed to help you achieve your financial goals. We offer a range of strategies to suit your investment needs.",
    },
  ];

  return (
    <div className="flex flex-col gap-10 w-1/2 helvetica-font mx-auto my-20">
      {strategies.map((strategy) => (
        <StrategyCard
          key={strategy.id}
          strategy={strategy.id}
          name={strategy.name}
          description={strategy.description}
          slug={strategy.slug}
        />
      ))}
      <div className="text-center">
        <Link
          href="/open-account"
          className="bg-black text-white text-xl text-center px-5 py-3 "
        >
          Open Account With Qode
        </Link>
      </div>
    </div>
  );
};

const StrategiesPage = () => {
  return (
    <DefaultLayout>
      <Strategies />
    </DefaultLayout>
  );
};

export default StrategiesPage;
