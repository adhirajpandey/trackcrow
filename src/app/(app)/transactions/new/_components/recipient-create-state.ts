import type { RecipientCreateConflict } from "@/features/recipients/types";

type ExistingRecipient = RecipientCreateConflict["existingRecipient"];

export type RecipientCreateState = { displayName: string } & (
  | { status: "editing" }
  | { status: "submitting" }
  | { status: "conflict"; recipient: ExistingRecipient }
  | { status: "error"; message: string }
);

export type RecipientCreateEvent =
  | { type: "edit"; displayName: string }
  | { type: "submit" }
  | { type: "conflict"; recipient: ExistingRecipient }
  | { type: "fail"; message: string };

export function recipientCreateTransition(
  state: RecipientCreateState,
  event: RecipientCreateEvent,
): RecipientCreateState {
  switch (event.type) {
    case "edit":
      return state.status === "submitting" ? state : { status: "editing", displayName: event.displayName };
    case "submit":
      if (state.status === "submitting") return state;
      return state.displayName.trim()
        ? { status: "submitting", displayName: state.displayName }
        : { status: "error", displayName: state.displayName, message: "Recipient name is required" };
    case "conflict":
      return state.status === "submitting"
        ? { status: "conflict", displayName: state.displayName, recipient: event.recipient }
        : state;
    case "fail":
      return state.status === "submitting"
        ? { status: "error", displayName: state.displayName, message: event.message }
        : state;
  }
}
