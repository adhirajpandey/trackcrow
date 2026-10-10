import { debugLog } from './debug-log';

export type PaymentLocationState = 'off' | 'on' | 'needs_background' | 'blocked';
export type LocationAccess = { foreground: boolean; background: boolean };
export type PaymentLocationSnapshot = { ready: boolean; enabled: boolean; state: PaymentLocationState };
export type PaymentLocationDeps = {
  readEnabled: () => Promise<boolean>;
  writeEnabled: (enabled: boolean) => Promise<void>;
  checkAccess: () => Promise<LocationAccess>;
  requestForeground: () => Promise<boolean>;
  requestBackground: () => Promise<'granted' | 'denied' | 'never_ask_again'>;
  clearQueuedLocations: () => Promise<void>;
};

/** The in-app switch wins: Off never captures, even with Android permission granted. */
export function paymentLocationState(enabled: boolean, access: LocationAccess): PaymentLocationState {
  if (!enabled) return 'off';
  if (!access.foreground) return 'blocked';
  return access.background ? 'on' : 'needs_background';
}

export function createPaymentLocation(deps: PaymentLocationDeps) {
  let snapshot: PaymentLocationSnapshot = { ready: false, enabled: false, state: 'off' };
  const listeners = new Set<() => void>();

  function publish(enabled: boolean, access: LocationAccess) {
    const state = paymentLocationState(enabled, access);
    if (state !== snapshot.state || !snapshot.ready) debugLog.write('location.changed', { location: state });
    snapshot = { ready: true, enabled, state };
    listeners.forEach((listener) => listener());
    return state;
  }

  async function refresh() {
    const [enabled, access] = await Promise.all([deps.readEnabled(), deps.checkAccess()]);
    return publish(enabled, access);
  }

  return {
    refresh,
    isEnabled: () => deps.readEnabled(),
    /** Saves the preference, then asks for foreground location. Background is a separate, explained step. */
    async enable() {
      await deps.writeEnabled(true);
      const access = await deps.checkAccess();
      if (!access.foreground) await deps.requestForeground();
      return refresh();
    },
    /** Returns false when Android will not show a prompt, so the caller can open app settings. */
    async requestBackground() {
      const result = await deps.requestBackground();
      await refresh();
      return result !== 'never_ask_again';
    },
    async disable() {
      await deps.writeEnabled(false);
      publish(false, { foreground: false, background: false });
      await deps.clearQueuedLocations();
      return refresh();
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
