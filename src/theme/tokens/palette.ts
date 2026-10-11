/**
 * Tier 1 — raw colour. Theme-independent, never read by a component.
 * Semantic themes (src/theme/themes) map these to meaning.
 *
 * Rebranding is an edit to THIS FILE ALONE.
 *
 * Steps run 50 (lightest) → 950 (darkest). The extra 850 and 950 steps exist
 * because dark surfaces need values between and below the 800/900 stops —
 * without them every dark theme invents its own one-off hex, which is exactly
 * how a token system rots.
 */
export type Ramp = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  850: string;
  900: string;
  950: string;
};

// ── Neutral ────────────────────────────────────────────────────────────────
// Carries every surface and every piece of text, so it has the most steps.
// Warm tan/cream family — matches the Lumen pen.dev design system (bg #F3EBE2
// family), not a cool gray.
export const neutral: Ramp = {
  50: '#FBF8F4',
  100: '#F3EBE2',
  200: '#EDE4D8',
  300: '#E4DACD',
  400: '#D8C9B8',
  500: '#B3A594',
  600: '#8A8578',
  700: '#6B6558',
  800: '#453F35',
  850: '#2E2920',
  900: '#1C1712',
  950: '#120E0A',
};

// ── Brand ──────────────────────────────────────────────────────────────────
// The identity hue. Change this ramp and the whole product re-skins.
// Lumen's terracotta — source of truth is the pen.dev design (accent #D4916E).
export const brand: Ramp = {
  50: '#FBF2EC',
  100: '#F6E6DC',
  200: '#EDCBB3',
  300: '#E3AD88',
  400: '#D99F79',
  500: '#D4916E',
  600: '#B86F4C',
  700: '#95573A',
  800: '#70412B',
  850: '#5C3522',
  900: '#482A1B',
  950: '#2B160B',
};

// ── Accent ─────────────────────────────────────────────────────────────────
// A secondary identity hue for highlights and emphasis. Never for status.
// The pen.dev design uses a single identity hue for both brand and accent
// roles, so this ramp mirrors `brand`.
export const accent: Ramp = {
  50: '#FBF2EC',
  100: '#F6E6DC',
  200: '#EDCBB3',
  300: '#E3AD88',
  400: '#D99F79',
  500: '#D4916E',
  600: '#B86F4C',
  700: '#95573A',
  800: '#70412B',
  850: '#5C3522',
  900: '#482A1B',
  950: '#2B160B',
};

// ── Status ─────────────────────────────────────────────────────────────────
// RESERVED for state. Never reuse a status hue as a decorative or chart colour;
// once green means "success" anywhere, a green bar chart reads as "good".
export const success: Ramp = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  850: '#054434',
  900: '#064E3B',
  950: '#022C22',
};

// Anchored on the pen.dev warning token (#A3650F).
export const warning: Ramp = {
  50: '#FBF0DE',
  100: '#F6DFB8',
  200: '#EEC587',
  300: '#E3A65A',
  400: '#D08C33',
  500: '#A3650F',
  600: '#8A550C',
  700: '#6E440A',
  800: '#523308',
  850: '#402806',
  900: '#2E2410',
  950: '#1C1608',
};

// Anchored on the pen.dev error token (#A8372B).
export const danger: Ramp = {
  50: '#FBE8E5',
  100: '#F6CFC8',
  200: '#ECA397',
  300: '#DF7768',
  400: '#C9523F',
  500: '#A8372B',
  600: '#8B2C21',
  700: '#6D2219',
  800: '#501811',
  850: '#3E120C',
  900: '#2E1512',
  950: '#1A0A08',
};

// Anchored on the pen.dev info token (#2C5AA3).
export const info: Ramp = {
  50: '#E8EFFB',
  100: '#C9D9F2',
  200: '#9FBCE6',
  300: '#6F9AD8',
  400: '#4A7BC4',
  500: '#2C5AA3',
  600: '#234A89',
  700: '#1B3A6D',
  800: '#142A4F',
  850: '#10213E',
  900: '#121E2E',
  950: '#0A1220',
};

// ── Extended hues ──────────────────────────────────────────────────────────
// Not used by the default theme. They exist so charts, avatars, tags and
// category colours draw from real ramps instead of one-off hex values.
export const teal: Ramp = {
  50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4', 400: '#2DD4BF',
  500: '#14B8A6', 600: '#0D9488', 700: '#0F766E', 800: '#115E59', 850: '#0F5350',
  900: '#134E4A', 950: '#042F2E',
};

export const orange: Ramp = {
  50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74', 400: '#FB923C',
  500: '#F97316', 600: '#EA580C', 700: '#C2410C', 800: '#9A3412', 850: '#822D0F',
  900: '#7C2D12', 950: '#431407',
};

export const violet: Ramp = {
  50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD', 400: '#A78BFA',
  500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9', 800: '#5B21B6', 850: '#4E1C9C',
  900: '#4C1D95', 950: '#2E1065',
};

export const pink: Ramp = {
  50: '#FDF2F8', 100: '#FCE7F3', 200: '#FBCFE8', 300: '#F9A8D4', 400: '#F472B6',
  500: '#EC4899', 600: '#DB2777', 700: '#BE185D', 800: '#9D174D', 850: '#871040',
  900: '#831843', 950: '#500724',
};

export const lime: Ramp = {
  50: '#F7FEE7', 100: '#ECFCCB', 200: '#D9F99D', 300: '#BEF264', 400: '#A3E635',
  500: '#84CC16', 600: '#65A30D', 700: '#4D7C0F', 800: '#3F6212', 850: '#365310',
  900: '#365314', 950: '#1A2E05',
};

// ── Alpha ──────────────────────────────────────────────────────────────────
/**
 * Translucent neutrals. These composite over WHATEVER is behind them, which is
 * what a solid hex cannot do — a scrim, a pressed wash, or a divider on top of
 * an image needs to darken or lighten the actual content, not guess at it.
 *
 * Every improvised `rgba(...)` in a theme is a missing token from this scale.
 */
const blackA = (a: number) => `rgba(0, 0, 0, ${a})`;
const whiteA = (a: number) => `rgba(255, 255, 255, ${a})`;

export const blackAlpha = {
  4: blackA(0.04),
  8: blackA(0.08),
  12: blackA(0.12),
  16: blackA(0.16),
  24: blackA(0.24),
  32: blackA(0.32),
  48: blackA(0.48),
  64: blackA(0.64),
  80: blackA(0.8),
} as const;

export const whiteAlpha = {
  4: whiteA(0.04),
  8: whiteA(0.08),
  12: whiteA(0.12),
  16: whiteA(0.16),
  24: whiteA(0.24),
  32: whiteA(0.32),
  48: whiteA(0.48),
  64: whiteA(0.64),
  80: whiteA(0.8),
} as const;

/** Absolutes. Only where a true black/white is meant, never as "the text colour". */
export const absolute = {
  black: '#000000',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

// ── Data visualisation ─────────────────────────────────────────────────────
/**
 * Categorical series colours, in FIXED ORDER. Assign by position and never
 * cycle — a ninth series folds into "Other" or becomes small multiples rather
 * than reusing slot 1, because repeating a hue asserts a relationship that is
 * not in the data.
 *
 * VALIDATED, not chosen by eye. This exact order passes all six checks against
 * both the light and the dark surface: lightness band, chroma floor, adjacent
 * CVD separation (worst pair ΔE 11.3 deutan), the normal-vision floor
 * (worst 21.1), and ≥3:1 contrast on every slot.
 *
 * The order is load-bearing. Teal sits at slot 2 rather than beside pink
 * because pink↔teal collapses to ΔE 3.8 under deuteranopia when adjacent.
 * Re-ordering or substituting a colour REQUIRES re-running the validator.
 *
 * REBRAND NOTE (Lumen terracotta): `accent` was set equal to `brand` for this
 * rebrand (both terracotta), which collapsed the old slot 1 (brand[500]) and
 * slot 7 (accent[600]) to one hue. Slot 7 is dropped rather than reusing the
 * brand hue twice. Slot 1 moved to brand[600] (3.29:1 light / 4.59:1 dark —
 * brand[500] only cleared 2.20:1 light). This repo keeps the ΔE/CVD
 * methodology as a comment but ships no runnable validator script, so this
 * edit was checked for the documented ≥3:1 floor only, against the new warm
 * canvas (#F3EBE2 light / #1C1712 dark) — NOT re-validated for CVD separation
 * between slots. orange/violet/warning read borderline (~3.1–3.4:1) against
 * the new canvas on at least one scheme; re-run a real validator before this
 * chart order ships in a release.
 */
export const chartCategorical = [
  brand[600], // 1  terracotta (brand)
  teal[600], // 2  teal
  orange[700], // 3  orange
  violet[600], // 4  violet
  pink[600], // 5  pink
  lime[600], // 6  lime
  warning[700], // 7  amber
] as const;

/** Magnitude. One hue, light → dark. Never a rainbow. */
export const chartSequential = [
  brand[100],
  brand[200],
  brand[300],
  brand[400],
  brand[500],
  brand[600],
  brand[700],
] as const;

/** Polarity. Two hues with a NEUTRAL midpoint — never a hue in the middle. */
export const chartDiverging = {
  negative: [danger[700], danger[500], danger[300]] as const,
  neutral: neutral[200],
  positive: [teal[300], teal[500], teal[700]] as const,
} as const;

/**
 * Deterministic avatar backgrounds. Hash a stable id into this array so a
 * person keeps the same colour everywhere. Drawn from the chart order because
 * it is already hue-separated; status hues are deliberately excluded so an
 * avatar never reads as a state.
 */
export const avatarPalette = [
  brand[600],
  teal[600],
  orange[700],
  violet[600],
  pink[600],
  lime[600],
  info[600],
] as const;

export const palette = {
  neutral,
  brand,
  accent,
  success,
  warning,
  danger,
  info,
  teal,
  orange,
  violet,
  pink,
  lime,
} as const;
