import "./globals.css";
import { Inter } from "next/font/google";
import { AuthenticatedLayout } from "@/components/authenticated-layout";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TrackCrow",
  description: "Track your expenses with ease using TrackCrow",
  icons: {
    icon: [{ url: "/trackcrow-beak.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
                <Providers>
          <AuthenticatedLayout>{children}</AuthenticatedLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
