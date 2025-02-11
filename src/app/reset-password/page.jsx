"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Text from "@/components/common/Text";
import Button from "@/components/common/Button";
import ResetPasswordForm from "@/components/ResetPasswordForm";
function LoadingFallback() {
  return (
    <div className="w-full max-w-md p-8 border border-gray-200 bg-white rounded-lg shadow-sm animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
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
        <Suspense fallback={<LoadingFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <Link href="/auth/signin" className="text-[#d1a47b] hover:text-[#c39569] underline">
          Back to Sign In
        </Link>
        <div>&copy; {new Date().getFullYear()} Qode. All rights reserved.</div>
      </footer>
    </div>
  );
}