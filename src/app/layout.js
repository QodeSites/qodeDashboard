import Providers from "@/components/Providers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="minion-pro-font bg-white dark:bg-black text-gray-900 dark:text-white min-h-screen transition-colors duration-300">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}