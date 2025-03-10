"use client";
import { useState, Suspense, useEffect } from "react";
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
  const [validationErrors, setValidationErrors] = useState({});

  // Retrieve token and email from query parameters
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Password validation function
  const validatePassword = (password) => {
    const errors = {};
    
    if (password.length < 8) {
      errors.length = false;
    } else {
      errors.length = true;
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.uppercase = false;
    } else {
      errors.uppercase = true;
    }
    
    if (!/[a-z]/.test(password)) {
      errors.lowercase = false;
    } else {
      errors.lowercase = true;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.special = false;
    } else {
      errors.special = true;
    }
    
    if (!/\d/.test(password)) {
      errors.number = false;
    } else {
      errors.number = true;
    }
    
    return errors;
  };

  // Check password match
  const checkPasswordMatch = () => {
    if (confirmPassword && password !== confirmPassword) {
      return false;
    }
    return true;
  };

  // Update validation on password change
  useEffect(() => {
    if (password) {
      setValidationErrors(validatePassword(password));
    }
  }, [password]);

  // Check if all password requirements are met
  const isPasswordValid = () => {
    if (!password) return false;
    return Object.values(validationErrors).every(value => value === true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation before submission
    if (!isPasswordValid()) {
      setMessage({
        type: "error",
        text: "Password does not meet all requirements"
      });
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
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full text-sm px-4 py-2 border ${
                password && !isPasswordValid() ? "border-red-300" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors bg-white text-brown`}
            />
          </div>
          
          {/* Password Requirements Display */}
          {password && (
            <div className="mt-2 space-y-1 text-xs">
              <p className={`flex items-center ${validationErrors.length ? "text-green-500" : "text-gray-500"}`}>
                <span className="mr-1">{validationErrors.length ? "✓" : "○"}</span> 
                At least 8 characters
              </p>
              <p className={`flex items-center ${validationErrors.uppercase ? "text-green-500" : "text-gray-500"}`}>
                <span className="mr-1">{validationErrors.uppercase ? "✓" : "○"}</span> 
                At least one uppercase letter
              </p>
              <p className={`flex items-center ${validationErrors.lowercase ? "text-green-500" : "text-gray-500"}`}>
                <span className="mr-1">{validationErrors.lowercase ? "✓" : "○"}</span> 
                At least one lowercase letter
              </p>
              <p className={`flex items-center ${validationErrors.special ? "text-green-500" : "text-gray-500"}`}>
                <span className="mr-1">{validationErrors.special ? "✓" : "○"}</span> 
                At least one special character
              </p>
              <p className={`flex items-center ${validationErrors.number ? "text-green-500" : "text-gray-500"}`}>
                <span className="mr-1">{validationErrors.number ? "✓" : "○"}</span> 
                At least one number
              </p>
            </div>
          )}
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
                confirmPassword && !checkPasswordMatch() ? "border-red-300" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors bg-white text-brown`}
            />
          </div>
          {confirmPassword && !checkPasswordMatch() && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
        </div>
        <div className="text-center">
          <Button
            type="submit"
            disabled={isLoading || !isPasswordValid() || !checkPasswordMatch() || !confirmPassword}
            className={`w-full text-white ${
              isLoading || !isPasswordValid() || !checkPasswordMatch() || !confirmPassword
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

export default function ResetPasswordPage() {
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
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
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