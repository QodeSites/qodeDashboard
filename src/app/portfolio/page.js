"use client";
// src/app/portfolio/page.js
import DefaultLayout from "@/components/Layouts/Layouts";
import PerformanceAndDrawdownChart from "@/components/Portfolio";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Portfolio = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session) {
      // Redirect to sign-in page if no session is found
      // router.push("/");
    } else {
      setLoading(false);
    }
  }, [session, status, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <DefaultLayout>
      <PerformanceAndDrawdownChart />
    </DefaultLayout>
  );
};

export default Portfolio;
