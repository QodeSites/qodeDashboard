import DefaultLayout from "@/components/Layouts/Layouts";
import Dashboard from "./dashboard/page";

export const metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Home() {
  return (
    <DefaultLayout>
      <Dashboard />
    </DefaultLayout>
  );
}
