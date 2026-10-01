type RecipientFields = { name: string; note: string };
type RecipientFormSource = { displayName: string; note: string | null; updatedAt: string };
export type RecipientForm = {
  draft: RecipientFields;
  saved: RecipientFields;
  updatedAt: string;
};
export function recipientForm(recipient: RecipientFormSource): RecipientForm {
  const saved = { name: recipient.displayName, note: recipient.note ?? '' };
  return { draft: { ...saved }, saved, updatedAt: recipient.updatedAt };
}
/** Refresh untouched fields while preserving edits against the previous saved values. */
export function reconcileRecipientForm(form: RecipientForm, recipient: RecipientFormSource): RecipientForm {
  if (form.updatedAt === recipient.updatedAt) return form;
  const fresh = recipientForm(recipient);
  return {
    ...fresh,
    draft: {
      name: form.draft.name === form.saved.name ? fresh.saved.name : form.draft.name,
      note: form.draft.note === form.saved.note ? fresh.saved.note : form.draft.note,
    },
  };
}
