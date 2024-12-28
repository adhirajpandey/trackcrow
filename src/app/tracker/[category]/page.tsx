import { TransactionTracker } from "@/components/transaction-tracker-sc";

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">TrackCrow Expense Tracker</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <TransactionTracker />
      </main>
    </div>
  );
}
