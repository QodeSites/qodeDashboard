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
      <div className="container mx-auto px-4 py-8">
        {/* Blog Section */}
        <section className="blog-section">
          <h2 className="text-3xl font-bold sophia-pro-font  mb-6">Latest Blog Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Blog Post 1 */}
            <article className="bg-white p-4 shadow-lg rounded-lg">
              <h3 className="text-xl font-semibold sophia-pro-font  mb-2">Understanding Portfolio Diversification</h3>
              <p className="text-gray-700 mb-4">
                Diversification is a key strategy in managing your investment risk. Learn how to effectively diversify your portfolio.
              </p>
              <a href="#" className="text-blue-500 hover:underline">
                Read more
              </a>
            </article>
            {/* Blog Post 2 */}
            <article className="bg-white p-4 shadow-lg rounded-lg">
              <h3 className="text-xl font-semibold  sophia-pro-font mb-2">Top 5 Investment Strategies for 2024</h3>
              <p className="text-gray-700 mb-4">
                Explore the top investment strategies that are expected to outperform the market in 2024.
              </p>
              <a href="#" className="text-blue-500 hover:underline">
                Read more
              </a>
            </article>
            {/* Blog Post 3 */}
            <article className="bg-white p-4 shadow-lg rounded-lg">
              <h3 className="text-xl font-semibold sophia-pro-font  mb-2">The Impact of Inflation on Your Investments</h3>
              <p className="text-gray-700 mb-4">
                Inflation can erode your investment returns. Learn how to protect your portfolio from inflation.
              </p>
              <a href="#" className="text-blue-500 hover:underline">
                Read more
              </a>
            </article>
            {/* More blog posts can be added in a similar way */}
          </div>
        </section>
      </div>
    </DefaultLayout>
  );
}
