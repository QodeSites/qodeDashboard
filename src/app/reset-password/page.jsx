"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Text from "@/components/common/Text";
import Button from "@/components/common/Button";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Retrieve token and email from query parameters
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match"
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessage({
        type: "success",
        text: "Your password has been reset successfully. Redirecting to Sign In page..."
      });

      // Delay for a few seconds so the user sees the message before redirecting
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="mb-4 text-red-500">Invalid password reset link.</p>
        <Link href="/signin" className="text-blue-500 underline">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 mx-auto h-screen flex flex-col justify-between overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <Link
          href="/"
          className="text-[#d1a47b] text-center playfair-display-font mb-4 font-bold text-5xl"
        >
          Qode
        </Link>
        <Text className="text-center text-2xl font-extralight text-brown my-6">
          Reset Password
        </Text>
        <div className="w-full max-w-md p-8 border border-gray-200 bg-white rounded-lg shadow-sm">
          {message.text && (
            <p
              className={`mb-4 text-center ${message.type === "success" ? "text-green-600" : "text-red-600"
                }`}
            >
              {message.text}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors bg-white text-brown"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors bg-white text-brown"
                />
              </div>
            </div>
            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-white bg-[#d1a47b] transition-colors duration-200 py-2 my-2 rounded-md"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    Resetting...
                    <span className="ml-2 flex space-x-1 dot-animation">
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                    </span>
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <Link href="/auth/signin" className="text-[#d1a47b] underline">
          Back to Sign In
        </Link>
        <div>&copy; {new Date().getFullYear()} Qode. All rights reserved.</div>
      </footer>
    </div>
  );

}