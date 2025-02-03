"use client";
import DefaultLayout from "@/components/Layouts/Layouts";
import PerformanceAndDrawdownChart from "@/components/Portfolio";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ManagedAccountDashboard from "@/components/ManagedAccountDashboard"; // Import the alternative component

const Portfolio = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  console.log(session);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session) {
      router.push("/auth/signin"); // Redirect to sign-in if not authenticated
    } else {
      setLoading(false); // Stop loading once session is available
    }
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="w-2 h-2 border-t-4 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if managed_account_codes exists and has at least one entry
  const hasManagedAccounts =
    session?.user?.managed_account_codes &&
    session.user.managed_account_codes.length > 0;


  if (status === "loading") {
    return (
      <DefaultLayout>
        <div>Loading...</div>
      </DefaultLayout>
    );
  }

  if (status === "unauthenticated") {
    return null; // Avoid rendering anything until the redirect happens
  }

  return (
    <DefaultLayout>
      {hasManagedAccounts ? <ManagedAccountDashboard accountCodes={session.user.managed_account_names} /> :<PerformanceAndDrawdownChart /> }
    </DefaultLayout>
  );
};

export default Portfolio;
