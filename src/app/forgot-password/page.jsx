// src/app/forgot-password/page.jsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast"; // adjust your import if needed
import Text from "@/components/common/Text";
import Button from "@/components/common/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      setMessage(data.message);
      toast({ title: "Check your email", description: data.message });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          Reset Your Password
        </Text>
        <div className="w-full max-w-md p-8 border border-gray-200 bg-white rounded-lg shadow-sm">
          {/* Heading */}
          {/* Show message if available (e.g. “Reset link sent”) otherwise show form */}
          {message ? (
            <p className="mb-4 text-center text-gray-700">{message}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Enter your email:
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full text-sm px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors bg-white text-brown"
                  />
                </div>
              </div>
              {/* Submit Button */}
              <div className="text-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white bg-[#d1a47b] transition-colors duration-200 py-2 my-2 rounded-md"
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      Sending...
                      <span className="ml-2 flex space-x-1 dot-animation">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                      </span>
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </div>
            </form>
          )}
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
