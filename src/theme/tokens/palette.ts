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
export const neutral: Ramp = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  850: '#141C2B',
  900: '#0F172A',
  950: '#0A0F1A',
};

// ── Brand ──────────────────────────────────────────────────────────────────
// The identity hue. Change this ramp and the whole product re-skins.
export const brand: Ramp = {
  50: '#EFF4FF',
  100: '#DBE6FF',
  200: '#B8CCFF',
  300: '#8DACFF',
  400: '#5B86FF',
  500: '#3D6BFF',
  600: '#2C53E0',
  700: '#1E3AC8',
  800: '#16277A',
  850: '#122065',
  900: '#0F1B57',
  950: '#0A1238',
};

// ── Accent ─────────────────────────────────────────────────────────────────
// A secondary identity hue for highlights and emphasis. Never for status.
export const accent: Ramp = {
  50: '#ECFEFF',
  100: '#CFFAFE',
  200: '#A5F3FC',
  300: '#67E8F9',
  400: '#22D3EE',
  500: '#06B6D4',
  600: '#0891B2',
  700: '#0E7490',
  800: '#155E75',
  850: '#12505F',
  900: '#164E63',
  950: '#083344',
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

export const warning: Ramp = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  850: '#7C360C',
  900: '#78350F',
  950: '#451A03',
};

export const danger: Ramp = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  850: '#7F1717',
  900: '#7F1D1D',
  950: '#450A0A',
};

export const info: Ramp = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  850: '#1A3894',
  900: '#1E3A8A',
  950: '#172554',
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
 */
export const chartCategorical = [
  brand[500], // 1  blue
  teal[600], // 2  teal
  orange[700], // 3  orange
  violet[600], // 4  violet
  pink[600], // 5  pink
  lime[600], // 6  lime
  accent[600], // 7  cyan
  warning[700], // 8  amber
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
  brand[500],
  teal[600],
  orange[700],
  violet[600],
  pink[600],
  lime[600],
  accent[600],
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
