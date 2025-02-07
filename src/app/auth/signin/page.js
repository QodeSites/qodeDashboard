"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import Heading from "@/components/common/Heading";
import Button from "@/components/common/Button";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        router.push("/");
      } else {
        throw new Error("An unexpected error occurred");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.");
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 mx-auto h-screen flex flex-col justify-between overflow-hidden">
      {/* Header Section */}
      {/* <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto xl:max-w-6xl md:max-w-4xl w-full flex justify-between items-center px-4 py-2"> */}
          {/* <Link
            href="/"
            className="text-brown dark:text-brown text-center playfair-display-font font-bold text-3xl"
          >
            Qode
          </Link> */}
          {/* Uncomment the Button below if you want to add a "Create Account" link */}
          {/*
          <Button
            onClick={() => router.push("/auth/register")}
            className="bg-transparent border border-gray-200 dark:border-gray-700 text-brown dark:text-brown hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Create Account
          </Button>
          */}
        {/* </div>
      </header> */}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <Link
          href="/"
          className="text-brown dark:text-brown text-center  playfair-display-font mb-4 font-bold text-3xl"
        >
          Qode
        </Link>
        <div className="w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
          <Heading className="text-center text-2xl font-semibold text-brown dark:text-brown mb-6">
            Sign In
          </Heading>

          {error && (
            <p className="mb-4 text-center text-red-500">{error}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors ${error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-800 text-brown dark:text-gray-100`}
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors ${error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-800 text-brown dark:text-gray-100`}
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-beige dark:bg-beige text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 py-2 rounded-md"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    Submitting
                    <span className="ml-2 flex space-x-1 dot-animation">
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                    </span>
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Qode. All rights reserved.
      </footer>
    </div>
  );
}
