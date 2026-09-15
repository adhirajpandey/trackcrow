"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { AccountOption } from "@/common/types";
import { AccountDialog } from "@/components/product/account-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateAccountMutation, useUpdateAccountMutation } from "@/features/accounts/mutations";
import { useAccountsQuery } from "@/features/accounts/queries";
import { getApiClientErrorMessage } from "@/lib/api/client";

export function AccountSettings({ initialAccounts }: { initialAccounts: AccountOption[] }) {
  const accountsQuery = useAccountsQuery({ initialData: initialAccounts });
  const createMutation = useCreateAccountMutation();
  const updateMutation = useUpdateAccountMutation();
  const [editing, setEditing] = useState<AccountOption | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const accounts = accountsQuery.data ?? initialAccounts;
  const pending = createMutation.isPending || updateMutation.isPending;

  async function save(name: string) {
    setError(null);
    try {
      if (editing) await updateMutation.mutateAsync({ accountUuid: editing.uuid, name });
      else await createMutation.mutateAsync({ name });
      setEditing(undefined);
    } catch (caught) {
      setError(getApiClientErrorMessage(caught, "Could not save this account."));
    }
  }

  return <>
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div><CardTitle>Accounts</CardTitle><p className="mt-1 text-sm text-secondary-foreground">Accounts are separate from payment methods such as UPI or card.</p></div>
        <Button onClick={() => { setError(null); setEditing(null); }}><Plus className="h-4 w-4" /> Add account</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.length === 0 ? <p className="text-sm text-secondary-foreground">No accounts yet.</p> : accounts.map((account) => (
          <div key={account.uuid} className="flex min-h-14 items-center justify-between gap-3 rounded-md border-2 border-border px-4 py-2">
            <span className="font-semibold">{account.name}</span>
            <Button variant="secondary" onClick={() => { setError(null); setEditing(account); }}><Pencil className="h-4 w-4" /> Rename</Button>
          </div>
        ))}
      </CardContent>
    </Card>
    <AccountDialog
      open={editing !== undefined}
      title={editing ? "Rename account" : "Add account"}
      description={editing ? "Linked transactions will show the new name." : "Create an account that can be selected on transactions."}
      initialName={editing?.name}
      pending={pending}
      error={error}
      onOpenChange={(open) => { if (!open) setEditing(undefined); }}
      onSubmit={save}
    />
  </>;
}
