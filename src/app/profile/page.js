"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import DefaultLayout from "@/components/Layouts/Layouts";
import ProfilePage from "@/components/Profile";
import useFetchStrategyData from "@/hooks/useFetchStrategyData";

const ClientProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Your custom data fetching hook
  const { data, isLoading, error } = useFetchStrategyData();

  useEffect(() => {
    // If we’re still checking the session, do nothing
    if (status === "loading") return;

    // If user is not logged in, redirect
    if (!session) {
      router.push("/auth/signin");
    }
  }, [status, session, router]);

  // While the session is loading OR the user is not authenticated, display loader
  // (prevents flash of the protected content)
  if (status === "loading" || !session) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="w-2 h-2 border-4 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  if (error) {
    return <div>Error fetching data: {error}</div>;
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-black">
        {/* Pass the fetched data into your ProfilePage component */}
        <ProfilePage data={data?.portfolioDetails} />
      </div>
    </DefaultLayout>
  );
};

export default ClientProfilePage;
