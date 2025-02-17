"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import Heading from "@/components/common/Heading";
import Button from "@/components/common/Button";

// Import FontAwesome components and icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Text from "@/components/common/Text";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="bg-gray-50 mx-auto h-screen flex flex-col justify-between overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <Link
          href="/"
          className="text-[#d1a47b] text-center playfair-display-font mb-4 font-bold text-6xl"
        >
          Qode
        </Link>
        <Text className="text-center text-2xl font-normal text-brown my-6">
          Sign in to your account
        </Text>
        <div className="w-full max-w-md p-8 border border-gray-200 bg-white rounded-lg shadow-sm">
          {error && <p className="mb-4 text-center text-red-500">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className={`w-full text-sm px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors ${error ? "border-red-500" : "border-gray-300"
                    } bg-white text-brown`}
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            {/* Password Input with Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full text-sm px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors ${error ? "border-red-500" : "border-gray-300"
                    } bg-white text-brown`}
                  aria-invalid={error ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-gray-500" />
                </button>
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

              {/* Forgot Password Link */}
              <Link href="/forgot-password" className="text-sm my-6 text-[#d1a47b] underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Qode. All rights reserved.
      </footer>
    </div>
  );
}
