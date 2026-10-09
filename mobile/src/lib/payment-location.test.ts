import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPaymentLocation, paymentLocationState, type LocationAccess } from './payment-location';

test('maps the preference and Android access to the visible state', () => {
  assert.equal(paymentLocationState(false, { foreground: true, background: true }), 'off');
  assert.equal(paymentLocationState(true, { foreground: true, background: true }), 'on');
  assert.equal(paymentLocationState(true, { foreground: true, background: false }), 'needs_background');
  assert.equal(paymentLocationState(true, { foreground: false, background: false }), 'blocked');
});

function fixture(access: LocationAccess = { foreground: false, background: false }) {
  let enabled = false;
  const calls: string[] = [];
  const location = createPaymentLocation({
    readEnabled: async () => enabled,
    writeEnabled: async (value) => { enabled = value; calls.push(`write:${value}`); },
    checkAccess: async () => ({ ...access }),
    requestForeground: async () => { calls.push('foreground'); access.foreground = true; return true; },
    requestBackground: async () => { calls.push('background'); access.background = true; return 'granted'; },
    clearQueuedLocations: async () => { calls.push('clear'); },
  });
  return { location, calls, access };
}

test('turning on asks for foreground access only; background is a separate step', async () => {
  const f = fixture();
  assert.equal(await f.location.enable(), 'needs_background');
  assert.deepEqual(f.calls, ['write:true', 'foreground']);
  assert.equal(await f.location.requestBackground(), true);
  assert.equal(f.location.getSnapshot().state, 'on');
});

test('turning on with access already granted does not prompt', async () => {
  const f = fixture({ foreground: true, background: true });
  assert.equal(await f.location.enable(), 'on');
  assert.deepEqual(f.calls, ['write:true']);
});

test('turning off keeps Android permission but stops capture and clears queued locations', async () => {
  const f = fixture({ foreground: true, background: true });
  await f.location.enable();
  assert.equal(await f.location.disable(), 'off');
  assert.deepEqual(f.calls, ['write:true', 'write:false', 'clear']);
  assert.equal(f.location.getSnapshot().enabled, false);
});

test('revoking access in Android settings shows on the next refresh', async () => {
  const f = fixture({ foreground: true, background: true });
  await f.location.enable();
  f.access.foreground = false;
  f.access.background = false;
  assert.equal(await f.location.refresh(), 'blocked');
});

test('reports when Android will no longer prompt for background access', async () => {
  const location = createPaymentLocation({
    readEnabled: async () => true,
    writeEnabled: async () => undefined,
    checkAccess: async () => ({ foreground: true, background: false }),
    requestForeground: async () => true,
    requestBackground: async () => 'never_ask_again',
    clearQueuedLocations: async () => undefined,
  });
  assert.equal(await location.requestBackground(), false);
  assert.equal(location.getSnapshot().state, 'needs_background');
});
