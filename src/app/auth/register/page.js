'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import Section from "@/components/container/Section";
import Heading from "@/components/common/Heading";
import CustomLink from "@/components/common/CustomLink";
import Button from "@/components/common/Button";
import Text from "@/components/common/Text";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    reenterPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.username.trim() === "") {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.reenterPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

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
          description:
            "Registration successful. Please wait while we verify your account.",
          variant: "success",
        });
        setTimeout(() => router.push("/auth/signin"), 5000);
      } else {
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
    <div className="bg-black mx-auto h-screen flex flex-col justify-between overflow-hidden">
      {/* ... (rest of the component remains the same) ... */}
      <div className="border-b border-brown">
        <div className="mx-auto sm:max-w-[1386px] flex justify-between items-center max-w-[93%] bg-wh h-6">
          <Link href="/" className="text-beige playfair-display-font text-3xl font-bold">
            Qode
          </Link>

          <div className="text-center">
            <Button
              onClick={() => router.push("/auth/signin")}
              className="bg-transparent border-brown border text-beige hover:bg-beige hover:text-black"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full sm:p-6 p-2 sm:max-w-[631px] max-w-[93%] border mt-2 border-brown bg-black">
          <Heading className="text-semiheading font-semiheading text-beige text-center mb-4">
            Create account
          </Heading>
          <form className="space-y-2" onSubmit={handleSubmit}>
            {["username", "email", "password", "reenterPassword"].map((field) => (
              <div key={field}>
                <div className="mt-1">
                  <input
                    id={field}
                    name={field}
                    placeholder={field === "reenterPassword" ? "Re-enter Password" : field}
                    type={
                      field === "password" || field === "reenterPassword"
                        ? "password"
                        : field === "email"
                          ? "email"
                          : "text"
                    }
                    autoComplete={
                      field === "password" || field === "reenterPassword"
                        ? "new-password"
                        : field === "email"
                          ? "email"
                          : "off"
                    }
                    required
                    value={formData[field]}
                    onChange={handleChange}
                    className="appearance-none block w-full p-18 border bg-black placeholder:text-body placeholder:text-darkGrey placeholder:capitalize border-brown focus:outline-none focus:ring-1 focus:ring-beige focus:border-beige sm:text-body text-beige"
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-between flex-col-reverse items-center mt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-beige text-black"
              >
                {isLoading ? (
                  <>
                    <span className="inline-flex items-center">
                      Registering
                      <span className="dot-animation">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                      </span>
                    </span>
                  </>
                ) : (
                  'Sign up'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}