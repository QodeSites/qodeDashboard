"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Text from "@/components/common/Text";
import Button from "@/components/common/Button";

// Separate component for the reset password form to wrap in Suspense
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [passwordErrors, setPasswordErrors] = useState([]);

  // Retrieve token and email from query parameters
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  // Handle password change with validation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    if (newPassword) {
      setPasswordErrors(validatePassword(newPassword));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password before submission
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

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
    <div className="w-full max-w-md p-8 border border-gray-200 bg-white rounded-lg shadow-sm">
      {message.text && (
        <p
          className={`mb-4 text-center ${
            message.type === "success" ? "text-green-600" : "text-red-600"
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
              onChange={handlePasswordChange}
              className={`w-full text-sm px-4 py-2 border ${
                passwordErrors.length > 0 ? "border-red-300" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors bg-white text-brown`}
            />
          </div>
          {/* Password strength requirements */}
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">Password must contain:</p>
            <ul className="space-y-1 text-xs">
              <li className={`flex items-center ${password.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                <span className={`mr-2 ${password.length >= 8 ? "text-green-600" : "text-gray-400"}`}>
                  {password.length >= 8 ? "✓" : "○"}
                </span>
                At least 8 characters
              </li>
              <li className={`flex items-center ${/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                <span className={`mr-2 ${/[A-Z]/.test(password) ? "text-green-600" : "text-gray-400"}`}>
                  {/[A-Z]/.test(password) ? "✓" : "○"}
                </span>
                One uppercase letter
              </li>
              <li className={`flex items-center ${/[a-z]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                <span className={`mr-2 ${/[a-z]/.test(password) ? "text-green-600" : "text-gray-400"}`}>
                  {/[a-z]/.test(password) ? "✓" : "○"}
                </span>
                One lowercase letter
              </li>
              <li className={`flex items-center ${/[0-9]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                <span className={`mr-2 ${/[0-9]/.test(password) ? "text-green-600" : "text-gray-400"}`}>
                  {/[0-9]/.test(password) ? "✓" : "○"}
                </span>
                One number
              </li>
              <li className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                <span className={`mr-2 ${/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-gray-400"}`}>
                  {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"}
                </span>
                One special character
              </li>
            </ul>
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
              className={`w-full text-sm px-4 py-2 border ${
                confirmPassword && password !== confirmPassword ? "border-red-300" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors bg-white text-brown`}
            />
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
        </div>
        <div className="text-center">
          <Button
            type="submit"
            disabled={isLoading || passwordErrors.length > 0 || password !== confirmPassword}
            className={`w-full text-white ${
              isLoading || passwordErrors.length > 0 || password !== confirmPassword
                ? "bg-gray-400"
                : "bg-[#d1a47b] hover:bg-[#c39569]"
            } transition-colors duration-200 py-2 my-2 rounded-md`}
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
  );
}

export default ResetPasswordForm;