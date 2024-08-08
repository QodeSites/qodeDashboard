"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        toast({
          title: "Success",
          description: "Registration successful. Please wait while we verify your account.",
          variant: "success",
        });
        setTimeout(() => router.push("/auth/signin"), 5000);
      } else {
        // Display the error message from the server
        toast({
          title: "Registration Failed",
          description: data.error || "An error occurred during registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
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
    <div className="min-h-screen minion-pro-font bg-[#fafafa] flex flex-col justify-center py-12 sm:px-6 lg:p-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center playfair-disply-font text-5xl text-black">Qode</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border  py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {["username", "email", "password"].map((field) => (
              <div key={field}>
                <label htmlFor={field} className="block text-xl text-black font-bold capitalize">
                  {field}
                </label>
                <div className="mt-1">
                  <input
                    id={field}
                    name={field}
                    type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                    autoComplete={field === "password" ? "new-password" : field === "email" ? "email" : "off"}
                    required
                    value={formData[field]}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border  placeholder-black-400 focus:outline-none focus:ring-black focus: sm:text-xl"
                  />
                </div>
              </div>
            ))}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 transition px-4 border  text-sm font-medium text-black bg-white hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? "Signing Up..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t " />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-black">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 transition px-4 border  text-sm font-medium text-white bg-red-600 hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}