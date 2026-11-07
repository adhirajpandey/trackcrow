"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { toast } from "@/components/ui/sonner";
import { ApiClientError, apiDelete, apiPatch, apiPost } from "@/lib/api/client";
import type { RuleDto } from "@/features/rules/types";
import { transactionsQueryKeys } from "@/features/transactions/query-keys";

import { dashboardQueryKeys } from "./query-keys";

export type CategoryChoice = {
  categoryUuid: string;
  subcategoryUuid: string | null;
  label: string;
};

export type CategorizeTarget = {
  uuid: string;
  categoryUuid: string | null;
  subcategoryUuid: string | null;
};

export type CategorizeRequest = {
  transactions: CategorizeTarget[];
  choice: CategoryChoice;
  /** Human description for the toast, such as "13 transactions to Anubhav Chaudhary". */
  description: string;
  /** Also save a rule so future imports from this recipient get the same category. */
  rule?: { recipientUuid: string; recipient: string } | null;
};

const CONCURRENCY = 4;

async function runInBatches<T>(items: T[], run: (item: T) => Promise<unknown>) {
  const failures: T[] = [];
  for (let index = 0; index < items.length; index += CONCURRENCY) {
    const results = await Promise.allSettled(items.slice(index, index + CONCURRENCY).map(run));
    results.forEach((result, offset) => {
      if (result.status === "rejected") failures.push(items[index + offset]);
    });
  }
  return failures;
}

function setCategory(target: { uuid: string }, categoryUuid: string | null, subcategoryUuid: string | null) {
  return apiPatch(`/api/transactions/${target.uuid}/category`, { categoryUuid, subcategoryUuid });
}

/** Categorizes one or many transactions from the dashboard, with Undo and an optional rule. */
export function useDashboardCategorize() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["rules"] }),
    ]);
    router.refresh();
  }, [queryClient, router]);

  const categorize = useCallback(
    async (request: CategorizeRequest) => {
      setPending(true);
      try {
        const failures = await runInBatches(request.transactions, (target) =>
          setCategory(target, request.choice.categoryUuid, request.choice.subcategoryUuid)
        );
        const updated = request.transactions.filter((target) => !failures.includes(target));

        let rule: RuleDto | null = null;
        let ruleMessage = "";
        if (request.rule && updated.length) {
          try {
            rule = await apiPost<RuleDto>("/api/rules", {
              name: `${request.rule.recipient} → ${request.choice.label}`.slice(0, 100),
              isEnabled: true,
              conditions: { recipient: { equals: request.rule.recipientUuid } },
              action: { categoryUuid: request.choice.categoryUuid, subcategoryUuid: request.choice.subcategoryUuid },
            });
            ruleMessage = " Future payments will follow a new rule.";
          } catch (error) {
            ruleMessage =
              error instanceof ApiClientError && error.status === 409
                ? " No rule saved: one already exists for this recipient."
                : " The rule couldn’t be saved.";
          }
        }

        await refresh();

        if (!updated.length) {
          toast({ tone: "error", title: "Category not changed", description: "Something went wrong. Try again." });
          return;
        }

        const undo = async () => {
          const restoreFailures = await runInBatches(updated, (target) => setCategory(target, target.categoryUuid, target.subcategoryUuid));
          const ruleRemoved = rule ? await apiDelete(`/api/rules/${rule.uuid}`).then(() => true, () => false) : true;
          await refresh();

          const problems = [
            restoreFailures.length ? `${restoreFailures.length} of ${updated.length} couldn’t be restored` : null,
            ruleRemoved ? null : "the new rule is still active; delete it in Rules",
          ].filter((problem): problem is string => Boolean(problem));
          if (problems.length) {
            toast({ tone: "error", title: "Undo incomplete", description: `${problems.join("; ")}.`.replace(/^./, (letter) => letter.toUpperCase()) });
            return;
          }
          toast({ tone: "info", title: "Change undone", description: `${request.description} restored.` });
        };

        toast({
          tone: failures.length ? "warning" : "success",
          title: `Set to ${request.choice.label}`,
          description: failures.length
            ? `${updated.length} of ${request.transactions.length} updated; ${failures.length} failed.${ruleMessage}`
            : `${request.description} updated.${ruleMessage}`,
          actionLabel: "Undo",
          onAction: () => void undo(),
          durationMs: 6000,
        });
      } finally {
        setPending(false);
      }
    },
    [refresh]
  );

  return { categorize, pending };
}
