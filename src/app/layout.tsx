import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
