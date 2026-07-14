import type { Metadata } from "next";
import { Bricolage_Grotesque, Kalam } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-kalam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrackCrow",
  description: "Personal spending intelligence for transaction-heavy lives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${kalam.variable}`}>{children}</body>
    </html>
  );
}
