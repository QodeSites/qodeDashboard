"use client";
import DefaultLayout from "@/components/Layouts/Layouts";
import PerformanceAndDrawdownChart from "@/components/Portfolio";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BlogCard from "@/components/BlogCard";
import Portfolio from "./portfolio/page";

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
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="w-2 h-2 border-t-4 rounded-full animate-spin"></div>
      </div>
    );
  }

  const dummyPosts = [
    {
      title: "The Future of AI in Healthcare",
      body: "Artificial Intelligence is revolutionizing the healthcare industry...",
      mainImage: "https://example.com/ai-healthcare.jpg",
      readTime: "5 min read",
      detailLink: "future-of-ai-in-healthcare",
      author: {
        name: "Dr. Jane Smith",
        bio: "AI researcher and healthcare consultant",
        authorImage: "https://example.com/jane-smith.jpg",
      },
      publishedAt: "2024-08-01",
    },
    {
      title: "Sustainable Living: Small Changes, Big Impact",
      body: "Discover how small everyday changes can lead to a more sustainable lifestyle...",
      mainImage: "https://example.com/sustainable-living.jpg",
      readTime: "4 min read",
      detailLink: "sustainable-living-small-changes",
      author: {
        name: "Alex Green",
        bio: "Environmental activist and writer",
        authorImage: "https://example.com/alex-green.jpg",
      },
      publishedAt: "2024-07-28",
    },
    {
      title: "The Rise of Remote Work: Challenges and Opportunities",
      body: "Explore the pros and cons of the growing trend of remote work...",
      mainImage: "https://example.com/remote-work.jpg",
      readTime: "6 min read",
      detailLink: "rise-of-remote-work",
      author: {
        name: "Sam Johnson",
        bio: "HR consultant and workplace strategist",
        authorImage: "https://example.com/sam-johnson.jpg",
      },
      publishedAt: "2024-07-25",
    },
    {
      title: "Cybersecurity in the Age of IoT",
      body: "As IoT devices proliferate, learn about the new challenges in cybersecurity...",
      mainImage: "https://example.com/iot-security.jpg",
      readTime: "7 min read",
      detailLink: "cybersecurity-iot-age",
      author: {
        name: "Emily Chen",
        bio: "Cybersecurity expert and tech writer",
        authorImage: "https://example.com/emily-chen.jpg",
      },
      publishedAt: "2024-07-22",
    },
    {
      title: "The Psychology of Productivity",
      body: "Uncover the psychological principles behind high productivity...",
      mainImage: "https://example.com/productivity-psychology.jpg",
      readTime: "5 min read",
      detailLink: "psychology-of-productivity",
      author: {
        name: "Dr. Michael Brown",
        bio: "Psychologist and productivity coach",
        authorImage: "https://example.com/michael-brown.jpg",
      },
      publishedAt: "2024-07-19",
    },
    {
      title: "Blockchain Beyond Cryptocurrency",
      body: "Explore the diverse applications of blockchain technology beyond digital currencies...",
      mainImage: "https://example.com/blockchain-apps.jpg",
      readTime: "8 min read",
      detailLink: "blockchain-beyond-crypto",
      author: {
        name: "Sophia Lee",
        bio: "Blockchain researcher and tech enthusiast",
        authorImage: "https://example.com/sophia-lee.jpg",
      },
      publishedAt: "2024-07-16",
    },
    {
      title: "The Art of Mindfulness in a Digital Age",
      body: "Learn how to practice mindfulness in our increasingly digital world...",
      mainImage: "https://example.com/digital-mindfulness.jpg",
      readTime: "6 min read",
      detailLink: "mindfulness-digital-age",
      author: {
        name: "David Wong",
        bio: "Mindfulness coach and digital wellness advocate",
        authorImage: "https://example.com/david-wong.jpg",
      },
      publishedAt: "2024-07-13",
    },
    {
      title: "The Evolution of E-commerce",
      body: "Trace the journey of online shopping from its inception to current trends...",
      mainImage: "https://example.com/ecommerce-evolution.jpg",
      readTime: "7 min read",
      detailLink: "ecommerce-evolution",
      author: {
        name: "Lisa Thompson",
        bio: "E-commerce strategist and business analyst",
        authorImage: "https://example.com/lisa-thompson.jpg",
      },
      publishedAt: "2024-07-10",
    },
    {
      title: "Artificial Intelligence in Creative Industries",
      body: "Discover how AI is transforming art, music, and other creative fields...",
      mainImage: "https://example.com/ai-creativity.jpg",
      readTime: "5 min read",
      detailLink: "ai-creative-industries",
      author: {
        name: "Robert Kim",
        bio: "AI researcher and digital artist",
        authorImage: "https://example.com/robert-kim.jpg",
      },
      publishedAt: "2024-07-07",
    },
    {
      title: "Artificial Intelligence in Creative Industries",
      body: "Discover how AI is transforming art, music, and other creative fields...",
      mainImage: "https://example.com/ai-creativity.jpg",
      readTime: "5 min read",
      detailLink: "ai-creative-industries",
      author: {
        name: "Robert Kim",
        bio: "AI researcher and digital artist",
        authorImage: "https://example.com/robert-kim.jpg",
      },
      publishedAt: "2024-07-07",
    },
  ];

  // return (
  //   <DefaultLayout>
  //     <div className=" p-14 mx-auto">
  //       {/* <div className="minion-pro-font py-28 md:py-20"> */}
  //       {/* <div className="flex flex-col"> */}
  //       {/* <h1 className="text-primary-dark sophia-pro-font text-4xl font-black mb-6 text-start">
  //         Blogs
  //       </h1> */}
  //       {/* <p className="text-gray-600 text-md md:text-lg text-start">
  //             Explore our collection of insightful articles and stay up-to-date
  //             with the latest trends and best practices in the industry.
  //           </p> */}
  //       {/* </div> */}
  //       {/* </div> */}
  //       <div className=" mx-auto flex flex-wrap justify-center gap-5">
  //         {dummyPosts.map((post) => (
  //           <BlogCard
  //             key={post.detailLink}
  //             title={post.title}
  //             summary={post.body}
  //             mainImage={post.mainImage}
  //             readTime={post.readTime}
  //             detailLink={`/blogs/${post.detailLink}`}
  //             author={post.author}
  //             authorImage={post.author.authorImage}
  //             bio={post.author.bio}
  //             publishedAt={post.publishedAt}
  //           />
  //         ))}
  //       </div>
  //     </div>
  //   </DefaultLayout>
  // );

  return (
    <Portfolio />
  )
}
