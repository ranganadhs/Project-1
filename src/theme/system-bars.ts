import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { create } from 'zustand';

/**
 * Which status-bar content colour the CURRENT screen needs, if it needs one.
 *
 * ── WHY A STORE AND NOT A SECOND `<SystemBars>` ───────────────────────────
 * System chrome is GLOBAL state. Rendering a second `<SystemBars>` inside a
 * screen means two components racing to set one value, and they disagree by
 * construction: the root says "follow the theme", the screen says "light".
 *
 * The failure that causes is not on the screen you are looking at — it is on
 * the one you go BACK to. The screen-level instance mounts and unmounts with
 * navigation, so the symptom is the coloured screen looking correct and the
 * screen behind it being left with white icons on a light canvas, with the
 * clock invisible. That is precisely why a screenshot of the first screen
 * cannot catch it.
 *
 * So there is exactly ONE `<SystemBars>` in the app, in the root layout, and
 * screens DECLARE what they need instead of applying it. The root resolves
 * `override ?? theme` — a screen's declaration wins while it is focused, and
 * the theme takes over again the moment it is not.
 *
 * Trap 11 in full: `style` names the CONTENT colour and must be driven by the
 * theme rather than the OS, but "driven by" is not the same as "set by", and
 * only one thing should do the setting.
 */
type SystemBarsState = {
  /** `null` means "no screen is asking" — the root falls back to the theme. */
  override: 'light' | 'dark' | null;
  setOverride: (style: 'light' | 'dark' | null) => void;
};

export const useSystemBarsStore = create<SystemBarsState>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}));

/**
 * Declares the status-bar content colour for as long as this screen is focused.
 *
 * Reach for it when a screen paints its own full-bleed coloured region behind
 * the status bar — a brand-coloured hero, a photo header, a media player — so
 * the theme's default ink would be illegible on it.
 *
 * `useFocusEffect` rather than `useEffect`: the cleanup runs when the screen
 * loses focus, not only when it unmounts. A stack keeps screens mounted
 * underneath, so an unmount-based clear would leave the override in place while
 * the user is looking at something else entirely.
 *
 * Remember `style` names the CONTENT, not the background — a dark hero needs
 * `'light'`.
 *
 * Pass `null` for a screen that wants the THEME's default. That is not the same
 * as passing `'dark'`: hardcoding dark is right on a light canvas and wrong the
 * moment the user switches to the dark theme, where the canvas is dark and the
 * content has to be light. `null` says "I have no opinion", which is what a
 * screen sitting on the ordinary canvas actually means.
 */
export function useSystemBarsOverride(style: 'light' | 'dark' | null) {
  const setOverride = useSystemBarsStore((state) => state.setOverride);

  useFocusEffect(
    useCallback(() => {
      setOverride(style);
      return () => setOverride(null);
    }, [setOverride, style]),
  );
}
