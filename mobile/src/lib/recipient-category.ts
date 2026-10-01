export function canApplyRecipientCategory(
  transaction: { recipientUuid: string; categoryUuid: string | null },
  recipientUuid: string,
) {
  return transaction.recipientUuid === recipientUuid && transaction.categoryUuid === null;
}
