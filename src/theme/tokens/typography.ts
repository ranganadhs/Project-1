import type { TextStyle } from 'react-native';

/**
 * DEFAULT: the system font — SF Pro on iOS, Roboto on Android. React Native
 * resolves an undefined `fontFamily` to the platform font, which is why these
 * are undefined rather than a name. The system font needs no bundled asset, is
 * already on the device, and matches native chrome exactly.
 *
 * Numeric `fontWeight` IS reliable for system fonts on both platforms, so the
 * weights below work as-is with this default.
 *
 * ── TO USE A CUSTOM FAMILY ────────────────────────────────────────────────
 * Register ONE FAMILY PER WEIGHT and name them here:
 *
 *   regular: 'Inter-Regular', medium: 'Inter-Medium', …
 *
 * and load the matching keys with `useFonts` in the root layout. Do NOT keep a
 * single family and vary numeric `fontWeight` — custom fonts do not reliably
 * honour numeric weights on Android, which silently renders everything regular.
 */
export const fontFamily: Record<
  'regular' | 'medium' | 'semibold' | 'bold' | 'mono',
  string | undefined
> = {
  regular: undefined,
  medium: undefined,
  semibold: undefined,
  bold: undefined,
  /** Monospace, for code, IDs, and anything the user may need to compare. */
  mono: undefined,
};

export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 44,
  '5xl': 56,
} as const;

/**
 * React Native `lineHeight` is an ABSOLUTE pixel value, not a multiplier.
 * These are pre-computed as round(fontSize × ratio) — tighter ratios for
 * display sizes, looser for body copy where tracking the next line matters.
 */
export const lineHeight = {
  '2xs': 14,
  xs: 16,
  sm: 18,
  base: 22,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 34,
  '3xl': 38,
  '4xl': 46,
  '5xl': 58,
} as const;

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  /** For all-caps labels, which need air to stay legible. */
  wider: 0.8,
} as const;

/** Raw numeric weights. With a custom family, select by family instead. */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/**
 * OpenType features.
 *
 * `tabular` is the one people forget and then cannot explain: proportional
 * digits have different widths, so a live counter, a timer, or a column of
 * prices visibly jitters as the numbers change. Tabular figures lock every
 * digit to the same advance width and the jitter stops.
 */
export const fontVariant = {
  tabular: ['tabular-nums'],
  proportional: ['proportional-nums'],
  oldstyle: ['oldstyle-nums'],
  smallCaps: ['small-caps'],
} as const satisfies Record<string, TextStyle['fontVariant']>;

export const textTransform = {
  none: 'none',
  upper: 'uppercase',
  lower: 'lowercase',
  caps: 'capitalize',
} as const satisfies Record<string, TextStyle['textTransform']>;

export const textDecoration = {
  none: 'none',
  underline: 'underline',
  strike: 'line-through',
} as const satisfies Record<string, TextStyle['textDecorationLine']>;

/**
 * Vertical space between paragraphs of flowing text. Not a line height — this
 * is the gap BETWEEN blocks, and it should exceed the line height or the
 * paragraph break disappears.
 */
export const paragraphSpacing = {
  tight: 8,
  normal: 12,
  loose: 20,
} as const;
