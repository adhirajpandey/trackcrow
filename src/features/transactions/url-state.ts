"use client";

export type TransactionsHistoryMode = "push" | "replace";

export function updateTransactionsUrl(nextHref: string, mode: TransactionsHistoryMode) {
  const currentHref = `${window.location.pathname}${window.location.search}`;
  if (nextHref === currentHref) {
    return;
  }

  if (mode === "push") {
    window.history.pushState(null, "", nextHref);
    return;
  }

  window.history.replaceState(null, "", nextHref);
}
