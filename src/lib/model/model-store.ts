import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import type { ModelId } from './types';

/**
 * Mirrors src/lib/auth/session-store.ts: the app plan repurposes the
 * boilerplate's (auth)/(app) structural guard as a first-run gate on model
 * readiness instead of sign-in. `hasModel` is what `(onboarding)` guards on —
 * see docs/app-plan.md.
 *
 * This is deliberately a SEPARATE store from session-store, not a reuse of
 * `src/lib/auth` — model readiness and account auth are different concerns
 * that happen to both gate navigation in this app.
 *
 * ── ACTIVE VS. DOWNLOADING ─────────────────────────────────────────────────
 * `activeModelId` is the model actually usable for inference right now.
 * `downloadingModelId` is a SEPARATE in-flight download — switching models
 * from Settings must not drop the student back to onboarding or interrupt
 * the model they can still use; the swap to `activeModelId` only happens once
 * the new download finishes. Model Setup (first run, no active model yet) is
 * just the case where `activeModelId` is null.
 */
type ModelState = {
  /** The model currently ready for inference, or null before the first download. */
  activeModelId: ModelId | null;
  /** True once a model has finished downloading and is ready for inference. */
  hasModel: boolean;
  isHydrated: boolean;
  /** The model a download is in flight for, or null when nothing is downloading. */
  downloadingModelId: ModelId | null;
  /** 0–1. Only meaningful while `downloadingModelId` is set. */
  downloadProgress: number;
  /** Starts (or restarts) a download for this model. Does not touch `activeModelId` yet. */
  startDownload: (id: ModelId) => void;
  setDownloadProgress: (progress: number) => void;
  /** Called when the on-device model fetch pipeline reports completion. */
  markDownloadComplete: () => void;
  /** Lets Model Setup/Settings cancel an in-flight download without switching. */
  cancelDownload: () => void;
  /** Drops back to no active model — only for a genuine "start over", not a switch. */
  reset: () => void;
};

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      activeModelId: null,
      hasModel: false,
      isHydrated: false,
      downloadingModelId: null,
      downloadProgress: 0,

      startDownload: (id) => set({ downloadingModelId: id, downloadProgress: 0 }),

      setDownloadProgress: (progress) => set({ downloadProgress: progress }),

      markDownloadComplete: () =>
        set((state) => ({
          activeModelId: state.downloadingModelId ?? state.activeModelId,
          hasModel: true,
          downloadingModelId: null,
          downloadProgress: 0,
        })),

      cancelDownload: () => set({ downloadingModelId: null, downloadProgress: 0 }),

      reset: () =>
        set({ activeModelId: null, hasModel: false, downloadingModelId: null, downloadProgress: 0 }),
    }),
    {
      name: 'model',
      storage: createJSONStorage(() => zustandStorage),
      // Runtime-only state is never persisted — resuming a cold start mid
      // download with no fetch task actually running is trap 7 territory
      // (same reasoning as session-store).
      partialize: (state) => ({
        activeModelId: state.activeModelId,
        hasModel: state.hasModel,
      }),
    },
  ),
);

if (useModelStore.persist.hasHydrated()) {
  useModelStore.setState({ isHydrated: true });
} else {
  useModelStore.persist.onFinishHydration(() => {
    useModelStore.setState({ isHydrated: true });
  });
}

export function useModelReady() {
  const hasModel = useModelStore((s) => s.hasModel);
  const isHydrated = useModelStore((s) => s.isHydrated);
  return { hasModel, isHydrated };
}
