import { light } from './light';
import { dark } from './dark';

/**
 * Theme names are load-bearing: Unistyles `adaptiveThemes: true` requires themes
 * named exactly `light` and `dark`, and is mutually exclusive with `initialTheme`.
 */
export const themes = { light, dark } as const;
export type { AppTheme } from './light';
export { light, dark };
