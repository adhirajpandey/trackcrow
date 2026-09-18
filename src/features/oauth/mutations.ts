"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete } from "@/lib/api/client";
import { oauthQueryKey } from "./queries";
export function useRevokeConnectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) =>
      apiDelete<{ revoked: boolean }>(`/api/oauth/connections/${uuid}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: oauthQueryKey }),
  });
}
