"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react"; // Assuming you're using Lucide icons
import Section from "@/components/container/Section";
import Heading from "@/components/common/Heading";
import Button from "@/components/common/Button";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
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
        router.push('/'); // Redirect to dashboard on success
      } else {
        throw new Error('An unexpected error occurred');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again later.');
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
    <div className="bg-black  mx-auto h-screen flex flex-col justify-between overflow-hidden">
      {/* Header Section */}
      <div className="border-b border-brown">
        <div className="mx-auto sm:max-w-[1386px] max-w-[93%] flex justify-between items-center sm:px-0 px-2 h-6">
          <Link href="/" className="text-beige playfair-display-font text-3xl font-bold">
            Qode
          </Link>
          <div className="text-center">
            <Button
              onClick={() => router.push("/auth/register")}
              className="bg-transparent border-brown border text-beige hover:bg-beige hover:text-black"
            >
              Create account

            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full sm:p-6 p-2 max-w-[93%] sm:max-w-[631px] border mt-2 border-brown bg-black">
          <Heading className="text-semiheading font-semiheading text-beige text-center mb-4">
            Sign In
          </Heading>

          <form className="space-y-2" onSubmit={handleSubmit} noValidate>
            <div>

              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-18 border bg-black placeholder:text-body placeholder:text-darkGrey border-brown text-beige focus:outline-none focus:ring-1 focus:ring-beige"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            <div>

              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full p-18 border bg-black placeholder:text-body placeholder:text-darkGrey border-brown text-beige focus:outline-none focus:ring-1 focus:ring-beige"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-beige text-black"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="inline-flex items-center">
                      Signing In
                      <span className="dot-animation">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                      </span>
                    </span>.
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>


        </div>
      </div>
    </div>

  );
}