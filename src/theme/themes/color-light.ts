import {
  palette,
  absolute,
  blackAlpha,
  chartCategorical,
  chartSequential,
  chartDiverging,
  avatarPalette,
} from '../tokens/palette';

const { neutral, brand, accent, success, warning, danger, info } = palette;

/**
 * Semantic colour for the light theme.
 *
 * Deliberately imports ONLY from tokens/palette, which is pure data. Keeping
 * colour free of any react-native import is what lets tooling — the WCAG
 * contrast gate in scripts/check-contrast.mjs — load these values in plain Node.
 * Do not import from '../tokens' (the barrel) here: it pulls in border.ts, which
 * needs react-native's StyleSheet for hairlineWidth.
 *
 * Every value is a mapping from a tier 1 step to a MEANING. If you find
 * yourself typing a hex or an rgba() in this file, the ramp is missing a step —
 * add it to palette.ts instead.
 */
const colorLightSource = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: {
    /** The page itself. Matches the pen.dev design's warm cream canvas. */
    canvas: neutral[100],
    /** A grouped region sitting on the canvas. */
    surface: absolute.white,
    /** Cards and sheets that sit ABOVE the surface. */
    raised: absolute.white,
    /** Wells, tracks, and inset fields — reads as below the surface. */
    sunken: neutral[200],
    /** Opposite-scheme block, for tooltips and snackbars. */
    inverse: neutral[900],
    /** Solid brand fill. brand[600] alone is only 3.88:1 with white text. */
    brand: brand[700],
    /** Tinted brand wash for selected rows and highlights. */
    brandSubtle: brand[100],
    accent: accent[700],
    accentSubtle: accent[100],
    /** Current selection in a list. */
    selected: brand[100],
    /** Filled but non-interactive. */
    disabled: neutral[200],
    /**
     * Backdrops. ALPHA, not solid: a scrim must darken whatever is behind it —
     * an image, a map, a video — which a solid hex cannot do.
     */
    scrim: blackAlpha[48],
    scrimHeavy: blackAlpha[64],
    /** Translucent chrome fill, behind a blur. */
    overlay: blackAlpha[4],
    /**
     * No fill — let whatever is behind show through.
     *
     * A real meaning, not a missing value: a `transparentModal` route only
     * works if nothing paints a floor under it, and a layer sitting over
     * another screen must not lay down a background of its own. Named so the
     * intent is legible at the call site, rather than a bare 'transparent'
     * string that reads as an oversight.
     */
    transparent: absolute.transparent,
  },

  // ── Foregrounds ──────────────────────────────────────────────────────────
  fg: {
    /** Body text and primary icons. */
    primary: neutral[900],
    /** Supporting text that must still be comfortably readable. */
    secondary: neutral[700],
    /** De-emphasised metadata. Passes AA for large text only. */
    tertiary: neutral[600],
    disabled: neutral[400],
    /** Empty-field hint. Distinct from disabled — the field IS editable. */
    placeholder: neutral[600],
    // ── PAIRING TOKENS ─────────────────────────────────────────────────────
    // These are bound to a BACKGROUND, not to the theme.
    //
    // A brand button is blue in both schemes, so its label must NOT flip with
    // light/dark the way fg.primary does — it has to stay legible on that fill.
    // That is the entire reason these exist, and why the alternatives are all
    // wrong:
    //
    //   isDark ? '#FFF' : '#000'   every call site re-derives it, inconsistently
    //   '#FFFFFF'                  silently breaks when the brand ramp changes
    //   fg.primary                 flips with the theme and disappears
    //
    // Note dark's values are NOT mirrors of these — see color-dark.ts, where
    // onBrand is dark text because the dark brand fill is luminous.

    /** On bg.inverse (tooltips, snackbars). */
    inverse: absolute.white,
    /** On bg.brand, interactive.primary.*, interactive.danger.*. */
    onBrand: absolute.white,
    /** On bg.accent. */
    onAccent: absolute.white,
    /** On any status.<tone>.solid fill. */
    onSolid: absolute.white,
    link: brand[700],
    linkPressed: brand[800],
    brand: brand[700],
    accent: accent[700],
  },

  // ── Borders ──────────────────────────────────────────────────────────────
  border: {
    /** Dividers between rows. Decorative — not held to 3:1. */
    subtle: neutral[200],
    /** Default container edge. */
    default: neutral[300],
    /** Delineates a control. Held to 3:1 (WCAG 1.4.11); neutral[500]/[600]
     * fall short on both canvas and surface, so this uses neutral[700]. */
    strong: neutral[700],
    /** Focus ring. Held to 3:1; brand[500]/[600] fall short on raised. */
    focus: brand[700],
    brand: brand[700],
    selected: brand[700],
    inverse: neutral[700],
    disabled: neutral[200],
  },

  // ── Interactive ──────────────────────────────────────────────────────────
  /**
   * Nested by ROLE, then state. The flat naming this replaced
   * (`primaryHover`, `ghostPressed`) had no consistent shape, so half the
   * states simply did not exist and components improvised.
   *
   * `hover` is a no-op on touch but real on web and with a pointer attached.
   */
  interactive: {
    // Light mode: press goes DARKER. Each step must keep white legible, so
    // the ladder is 700 -> 800 -> 850 — brand[600] alone is only 3.88:1 with
    // white and fails AA for body-sized button labels.
    primary: {
      rest: brand[700],
      hover: brand[800],
      pressed: brand[850],
      disabled: neutral[300],
    },
    secondary: {
      rest: neutral[200],
      hover: neutral[300],
      pressed: neutral[400],
      disabled: neutral[200],
    },
    ghost: {
      rest: absolute.transparent,
      hover: neutral[200],
      pressed: neutral[300],
      disabled: absolute.transparent,
    },
    danger: {
      rest: danger[600],
      hover: danger[700],
      pressed: danger[800],
      disabled: neutral[200],
    },
  },

  // ── Status ───────────────────────────────────────────────────────────────
  /**
   * Each tone carries the full set it needs to render a banner, a badge, and a
   * solid button without any component mixing its own tint.
   *
   * `fg` is the 700 step, not 600: the 600 step fails AA against its own 50
   * tint for success and danger.
   */
  status: {
    success: {
      fg: success[700],
      bg: success[50],
      border: success[200],
      solid: success[700],
      onSolid: absolute.white,
    },
    warning: {
      fg: warning[700],
      bg: warning[50],
      border: warning[200],
      solid: warning[500],
      /** Dark text on warning[500] is only 3.75:1; white clears 4.75:1. */
      onSolid: absolute.white,
    },
    danger: {
      fg: danger[700],
      bg: danger[50],
      border: danger[200],
      solid: danger[600],
      onSolid: absolute.white,
    },
    info: {
      fg: info[600],
      bg: info[50],
      border: info[200],
      solid: info[600],
      onSolid: absolute.white,
    },
    neutral: {
      /** neutral[600] on neutral[100] is only 3.12:1; 700 clears 4.90:1. */
      fg: neutral[700],
      bg: neutral[100],
      border: neutral[200],
      /** neutral[600] solid with white text is only 3.68:1; 700 clears 5.79:1. */
      solid: neutral[700],
      onSolid: absolute.white,
    },
  },

  // ── Data visualisation ───────────────────────────────────────────────────
  /**
   * Chart colours are separate from status on purpose: once green means
   * "success" in this app, a green series would read as a value judgement the
   * data does not carry.
   */
  chart: {
    categorical: chartCategorical,
    sequential: chartSequential,
    diverging: chartDiverging,
    /** Gridlines must recede behind the data. */
    grid: neutral[200],
    axis: neutral[300],
    /** neutral[600] on canvas is only 3.12:1; 700 clears 4.90:1. */
    label: neutral[700],
  },

  /** Deterministic avatar backgrounds — hash a stable id into this array. */
  avatar: avatarPalette,

  /** Gradient colour stops. Geometry lives in tokens/effects.ts. */
  gradient: {
    brand: [brand[400], brand[500], brand[600]],
    /** Fades content out under a caption laid over an image. */
    scrim: [blackAlpha[4], blackAlpha[32], blackAlpha[64]],
  },
} as const;

/**
 * Widens `as const` string literals back to `string` while preserving the exact
 * key shape. Without this, ThemeColor would demand that the dark theme use
 * light's literal hex values — the type would enforce identical colours rather
 * than an identical structure, which is the opposite of what we want.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };

export type ThemeColor = Widen<typeof colorLightSource>;

/**
 * Exported with the widened type so `AppTheme` (derived from the light theme)
 * describes the SHAPE every theme shares, not light's specific hex values.
 */
export const colorLight: ThemeColor = colorLightSource;
