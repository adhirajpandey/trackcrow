import { router } from 'expo-router';

/** Opens the rule editor; `new` creates a rule, optionally for `recipientUuid`. */
export function openRule(id: string, params: Record<string, string> = {}) {
  router.push({ pathname: '/rules/[id]', params: { id, ...params } });
}
