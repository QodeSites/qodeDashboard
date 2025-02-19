import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner } from "@material-tailwind/react";
import Head from "next/head"; // Use Next.js Head
import Heading from "./common/Heading";

const HomePage = () => {
    const [blog, setBlog] = useState([]);
    const [loading, setLoading] = useState(true);
    // IMPORTANT: For client-side env variables in Next.js, prefix with NEXT_PUBLIC_
    const key = process.env.NEXT_PUBLIC_GHOST_BLOG_KEY;
    const url = `https://blogs.qodeinvest.com/ghost/api/content/posts/?key=${key}&filter=tag:qode-dashboard`;

    useEffect(() => {
        axios
            .get(url)
            .then((response) => {
                setBlog(response.data.posts);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setLoading(false);
            });
    }, [key]);

    return (
        <>
            <Head>
                <title>Qode Blogs - Insights on Data-Driven Investing</title>
                <meta
                    name="description"
                    content="Read the latest blogs and insights from Qode on data-driven investment strategies, market analysis, and wealth management tips."
                />
                <meta
                    name="keywords"
                    content="Qode blogs, investment strategies, wealth management, market analysis, data-driven investing"
                />
                <meta name="author" content="Qode" />
                <link rel="canonical" href="https://www.qodeinvest.com/blogs" />
            </Head>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full">
                {/* White card with a link to our website */}
                <p className="text-3xl font-bold my-4 px-4">Home</p>

                <div className="px-4">
                    <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
                        {/* <a
                            href="https://premium.capitalmind.in/getting-started/"
                            target="__blank"
                            rel="noreferrer noopener"
                            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer p-4 sm:p-6"
                        >
                            <div className="flex items-center mb-2 lg:justify-between">
                                <p className="text-base leading-6 font-medium text-gray-900">Get started</p>
                                <svg
                                    stroke="currentColor"
                                    fill="currentColor"
                                    stroke-width="0"
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4 text-gray-400 ml-2"
                                    height="1em"
                                    width="1em"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
                                    ></path>
                                </svg>
                            </div>
                            <p className="text-sm leading-5 text-gray-600">
                                Read our getting started guide to get the most out of your Capitalmind
                                subscription.
                            </p>
                        </a>
                        <a
                            href="https://capitalmindpremium.slack.com/"
                            target="__blank"
                            rel="noreferrer noopener"
                            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer p-4 sm:p-6"
                        >
                            <div className="flex items-center mb-2 lg:justify-between">
                                <p className="text-base leading-6 font-medium text-gray-900">Community</p>
                                <svg
                                    stroke="currentColor"
                                    fill="currentColor"
                                    stroke-width="0"
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4 text-gray-400 ml-2"
                                    height="1em"
                                    width="1em"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
                                    ></path>
                                </svg>
                            </div>
                            <p className="text-sm leading-5 text-gray-600">
                                Join the conversation on our exclusive community on Slack for Capitalmind
                                Premium subscribers
                            </p>
                        </a> */}
                        <a
                            href="https://qodeinvest.com"
                            target="__blank"
                            rel="noreferrer noopener"
                            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer p-4 sm:p-6"
                        >
                            <div className="flex items-center mb-2 lg:justify-between">
                                <p className="text-base leading-6 font-medium text-gray-900">Visit website</p>
                                <svg
                                    stroke="currentColor"
                                    fill="currentColor"
                                    strokeWidth="0"
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4 text-gray-400 ml-2"
                                    height="1em"
                                    width="1em"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
                                    ></path>
                                </svg>
                            </div>
                            <p className="text-sm leading-5 text-gray-600">
                                Keep up with our latest content on our website
                            </p>
                        </a>
                    </div>
                </div>


                <p className="text-xl font-semibold my-4 px-4">Latest Posts</p>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spinner />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {blog.map((post) => {
                            // Format the published date if available
                            const publishedDate = post.published_at
                                ? new Date(post.published_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })
                                : "Unknown Date";
                            return (
                                <div
                                    key={post.id}
                                    className="p-4 transition duration-200 cursor-pointer"
                                    target="__blank"
                                    onClick={() =>
                                        (window.location.href = `https://www.qodeinvest.com/blogs/${post.slug}`)
                                    }
                                >
                                    <p className="text-sm text-gray-500 mb-3">{publishedDate}</p>
                                    <Heading className="text-xl font-semibold mb-2">{post.title}</Heading>
                                    <p className="text-gray-600">{post.excerpt}</p>
                                    <p className="text-sm font-semibold text-[#d1a47b] my-2">Read More</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default HomePage;
