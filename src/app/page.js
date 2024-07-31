"use client";
import DefaultLayout from "@/components/Layouts/Layouts";
import PerformanceAndDrawdownChart from "@/components/Portfolio";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      setLoading(false);
    }
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <DefaultLayout>
      <PerformanceAndDrawdownChart />
    </DefaultLayout>
  );
}
