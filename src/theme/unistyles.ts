import { StyleSheet } from 'react-native-unistyles';
import { themes, type AppTheme } from './themes';
import { breakpoint } from './tokens/layout';

// Breakpoints are a TOKEN (tokens/layout.ts) so layout maths can reference the
// same numbers the media queries use, rather than two lists drifting apart.
export const breakpoints = breakpoint;

type AppBreakpoints = typeof breakpoint;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes {
    light: AppTheme;
    dark: AppTheme;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes,
  breakpoints,
  settings: {
    // Follows the OS colour scheme. MUTUALLY EXCLUSIVE with `initialTheme` —
    // passing both throws at configure time. Requires the themes to be named
    // exactly `light` and `dark`, which is why src/theme/themes/index.ts
    // registers them under those keys.
    adaptiveThemes: true,
  },
});
