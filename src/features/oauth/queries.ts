"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { OAuthConnectionDto } from "./types";
export const oauthQueryKey = ["oauth-connections"] as const;
export function useConnectionsQuery() {
  return useQuery({
    queryKey: oauthQueryKey,
    queryFn: () => apiGet<OAuthConnectionDto[]>("/api/oauth/connections"),
  });
}
