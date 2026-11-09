import { recipientCreateTransition as transition, type RecipientCreateState } from "./recipient-create-state";

const editing: RecipientCreateState = { status: "editing", displayName: "Alice" };
const recipient = { uuid: "alice", displayName: "Alice" };

test("editing a conflicting name clears the previous recipient choice", () => {
  const pending = transition(editing, { type: "submit" });
  const conflict = transition(pending, { type: "conflict", recipient });
  expect(conflict).toEqual({ status: "conflict", displayName: "Alice", recipient });
  expect(transition(conflict, { type: "edit", displayName: "Bob" })).toEqual({ status: "editing", displayName: "Bob" });
});

test("a blank name cannot start a request and can be corrected", () => {
  const invalid = transition({ ...editing, displayName: "  " }, { type: "submit" });
  expect(invalid.status).toBe("error");
  expect(transition(invalid, { type: "edit", displayName: "Alice" })).toEqual(editing);
});

test("a submitted name stays stable until completion, and errors allow retry", () => {
  const pending = transition(editing, { type: "submit" });
  expect(transition(pending, { type: "submit" })).toBe(pending);
  expect(transition(pending, { type: "edit", displayName: "Bob" })).toBe(pending);
  const failed = transition(pending, { type: "fail", message: "Offline" });
  expect(failed).toEqual({ status: "error", displayName: "Alice", message: "Offline" });
  expect(transition(failed, { type: "submit" })).toEqual(pending);
});

test("completion events are ignored outside a pending submission", () => {
  expect(transition(editing, { type: "conflict", recipient })).toBe(editing);
  expect(transition(editing, { type: "fail", message: "Old request" })).toBe(editing);
});
