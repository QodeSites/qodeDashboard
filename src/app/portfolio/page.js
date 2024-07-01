import DefaultLayout from "@/components/Layouts/Layouts";
import PerformanceAndDrawdownChart from "@/components/Portfolio";
import React from "react";

const Portfolio = () => {
  return (
    <DefaultLayout>
      <PerformanceAndDrawdownChart />
    </DefaultLayout>
  );
};

export default Portfolio;
