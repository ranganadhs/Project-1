import { useCallback, useEffect } from 'react';
import { AppState, Linking, type AppStateStatus } from 'react-native';
import { usePermissionStore } from './store';
import { ADAPTERS } from './adapters';
import type { PermissionKey, PermissionState } from './types';

const UNKNOWN: PermissionState = { status: 'undetermined', granted: false, canAskAgain: true };

export type UsePermissionResult = {
  status: PermissionState['status'];
  granted: boolean;
  /** iOS photos: granted, but only for a user-picked subset. */
  limited: boolean;
  /** Refused permanently. request() will do nothing — send the user to Settings. */
  blocked: boolean;
  canAskAgain: boolean;
  /** Not supported on this platform at all. */
  unavailable: boolean;
  /** Has the OS prompt ever been shown? Survives restarts. */
  hasAsked: boolean;
  isPending: boolean;
  label: string;
  rationale: string;
  check: () => Promise<PermissionState>;
  request: () => Promise<PermissionState>;
  /** Deep-link to this app's page in system Settings. */
  openSettings: () => Promise<void>;
};

/**
 * Reusable access to one permission.
 *
 * Re-checks whenever the app returns to the foreground. This matters more than
 * it looks: the user can grant or revoke ANY permission in Settings while the
 * app is backgrounded, and the OS never notifies you. Without this the UI keeps
 * showing a stale answer — most visibly right after you send someone to
 * Settings to fix a blocked permission, which is exactly when being wrong is
 * most confusing.
 */
export function usePermission(key: PermissionKey): UsePermissionResult {
  const state = usePermissionStore((s) => s.states[key]) ?? UNKNOWN;
  const hasAsked = usePermissionStore((s) => s.hasAsked[key]) ?? false;
  const isPending = usePermissionStore((s) => s.pending[key]) ?? false;
  const checkFn = usePermissionStore((s) => s.check);
  const requestFn = usePermissionStore((s) => s.request);

  const adapter = ADAPTERS[key];
  const check = useCallback(() => checkFn(key), [checkFn, key]);
  const request = useCallback(() => requestFn(key), [requestFn, key]);

  useEffect(() => {
    void check();

    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') void check();
    });
    return () => subscription.remove();
  }, [check]);

  return {
    status: state.status,
    granted: state.granted,
    limited: state.status === 'limited',
    blocked: state.status === 'blocked',
    canAskAgain: state.canAskAgain,
    unavailable: state.status === 'unavailable',
    hasAsked,
    isPending,
    label: adapter.label,
    rationale: adapter.rationale,
    check,
    request,
    openSettings: () => Linking.openSettings(),
  };
}

/**
 * Request a permission, falling through to Settings when it is blocked.
 *
 * The single most common permission bug is calling request() on a blocked
 * permission: it resolves immediately with no OS prompt, so the button appears
 * dead. This helper routes that case to Settings instead, and reports which
 * path it took so the caller can explain what just happened.
 */
export function useRequestOrSettings(key: PermissionKey) {
  const { granted, blocked, request, openSettings } = usePermission(key);

  return useCallback(async (): Promise<'granted' | 'prompted' | 'opened-settings'> => {
    if (granted) return 'granted';
    if (blocked) {
      await openSettings();
      return 'opened-settings';
    }
    const result = await request();
    if (result.granted) return 'granted';
    // Newly blocked by this very attempt — hand off rather than leave a dead end.
    if (result.status === 'blocked') {
      await openSettings();
      return 'opened-settings';
    }
    return 'prompted';
  }, [granted, blocked, request, openSettings]);
}
