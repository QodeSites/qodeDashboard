"use client";

import React, { useEffect, useState } from "react";
import Portfolio from "./portfolio/page";
import HomePage from "@/components/Home";
import DefaultLayout from "@/components/Layouts/Layouts";
import { useRouter } from "next/navigation"; // Changed import
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session) {
      router.push("/auth/signin"); // Redirect if not authenticated
    } else {
      setLoading(false); // Stop loading once session is available
    }
  }, [session, status, router]);

    if (status === "loading") {
      return (
        <DefaultLayout>
          <div>Loading...</div>
        </DefaultLayout>
      );
    }
  

  return (
    <DefaultLayout>
      <HomePage />
    </DefaultLayout>
  );
}
