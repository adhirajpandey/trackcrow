import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackCrow",
  description: "TrackCrow is under active rewrite.",
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
