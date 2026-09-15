"use client";

import { useState } from "react";
import type { AccountOption } from "@/common/types";
import { Select } from "@/components/ui/select";
import { getApiClientErrorMessage } from "@/lib/api/client";
import { useCreateAccountMutation } from "@/features/accounts/mutations";
import { AccountDialog } from "./account-dialog";

const ADD_ACCOUNT = "__add_account__";

export function AccountPicker(props: {
  value: string;
  accounts: AccountOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateAccountMutation();

  async function create(name: string) {
    setError(null);
    try {
      const account = await createMutation.mutateAsync({ name });
      props.onChange(account.uuid);
      setOpen(false);
    } catch (caught) {
      setError(getApiClientErrorMessage(caught, "Could not create this account."));
    }
  }

  return <>
    <Select
      ariaLabel="Account"
      value={props.value}
      disabled={props.disabled}
      triggerClassName={props.triggerClassName}
      onValueChange={(value) => {
        if (value === ADD_ACCOUNT) { setError(null); setOpen(true); return; }
        props.onChange(value);
      }}
      options={[
        { value: "", label: "No account" },
        ...props.accounts.map((account) => ({ value: account.uuid, label: account.name })),
        { value: ADD_ACCOUNT, label: "+ Add account" },
      ]}
    />
    <AccountDialog
      open={open}
      title="Add account"
      description="Create an account that can be selected on transactions."
      pending={createMutation.isPending}
      error={error}
      onOpenChange={setOpen}
      onSubmit={create}
    />
  </>;
}
