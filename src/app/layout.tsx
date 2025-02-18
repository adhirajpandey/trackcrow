import "./globals.css";
import { Inter } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import { Toaster } from "@/components/ui/sonner";
import { DateRangeProvider } from "@/context/date-range-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TrackCrow - Expense Tracker",
  description: "Track your expenses with ease using TrackCrow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavBar />
        <DateRangeProvider>{children}</DateRangeProvider>
        <Toaster />
      </body>
    </html>
  );
}
