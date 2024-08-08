import Providers from "@/components/Providers";
import "./globals.css";
import { Toast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="minion-pro-font">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
