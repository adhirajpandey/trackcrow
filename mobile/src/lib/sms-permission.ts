export type SmsPermission = 'granted' | 'denied' | 'never_ask_again';
export type SmsPermissionDeps = {
  check: () => Promise<boolean>;
  request: () => Promise<SmsPermission>;
  readDecision: () => Promise<string | null>;
  writeDecision: (decision: string) => Promise<void>;
};

export function createSmsPermission(deps: SmsPermissionDeps) {
  let pending: Promise<SmsPermission> | null = null;

  async function check(): Promise<SmsPermission> {
    if (await deps.check()) return 'granted';
    return (await deps.readDecision()) === 'never_ask_again' ? 'never_ask_again' : 'denied';
  }

  async function request(automatic: boolean): Promise<SmsPermission> {
    const permission = await check();
    if (permission === 'granted' || permission === 'never_ask_again') return permission;
    if (automatic && await deps.readDecision()) return permission;
    // Mark before opening the dialog; interruption must not prompt again at startup.
    await deps.writeDecision('denied');
    const result = await deps.request();
    await deps.writeDecision(result);
    return result;
  }

  return {
    check,
    request: (automatic = false) => {
      if (pending) return pending;
      pending = request(automatic).finally(() => { pending = null; });
      return pending;
    },
  };
}
