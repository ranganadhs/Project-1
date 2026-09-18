import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import { zustandStorage } from '@/lib/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Applies a mode to the Unistyles runtime.
 *
 * `adaptiveThemes` and an explicit theme are mutually exclusive: adaptive mode
 * hands theme selection to the OS, so it must be turned OFF before a manual
 * `setTheme` will hold. Setting them in the wrong order silently leaves the app
 * following the system.
 */
function applyMode(mode: ThemeMode): void {
  if (mode === 'system') {
    UnistylesRuntime.setAdaptiveThemes(true);
    return;
  }
  UnistylesRuntime.setAdaptiveThemes(false);
  UnistylesRuntime.setTheme(mode);
}

type ThemeModeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeModeStore = create<ThemeModeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => {
        applyMode(mode);
        set({ mode });
      },
    }),
    {
      name: 'theme-mode',
      storage: createJSONStorage(() => zustandStorage),
      // Re-apply the stored preference on launch. Without this the runtime
      // keeps the adaptiveThemes default from StyleSheet.configure and a user
      // who chose "Dark" would be back on the system setting after a restart.
      onRehydrateStorage: () => (state) => {
        if (state) applyMode(state.mode);
      },
    },
  ),
);

/**
 * MMKV is synchronous, so rehydration finishes inside `create` — before the
 * `onRehydrateStorage` callback above could be registered by a later listener.
 * Apply once more here to cover that path.
 */
if (useThemeModeStore.persist.hasHydrated()) {
  applyMode(useThemeModeStore.getState().mode);
}

/** Reactive theme-mode control. */
export function useThemeMode() {
  const mode = useThemeModeStore((state) => state.mode);
  const setMode = useThemeModeStore((state) => state.setMode);
  // `rt` from useUnistyles is the REACTIVE runtime. Reading
  // UnistylesRuntime.themeName directly here would return the right value once
  // and never re-render when the OS scheme flips under 'system'.
  const { rt } = useUnistyles();
  const resolved = rt.themeName ?? 'light';

  return {
    /** The user's preference: 'light' | 'dark' | 'system'. */
    mode,
    setMode,
    /** The theme actually in effect right now — resolves 'system'. */
    resolved,
    isDark: resolved === 'dark',
  };
}
