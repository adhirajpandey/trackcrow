export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      {children}
    </main>
  );
}
