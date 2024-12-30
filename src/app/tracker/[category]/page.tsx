import { TransactionTracker } from "@/components/transaction-tracker-sc";

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <TransactionTracker />
      </main>
    </div>
  );
}
