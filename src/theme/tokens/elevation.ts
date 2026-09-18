/**
 * A shadow, as the CSS `boxShadow` string React Native 0.76+ draws natively on
 * both platforms.
 *
 * ── WHY NOT `shadowColor` / `shadowOffset` / `elevation` ──────────────────
 * The legacy props are two systems pretending to be one: iOS reads the four
 * `shadow*` keys and ignores `elevation`; Android reads `elevation` and ignores
 * the rest, drawing a shadow whose colour and offset you cannot set. Every
 * preset had to carry both, and they never matched. `boxShadow` is one
 * declaration, drawn the same way on both platforms, with a colour and an alpha
 * of its own — so the per-scheme curve below is real on Android too, instead
 * of an `elevation` integer that renders a grey blob whatever the theme.
 *
 * Never animate it: a shadow is re-rasterised on every frame it changes. If a
 * surface must move, animate its transform and leave the shadow alone.
 */
export type ShadowStyle = { boxShadow: string };

export type ElevationScale = {
  none: ShadowStyle;
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  xl: ShadowStyle;
};

const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Applies an alpha to a hex colour, as the `rgba()` a `boxShadow` needs.
 *
 * Exported for the tests, and for the rare call site that needs a translucent
 * version of a token colour outside a shadow. Palette colours are hex; a value
 * that is not (a named colour, an `rgb()`) is returned unchanged, because there
 * is no honest way to add alpha to it here.
 */
export function withAlpha(color: string, alpha: number): string {
  const match = HEX_RE.exec(color.trim());
  if (!match) return color;

  let hex = match[1] ?? '';
  if (hex.length <= 4) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const clamped = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

/** `offsetX offsetY blur spread colour` — the order CSS and RN both expect. */
const boxShadow = (offsetY: number, blur: number, color: string): ShadowStyle => ({
  boxShadow: `0 ${offsetY}px ${blur}px 0 ${color}`,
});

/**
 * Elevation is one of the few scales that CANNOT be shared between themes.
 *
 * A shadow works by darkening what is behind it. On a light canvas that reads
 * as depth; on a near-black canvas there is almost nothing left to darken, so
 * the same shadow is invisible. Dark interfaces convey elevation primarily by
 * making raised surfaces LIGHTER (see bg.raised in each theme), with shadow as
 * a secondary cue that needs far more opacity to register at all.
 *
 * So the dark scale is not "the light scale, dimmer" — it is a different curve:
 * roughly double the opacity and a wider blur, so the shadow still separates
 * a card from the canvas without turning into a hard edge.
 *
 * `blur` here is the CSS blur radius — about twice an iOS `shadowRadius`,
 * which is a Gaussian sigma — so these numbers run larger than legacy shadow
 * props would.
 */
export function makeElevation(scheme: 'light' | 'dark'): ElevationScale {
  const dark = scheme === 'dark';

  const opacity = dark
    ? { sm: 0.24, md: 0.36, lg: 0.48, xl: 0.6 }
    : { sm: 0.04, md: 0.1, lg: 0.16, xl: 0.22 };

  // Wider blur in dark mode so the falloff stays gradual at high opacity.
  const blur = dark
    ? { sm: 8, md: 28, lg: 44, xl: 64 }
    : { sm: 6, md: 20, lg: 36, xl: 52 };

  const ink = (step: keyof typeof opacity) => withAlpha('#000000', opacity[step]);

  return {
    // A real, fully transparent shadow rather than an absent key, so a variant
    // that selects `none` OVERRIDES a shadow set higher up instead of leaving it.
    none: { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' },
    sm: boxShadow(1, blur.sm, ink('sm')),
    md: boxShadow(6, blur.md, ink('md')),
    lg: boxShadow(12, blur.lg, ink('lg')),
    xl: boxShadow(20, blur.xl, ink('xl')),
  };
}

const GLOW_OPACITY = { light: 0.1, medium: 0.15, strong: 0.25 } as const;
const GLOW_BLUR = 16;

/** Coloured glow, for status indicators and focus rings. */
export function glow(color: string, intensity: keyof typeof GLOW_OPACITY = 'medium'): ShadowStyle {
  return { boxShadow: `0 0 ${GLOW_BLUR}px 0 ${withAlpha(color, GLOW_OPACITY[intensity])}` };
}

/** The alpha a `boxShadow` string carries, for assertions and for tuning. */
export function shadowAlpha(shadow: ShadowStyle): number {
  const match = /rgba\([^)]*,\s*([0-9.]+)\)/.exec(shadow.boxShadow);
  return match ? Number(match[1]) : 0;
}
