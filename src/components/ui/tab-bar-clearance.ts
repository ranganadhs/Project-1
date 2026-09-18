import { createContext } from 'react';

/**
 * Extra bottom clearance for chrome the safe-area inset does not describe.
 *
 * The iOS 26 tab bar is a floating pill that content passes BENEATH, and
 * `useSafeAreaInsets().bottom` only describes the home indicator. A screen
 * inside the tabs therefore needs the bar's height on top of the inset, and a
 * screen outside them needs none — which is exactly what a context expresses
 * and a token cannot: the value depends on where the screen is mounted, not on
 * what it is.
 *
 * ── WHY THIS IS ITS OWN FILE, AND MUST STAY ONE ───────────────────────────
 * It lives here rather than in `screen.tsx` because `AppTabs` provides it, and
 * `AppTabs` is reached from a ROUTE module — `src/app/(app)/(tabs)/_layout.tsx`.
 *
 * Anything a route module can reach at import time is evaluated before the root
 * layout runs, and `screen.tsx` — like every styled component — calls
 * `StyleSheet.create((theme) => …)` at MODULE SCOPE. Reaching one of those
 * before `StyleSheet.configure()` throws "no theme has been selected yet" and
 * white-screens the whole app.
 *
 * The trap is one import statement away. `app-tabs` imports `IconName` from
 * the `components/ui` barrel as a TYPE-ONLY import, which is erased at compile
 * time and costs nothing at runtime. Adding a value — this context — to that
 * same import statement turns it into a VALUE import, which drags the entire
 * barrel, and `text.tsx`'s module-scope stylesheet, into the tabs route's
 * import graph. Typecheck, lint and the bundler all pass; the app redboxes on
 * launch.
 *
 * So: this module imports `react` and nothing else. Keep it that way. If it
 * ever needs a theme value, take the value as an argument instead of importing
 * the theme here.
 *
 * See `Screen` for what consumes it and `AppTabs` for what provides it.
 */
export const TabBarClearanceContext = createContext(0);
