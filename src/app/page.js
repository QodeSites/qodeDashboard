// pages/index.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Portfolio from "./portfolio/page";
import ManagedAccountDashboard from "@/components/ManagedAccountDashboard"; // Import the alternative component

export default function Home() {
  const { data: session, status } = useSession();
  console.log(session);
  
  const router = useRouter();
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

  return hasManagedAccounts ? <ManagedAccountDashboard /> : <Portfolio />;
}
