import React from "react";
import { faArrowRight, faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
function BlogCard({
    title,
    summary,
    readTime,
    detailLink,
    mainImage,
    author,
    authorImage,
    publishedAt,
}) {
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    return (
        <div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="overflow-hidden transition-transform duration-75 minion-pro-font max-w-[400px] hover:scale-105  flex flex-col"
        >
            <Link href={`${detailLink}`} className="block flex-grow">
                <div className="p-6 h-full group overflow-hidden relative flex flex-col">
                    <div className="transition-all duration-500 transform group-hover:-translate-y-5 flex flex-col h-full">
                        <div className="mb-auto">
                            <span className="text-primary-dark text-sm">Blog</span>
                            <h3 className="md:text-lg text-black group-hover:text-red-600 font-bold sophia-pro-font mb-2 relative overflow-hidden text-ellipsis">
                                {title}
                            </h3>
                        </div>
                        <p className="text-md line-clamp-5 my-4">{summary}</p>
                        <div className="flex items-center justify-between mt-4">
                            {/* <div className="flex items-center">
                <img
                  src={authorImage}
                  alt={author.name}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <span className="text-sm">{author.name}</span>
              </div> */}
                            {/* <div className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-1" />
                <span className="text-sm">{readTime}</span>
              </div> */}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-6 py-4 transition-all duration-300 opacity-0 group-hover:opacity-100">
                        <Link href={detailLink} className="text-red-600">
                            Continue Reading <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                    </div>
                </div>
            </Link>
            <hr className="w-full" />
        </div>
    );
}

export default BlogCard;
