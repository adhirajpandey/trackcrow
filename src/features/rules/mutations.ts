"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiPatch, apiPost } from "@/lib/api/client";
import type { RuleDto, RuleMutationInput } from "./types";

export function useRuleMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["rules"] });
  return {
    create: useMutation({ mutationFn: (input: RuleMutationInput) => apiPost<RuleDto>("/api/rules", input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ ruleUuid, input }: { ruleUuid: string; input: Partial<RuleMutationInput> }) => apiPatch<RuleDto>(`/api/rules/${ruleUuid}`, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (ruleUuid: string) => apiDelete<{ uuid: string }>(`/api/rules/${ruleUuid}`), onSuccess: invalidate }),
  };
}
