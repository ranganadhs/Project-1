import { persistedSlice } from './session-store';
import type { Session } from './types';

/**
 * What reaches MMKV is the biometric feature's security property, and a
 * regression here is SILENT: the app keeps working, the toggle still reads
 * "on", and the gate simply stops protecting anything. Nothing else can catch
 * that — it is not a type error, not a lint error, and not visible on screen.
 */
const SESSION: Session = { token: 'secret-token', user: { id: 'u1', name: 'Test' } };

describe('persistedSlice', () => {
  it('writes the session to storage when biometric login is off', () => {
    expect(persistedSlice({ session: SESSION, biometricEnabled: false })).toEqual({
      biometricEnabled: false,
      session: SESSION,
    });
  });

  /**
   * The one that matters. With biometric ON the session lives in the OS
   * keychain behind `requireAuthentication`; writing it here as well would
   * leave the token readable by anything that can read MMKV, making the gate
   * decorative.
   */
  it('omits the session entirely when biometric login is on', () => {
    const persisted = persistedSlice({ session: SESSION, biometricEnabled: true });

    expect(persisted).toEqual({ biometricEnabled: true });
    // Absent, not null — a `session: null` key would still be a write, and the
    // assertion above alone would not tell the two apart.
    expect('session' in persisted).toBe(false);
  });

  /**
   * The preference persists unconditionally. Without it a cold start cannot
   * tell "no session because biometric is on" from "no session because they
   * signed out", and shows sign-in with no unlock affordance.
   */
  it('always persists the preference, with or without a session', () => {
    expect(persistedSlice({ session: null, biometricEnabled: true }).biometricEnabled).toBe(true);
    expect(persistedSlice({ session: null, biometricEnabled: false }).biometricEnabled).toBe(false);
  });

  it('never persists runtime state', () => {
    const persisted = persistedSlice({ session: SESSION, biometricEnabled: false });
    // isHydrated is derived at startup; restoring it would make a cold start
    // read as already-hydrated (trap 7).
    expect('isHydrated' in persisted).toBe(false);
  });
});
