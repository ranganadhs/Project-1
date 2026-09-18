import * as LocalAuthentication from 'expo-local-authentication';
import { clearSession, readSession, writeSession } from './biometric-vault';
import { useSessionStore } from './session-store';

/**
 * Biometric login — the prompting half.
 *
 * ⚠️ `expo-local-authentication` IS A NATIVE MODULE. Importing this file pulls
 * it in, and it will crash any binary built before it was installed. Nothing
 * that mounts at startup may import this module; `session-store` deliberately
 * imports `biometric-vault` instead, which uses only `expo-secure-store`. A
 * settings row is the intended entry point.
 *
 * ── WHAT THIS FEATURE ACTUALLY DOES ───────────────────────────────────────
 * It moves the session token OUT of MMKV and into the OS keychain behind a
 * biometric gate. It is NOT a lock screen: a lock screen drawn in React still
 * leaves the token sitting in storage for anything that can read it, which
 * would make "Biometric Login" a claim the implementation does not honour.
 *
 * With it ON, a cold start finds NO session, the `Stack.Protected` guard shows
 * sign-in, and sign-in offers "Unlock with Face ID". That is the whole
 * navigation mechanism — there is no lock route and no `router.replace`,
 * because the session flipping IS the navigation.
 */

export type BiometricCapability =
  /** No sensor. The row must not render at all. */
  | { kind: 'unavailable' }
  /** Sensor present, nothing enrolled. Row renders, toggle disabled. */
  | { kind: 'not-enrolled'; label: string }
  | { kind: 'ready'; label: string };

/**
 * What to call it in the UI. iOS users know "Face ID" and "Touch ID" by name,
 * and a prompt that says "Biometrics" reads as a different, less trustworthy
 * app than the one they installed.
 */
function labelFor(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'Iris';
  return 'Biometrics';
}

/**
 * Hardware AND enrolment, separately.
 *
 * They are different answers with different remedies, and collapsing them is a
 * real bug: a device with a sensor but no enrolled face would otherwise show an
 * enabled toggle that silently fails, because `authenticateAsync` returns an
 * error rather than prompting.
 */
export async function checkCapability(): Promise<BiometricCapability> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  if (!hasHardware) return { kind: 'unavailable' };
  const label = labelFor(types);
  return isEnrolled ? { kind: 'ready', label } : { kind: 'not-enrolled', label };
}

/**
 * Prompt, and report whether it passed.
 *
 * `disableDeviceFallback` is left OFF on purpose. The keychain entry is written
 * with `requireAuthentication`, which the OS already satisfies with a device
 * passcode, so refusing the passcode here would only desynchronise our prompt
 * from the one guarding the value — and it would lock a user out of their own
 * session over a failed face match with no way back. A device passcode is the
 * same trust level as unlocking the phone, which is the bar this feature is
 * actually setting.
 */
export async function prompt(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
  });
  return result.success;
}

export type EnableResult = 'enabled' | 'cancelled' | 'no-session' | 'failed';

/**
 * Turn biometric login ON.
 *
 * The order is the security property, not a style choice:
 *   1. PROMPT FIRST. Proving the user can pass the gate before it becomes the
 *      only way in. Enabling without this can lock someone out of their own
 *      account on the next cold start.
 *   2. Write to the keychain, and only then set the flag.
 *   3. Setting the flag re-partializes the persisted state, which drops the
 *      token from MMKV.
 *
 * If step 2 fails the flag is never set, so the token stays in MMKV and the
 * user is exactly where they started. There is no window in which the token is
 * in neither place.
 */
export async function enable(reason: string): Promise<EnableResult> {
  const { session } = useSessionStore.getState();
  if (!session) return 'no-session';

  if (!(await prompt(reason))) return 'cancelled';

  try {
    await writeSession(session);
  } catch {
    return 'failed';
  }

  // Last. This is what stops MMKV persisting the token — see `persistedSlice`.
  useSessionStore.getState().setBiometricEnabled(true);
  return 'enabled';
}

export type DisableResult = 'disabled' | 'cancelled' | 'no-session';

/**
 * Turn biometric login OFF.
 *
 * Also gated, and for a reason that is easy to miss: without it, anyone holding
 * the unlocked phone could switch the protection off. Clearing the flag first
 * is deliberate — it re-partializes, so the in-memory session is written back
 * to MMKV before the keychain copy is removed. Doing it the other way round
 * leaves a window where the token exists nowhere and a crash signs the user out.
 */
export async function disable(reason: string): Promise<DisableResult> {
  /*
   * SYMMETRIC WITH `enable`, and the asymmetry it fixes destroys sessions.
   *
   * Without this guard: clearing the flag re-partializes and writes the
   * in-memory session to MMKV — which, if it is null, persists `session: null`
   * — and then the keychain copy is deleted. The token is gone from BOTH places
   * and the user is permanently signed out with nothing to recover from.
   *
   * Not reachable while the only entry point sits behind `Stack.Protected`, so
   * the toggle renders only where a session exists. It becomes reachable the
   * moment anything opens that screen on a different path — a settings deep
   * link, a notification — and the resulting bug is unreproducible from a
   * report.
   */
  if (!useSessionStore.getState().session) return 'no-session';

  if (!(await prompt(reason))) return 'cancelled';

  useSessionStore.getState().setBiometricEnabled(false);
  await clearSession();
  return 'disabled';
}

export type UnlockResult = 'unlocked' | 'cancelled' | 'expired';

/**
 * The sign-in screen's "Unlock with Face ID" path.
 *
 * `expired` covers a case worth knowing about: adding or removing a fingerprint
 * or face invalidates the keychain entry, by design, on both platforms. That is
 * not an error to apologise for and not a dead end — it means the stored
 * session is gone and the user signs in with their password, which the sign-in
 * screen is already showing.
 */
export async function unlock(): Promise<UnlockResult> {
  const result = await readSession();

  switch (result.status) {
    case 'ok':
      // Restores the session, which flips `Stack.Protected` and navigates.
      useSessionStore.getState().restoreSession(result.session);
      return 'unlocked';
    case 'denied':
      return 'cancelled';
    case 'empty':
    case 'invalidated':
      // Nothing recoverable is stored. Clear the flag so the app stops offering
      // an unlock that cannot succeed.
      useSessionStore.getState().setBiometricEnabled(false);
      await clearSession();
      return 'expired';
  }
}
