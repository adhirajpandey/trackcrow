import { debugLog } from './debug-log';
export type SmsPermission = 'granted' | 'denied' | 'never_ask_again';
export type SmsPermissionDeps = {
  check: () => Promise<boolean>;
  request: () => Promise<SmsPermission>;
  readDecision: () => Promise<string | null>;
  writeDecision: (decision: string) => Promise<void>;
};

export function createSmsPermission(deps: SmsPermissionDeps) {
  let pending: Promise<SmsPermission> | null = null;
  let last: SmsPermission | null = null;
  function record(permission: SmsPermission) {
    if (permission !== last) debugLog.write('permission.changed', { permission });
    last = permission;
    return permission;
  }

  async function check(): Promise<SmsPermission> {
    if (await deps.check()) return record('granted');
    return record((await deps.readDecision()) === 'never_ask_again' ? 'never_ask_again' : 'denied');
  }

  async function request(automatic: boolean, retryBlocked: boolean): Promise<SmsPermission> {
    const permission = await check();
    if (permission === 'granted' || (permission === 'never_ask_again' && !retryBlocked)) return permission;
    if (automatic && (await deps.readDecision())) return permission;
    // Mark before opening the dialog; interruption must not prompt again at startup.
    await deps.writeDecision('denied');
    const result = await deps.request();
    await deps.writeDecision(result);
    return record(result);
  }

  return {
    check,
    request: (automatic = false, retryBlocked = false) => {
      if (pending) return pending;
      pending = request(automatic, retryBlocked).finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}
