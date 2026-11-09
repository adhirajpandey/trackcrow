/** @jest-environment jsdom */

import { act, createElement, Fragment, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useCreateRecipientMutation } from "@/features/recipients/mutations";
import { ApiClientError } from "@/lib/api/client";

import { CreateRecipientDialog } from "./create-recipient-dialog";

jest.mock("@/features/recipients/mutations", () => ({
  useCreateRecipientMutation: jest.fn(),
}));

const useMutation = jest.mocked(useCreateRecipientMutation);
const alice = { uuid: "alice", displayName: "Alice" };
const bob = { uuid: "bob", displayName: "Bob" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function button(label: string) {
  const match = Array.from(document.querySelectorAll("button"))
    .find((element) => element.textContent?.trim() === label);
  if (!match) throw new Error(`Button not found: ${label}`);
  return match;
}

async function submit() {
  const form = document.querySelector("form");
  if (!form) throw new Error("Recipient form not found");
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

let root: Root;
let container: HTMLDivElement;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

for (const dismissal of ["Cancel", "Close"]) {
  test.each(["success", "conflict", "failure"] as const)(
    `a late %s after ${dismissal} cannot select a recipient or change the reopened dialog`,
    async (outcome) => {
      const original = deferred<typeof alice>();
      const reopened = deferred<typeof bob>();
      const mutateAsync = jest.fn()
        .mockReturnValueOnce(original.promise)
        .mockReturnValueOnce(reopened.promise);
      useMutation.mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useCreateRecipientMutation>);
      const onSelect = jest.fn();
      const onOpenChange = jest.fn();

      // Match RecipientPicker's conditional mounting: dismissing removes the old
      // dialog, and reopening creates a new draft even while its request is pending.
      function Picker() {
        const [open, setOpen] = useState(true);
        const [name, setName] = useState("Alice");
        return createElement(Fragment, null,
          createElement("button", { onClick: () => { setName("Bob"); setOpen(true); } }, "Reopen"),
          open ? createElement(CreateRecipientDialog, {
            open,
            suggestedName: name,
            onSelect,
            onOpenChange: (next: boolean) => { onOpenChange(next); setOpen(next); },
          }) : null,
        );
      }

      await act(async () => root.render(createElement(Picker)));
      await submit();
      expect(mutateAsync).toHaveBeenNthCalledWith(1, { displayName: "Alice" });
      await act(async () => button(dismissal).click());
      expect(document.querySelector("form")).toBeNull();
      await act(async () => button("Reopen").click());
      await submit();
      expect(mutateAsync).toHaveBeenNthCalledWith(2, { displayName: "Bob" });
      onOpenChange.mockClear();

      await act(async () => {
        if (outcome === "success") original.resolve(alice);
        else if (outcome === "conflict") original.reject(new ApiClientError(409, "Already exists", {
          details: { existingRecipient: alice },
        }));
        else original.reject(new Error("Old request failed"));
        await original.promise.catch(() => undefined);
      });

      expect(onSelect).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(document.querySelector<HTMLInputElement>('input[name="displayName"]')?.value).toBe("Bob");
      expect(button("Creating…").disabled).toBe(true);
      expect(document.querySelector('[role="alert"]')).toBeNull();
      expect(document.body.textContent).not.toContain("A matching recipient exists");

      // The new request still works after the old one completes.
      await act(async () => { reopened.resolve(bob); await reopened.promise; });
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(bob);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(document.querySelector("form")).toBeNull();
    },
  );
}
