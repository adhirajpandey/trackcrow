import CrowBotClient from "./components/crowbot-client";

export default async function CrowBotPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-full">
        <CrowBotClient />
      </div>
    </main>
  );
}
