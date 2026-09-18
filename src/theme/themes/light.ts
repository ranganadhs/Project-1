import {
  space,
  radius,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  fontWeight,
  makeElevation,
  glow,
  duration,
  easing,
  spring,
  springRatio,
  cssEasing,
  easeTransition,
  pressScale,
  opacity,
  border,
  size,
  zIndex,
  hitSlop,
  layout,
  breakpoint,
  blur,
  focus,
  gradient,
  aspectRatio,
  stroke,
  fontVariant,
  textTransform,
  textDecoration,
  paragraphSpacing,
  nestedRadius,
} from '../tokens';
import { colorLight } from './color-light';
import { shape } from './shape';

/**
 * Tier 2 — the ONLY tier components read. Colour comes from ./color-light
 * (see the import-discipline note there); the remaining scales are tier 1
 * re-exports so a component never needs to import from tokens/ directly.
 */
export const light = {
  color: colorLight,
  space,
  radius,
  shape,
  typography: {
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
    fontWeight,
    fontVariant,
    textTransform,
    textDecoration,
    paragraphSpacing,
  },
  elevation: makeElevation('light'),
  glow,
  motion: { duration, easing, cssEasing, spring, springRatio, easeTransition, pressScale },
  opacity,
  border,
  size,
  zIndex,
  hitSlop,
  layout,
  breakpoint,
  blur,
  focus,
  gradient,
  aspectRatio,
  stroke,
  nestedRadius,
} as const;

export type AppTheme = typeof light;
