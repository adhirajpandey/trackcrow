import { AddTransactionForm } from "./add-transaction-form";

export default function AddTransactionPage() {
  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <div className="space-y-2 flex-1 min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
        <p className="text-muted-foreground leading-snug">
          Add a manual transaction to your records.
        </p>
      </div>
      <div className="py-8">
        <AddTransactionForm />
      </div>
    </div>
  );
}
