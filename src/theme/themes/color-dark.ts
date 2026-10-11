import {
  palette,
  absolute,
  blackAlpha,
  whiteAlpha,
  chartCategorical,
  chartSequential,
  chartDiverging,
  avatarPalette,
} from '../tokens/palette';
import type { ThemeColor } from './color-light';

const { neutral, brand, accent, success, warning, danger, info } = palette;

/**
 * Semantic colour for the dark theme. Typed as ThemeColor so the compiler
 * rejects any structural difference from light — the two can never drift.
 *
 * Same import discipline as color-light: palette only, never the tokens barrel.
 *
 * Dark is SELECTED, not derived. Two places where it deliberately diverges
 * rather than mirroring:
 *   fg.onBrand    dark text on a luminous accent, because white on brand[400]
 *                 is only 3.33:1 while neutral[900] on it is 5.35:1
 *   bg.overlay    a WHITE alpha, since lifting a dark surface means adding
 *                 light; the light theme's black wash would do nothing here
 */
export const colorDark: ThemeColor = {
  bg: {
    canvas: neutral[900],
    surface: neutral[850],
    raised: neutral[800],
    sunken: neutral[950],
    inverse: absolute.white,
    brand: brand[400],
    brandSubtle: brand[950],
    accent: accent[400],
    accentSubtle: accent[950],
    selected: brand[950],
    disabled: neutral[800],
    scrim: blackAlpha[64],
    scrimHeavy: blackAlpha[80],
    // White, not black: raising a surface in the dark means adding light.
    overlay: whiteAlpha[8],
    // Absence of a fill has no scheme, so this is the one bg that does not flip.
    transparent: absolute.transparent,
  },

  fg: {
    primary: neutral[50],
    secondary: neutral[300],
    tertiary: neutral[400],
    disabled: neutral[600],
    placeholder: neutral[500],
    inverse: neutral[900],

    // ── PAIRING TOKENS ─────────────────────────────────────────────────────
    // DARK text here, where light mode uses white. Not an inconsistency — the
    // proof is the contrast: on the dark theme's brand fill (brand[400]),
    // white scores 2.29:1 and fails AA, while neutral[900] scores 7.78:1.
    //
    // A dark theme wants a LUMINOUS accent, and luminous fills take dark text.
    // This is why these tokens are bound to the background rather than being
    // "the light value, inverted" — inverting would have produced white and
    // failed the gate.
    onBrand: neutral[900],
    onAccent: neutral[900],
    onSolid: neutral[900],
    link: brand[300],
    linkPressed: brand[200],
    brand: brand[400],
    accent: accent[400],
  },

  border: {
    subtle: neutral[800],
    default: neutral[700],
    // neutral[500], not [600]: component boundaries need 3:1 against the
    // canvas, and neutral[600] on #0F172A is only 2.36:1.
    strong: neutral[500],
    focus: brand[400],
    brand: brand[400],
    selected: brand[400],
    inverse: neutral[300],
    disabled: neutral[800],
  },

  interactive: {
    // Dark mode inverts the ladder: press goes BRIGHTER, because these carry
    // dark text (fg.onBrand) and darkening the fill would swallow the label.
    primary: {
      rest: brand[400],
      hover: brand[300],
      pressed: brand[200],
      disabled: neutral[800],
    },
    secondary: {
      /** neutral[600] pressed with fg.primary text was only 3.48:1. The
       * whole ladder shifts a step darker so pressed clears 4.5:1 at 700
       * while rest/hover stay distinct. */
      rest: neutral[850],
      hover: neutral[800],
      pressed: neutral[700],
      disabled: neutral[800],
    },
    ghost: {
      rest: absolute.transparent,
      hover: neutral[800],
      pressed: neutral[700],
      disabled: absolute.transparent,
    },
    danger: {
      /** danger[400] with dark text (fg.onBrand) is only 4.03:1; 300 clears
       * 5.91:1. Press still goes brighter per the dark-mode ladder. */
      rest: danger[300],
      hover: danger[200],
      pressed: danger[100],
      disabled: neutral[800],
    },
  },

  status: {
    success: {
      fg: success[400],
      bg: success[950],
      border: success[800],
      solid: success[500],
      onSolid: neutral[900],
    },
    warning: {
      fg: warning[400],
      bg: warning[950],
      border: warning[800],
      solid: warning[400],
      onSolid: neutral[900],
    },
    danger: {
      /** danger[400] was only 4.37:1 on bg.950 and 4.03:1 on canvas; 300
       * clears both (6.40 / 5.91). */
      fg: danger[300],
      bg: danger[950],
      border: danger[800],
      solid: danger[500],
      /** Dark text on danger[500] was only 2.75:1; white clears 6.47:1. */
      onSolid: absolute.white,
    },
    info: {
      /** info[400] was only 4.39:1 on bg.950; 300 clears 6.51:1. */
      fg: info[300],
      bg: info[950],
      border: info[800],
      solid: info[500],
      /** Dark text on info[500] was only 2.62:1; white clears 6.78:1. */
      onSolid: absolute.white,
    },
    neutral: {
      fg: neutral[300],
      bg: neutral[800],
      border: neutral[700],
      /** neutral[600] with neutral[50] text was only 3.48:1; 700 clears 5.47:1. */
      solid: neutral[700],
      onSolid: neutral[50],
    },
  },

  chart: {
    // The SAME validated order as light. Not a flip — this exact set passes
    // every check against the dark surface too, so there is no second palette
    // to keep in sync.
    categorical: chartCategorical,
    sequential: chartSequential,
    diverging: chartDiverging,
    grid: neutral[800],
    axis: neutral[700],
    label: neutral[400],
  },

  avatar: avatarPalette,

  gradient: {
    brand: [brand[500], brand[600], brand[700]],
    scrim: [blackAlpha[16], blackAlpha[48], blackAlpha[80]],
  },
};
