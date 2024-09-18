"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react"; // Assuming you're using Lucide icons

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
    <div className="min-h-screen minion-pro-font bg-black flex flex-col justify-center py-12 sm:px-6 lg:p-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold text-black">Qode Login</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border  py-8 px-4 sm:px-10">
          {error && <p className="text-red-500 text-body mb-4" role="alert">{error}</p>}
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-md font-medium text-black">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border  placeholder-black-400 focus:outline-none focus:ring-black focus: sm:text-md"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-md font-medium text-black">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border  placeholder-black-400 focus:outline-none focus:ring-black focus: sm:text-md"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border  text-body font-medium text-black bg-black hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-150 ease-in-out"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-3" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t " />
              </div>
              <div className="relative flex justify-center text-body">
                <span className="px-2 bg-black text-black">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/register"
                className="w-full flex justify-center py-2 px-4 border  text-body font-medium text-white bg-red-600 hover:bg-black hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-150 ease-in-out"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}