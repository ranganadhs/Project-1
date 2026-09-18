import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { ADAPTERS } from './adapters';
import type { PermissionKey, PermissionState } from './types';

type PermissionStore = {
  /**
   * Live OS state. NOT persisted — the user can change any of this in Settings
   * while the app is closed, so a cached value is a lie waiting to be believed.
   */
  states: Partial<Record<PermissionKey, PermissionState>>;

  /**
   * Whether the app has ever shown the OS prompt for a key. PERSISTED, because
   * the OS gives you no way to ask.
   *
   * This is what separates "never asked" from "asked and refused" once
   * `canAskAgain` has gone false — the two look identical in the OS response on
   * some platforms, and they need completely different UI: a rationale for the
   * first, a route to Settings for the second.
   */
  hasAsked: Partial<Record<PermissionKey, boolean>>;

  /** Keys with a check or request in flight, so UI can disable its buttons. */
  pending: Partial<Record<PermissionKey, boolean>>;

  check: (key: PermissionKey) => Promise<PermissionState>;
  request: (key: PermissionKey) => Promise<PermissionState>;
  checkAll: () => Promise<void>;
};

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set, get) => ({
      states: {},
      hasAsked: {},
      pending: {},

      check: async (key) => {
        const adapter = ADAPTERS[key];
        set((s) => ({ pending: { ...s.pending, [key]: true } }));
        try {
          const state = await adapter.check();
          set((s) => ({ states: { ...s.states, [key]: state } }));
          return state;
        } finally {
          set((s) => ({ pending: { ...s.pending, [key]: false } }));
        }
      },

      request: async (key) => {
        const adapter = ADAPTERS[key];
        set((s) => ({ pending: { ...s.pending, [key]: true } }));
        try {
          const state = await adapter.request();
          set((s) => ({
            states: { ...s.states, [key]: state },
            // Record the attempt even when it fails or the OS silently refuses
            // to prompt — the fact that we tried is what later UI branches on.
            hasAsked: { ...s.hasAsked, [key]: true },
          }));
          return state;
        } finally {
          set((s) => ({ pending: { ...s.pending, [key]: false } }));
        }
      },

      checkAll: async () => {
        const keys = Object.keys(ADAPTERS) as PermissionKey[];
        const results = await Promise.all(
          keys.map(async (key) => [key, await ADAPTERS[key].check()] as const),
        );
        set({ states: Object.fromEntries(results) as Partial<Record<PermissionKey, PermissionState>> });
      },
    }),
    {
      name: 'permissions',
      storage: createJSONStorage(() => zustandStorage),
      // ONLY the ask-history persists. Persisting `states` would mean a user who
      // revoked camera access in Settings still sees the app believing it is
      // granted until something re-checks.
      partialize: (state) => ({ hasAsked: state.hasAsked }),
    },
  ),
);
