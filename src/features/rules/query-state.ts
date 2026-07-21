import type { RulesQuery, RuleStatus } from "./types";

export function getRulesQuery(params: Record<string, string | string[] | undefined>): RulesQuery {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const page = Number(first(params.page));
  const size = Number(first(params.size));
  const status = first(params.status);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(size) && size > 0 ? Math.min(size, 100) : 20,
    q: first(params.q)?.trim() ?? "",
    ...(status === "enabled" || status === "disabled" || status === "needsRepair"
      ? { status: status as RuleStatus }
      : {}),
  };
}

export function buildRulesSearchParams(query: RulesQuery) {
  const params = new URLSearchParams({ page: String(query.page), size: String(query.pageSize) });
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  return params;
}
