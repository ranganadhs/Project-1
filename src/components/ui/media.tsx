import { useEffect, useState } from 'react';
import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { AccessibilityInfo, View, type ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export type ImageProps = ExpoImageProps & {
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  ratio?: number;
};

/**
 * expo-image, not React Native's Image.
 *
 * The differences that matter: disk + memory caching by default, a real
 * `transition` cross-fade so images do not pop in, `placeholder` support for
 * blurhash/thumbhash, and correct `contentFit` semantics. RN's Image has none
 * of these and every app ends up reimplementing them badly.
 *
 * `recyclingKey` is worth knowing: inside a list, pass a stable item id or a
 * recycled row will briefly show the PREVIOUS item's image.
 *
 * ── THE PLACEHOLDER FLOOR IS PERMANENT UNDER A TRANSPARENT ASSET ──────────
 * Every image gets a `bg.sunken` background. For a PHOTO that is exactly right:
 * it fills the frame while the bytes load, so the layout does not flash empty.
 * For a PNG or SVG WITH ALPHA it never goes away — the floor shows through the
 * transparent pixels forever.
 *
 * On a white card nobody notices. On a coloured ground it reads as a visible
 * pale box around the artwork, which is how a transparent emblem ends up
 * sitting in a rectangle on a brand-coloured hero.
 *
 * Any transparent asset on a coloured ground needs to opt out:
 *
 *   style={{ backgroundColor: theme.color.bg.transparent }}
 *
 * It is not the default because defaulting to transparent would reintroduce the
 * flash-of-empty-frame for the common case, which is photographs.
 */
export function Image({ radius = 'none', ratio, style, ...rest }: ImageProps) {
  const { theme } = useUnistyles();
  return (
    <ExpoImage
      // 200ms cross-fade rather than a hard pop. Cheap, and it is most of what
      // makes image-heavy screens feel considered.
      transition={theme.motion.duration.normal}
      contentFit="cover"
      style={[
        {
          ...theme.shape.smooth,
          borderRadius: theme.radius[radius],
          backgroundColor: theme.color.bg.sunken,
        },
        ratio ? { aspectRatio: ratio } : null,
        style,
      ]}
      {...rest}
    />
  );
}

export type GradientProps = ViewProps & {
  /** Theme gradient key, or explicit colours. */
  colors?: readonly [string, string, ...string[]];
  direction?: 'diagonal' | 'vertical' | 'horizontal';
};

/**
 * Gradient fill. Defaults to the theme's brand stops so a gradient is never a
 * one-off list of hexes at a call site.
 */
export function Gradient({
  colors,
  direction = 'diagonal',
  style,
  children,
  ...rest
}: GradientProps) {
  const { theme } = useUnistyles();
  const geometry = theme.gradient[direction];
  const stops = (colors ?? theme.color.gradient.brand) as readonly [string, string, ...string[]];

  /**
   * An opaque floor, always, and the first stop so it is never a colour the
   * gradient does not already contain.
   *
   * Without it the view is transparent for the frame before the gradient layer
   * draws, and the bare native root shows through — the same class of failure
   * as trap 5, where translucent chrome sampled a white container for one frame
   * and read as light mode.
   */
  const floor = { backgroundColor: stops[0] };

  if (__DEV__) warnOnAsymmetricRadius(style);

  return (
    <LinearGradient
      colors={stops}
      start={geometry.start}
      end={geometry.end}
      style={[floor, style]}
      {...rest}
    >
      {children}
    </LinearGradient>
  );
}

/** The four corner properties that can disagree with `borderRadius`. */
const CORNERS = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
] as const;

/**
 * Warns when a `Gradient` is given MIXED corner radii, which silently flattens
 * it to its first stop.
 *
 * ── WHY THIS DESERVES A RUNTIME WARNING ───────────────────────────────────
 * Asymmetric corners make iOS mask the view, and expo-linear-gradient's
 * gradient layer is masked out along with it — leaving only the opaque floor
 * painted underneath. The result is a perfectly plausible flat card. Nothing
 * catches it: the tokens are correct, so `theme:contrast` passes; the types are
 * correct, so `tsc` passes; the styles are real, so lint passes. It is a
 * DRAWING failure, and the only signal is that the fill is exactly `stops[0]`
 * at every height, which you have to sample device pixels to notice.
 *
 * The trap is well disguised, because the documented idiom for asymmetric
 * corners is a shape like `{ ...shape.card, borderBottomLeftRadius:
 * radius.none, borderBottomRightRadius: radius.none }` — and a squared-off
 * column or header is exactly the kind of thing you would fill with a gradient.
 *
 * THE FIX at the call site is to separate the two jobs: a wrapper `View` takes
 * the shape and `overflow: 'hidden'`, and the `Gradient` inside carries no
 * radius at all.
 *
 * Dev-only. It reads the RESOLVED style rather than trusting a prop, so it sees
 * a shape spread in from a token just as well as a literal.
 */
function warnOnAsymmetricRadius(style: ViewProps['style']): void {
  const flat = StyleSheet.flatten(style) as Record<string, unknown> | undefined;
  if (!flat) return;

  const specified = CORNERS.filter((corner) => flat[corner] !== undefined);
  if (specified.length === 0) return;

  // A per-corner value only conflicts if it disagrees with something. Compare
  // against the shorthand when one is present, and against the implicit 0 of
  // the corners left unspecified when it is not.
  const values = new Set<unknown>(specified.map((corner) => flat[corner]));
  if (flat.borderRadius !== undefined) values.add(flat.borderRadius);
  else if (specified.length < CORNERS.length) values.add(0);

  if (values.size <= 1) return;

  console.warn(
    '[Gradient] Mixed corner radii will render this gradient FLAT (its first ' +
      'stop only) — iOS masks the view and the gradient layer is masked with ' +
      'it. Put the shape and `overflow: hidden` on a wrapper View, and leave ' +
      'the Gradient itself with no radius.',
  );
}

export type GlassProps = ViewProps & {
  /** Falls back to a blur when Liquid Glass is unavailable. */
  intensity?: 'subtle' | 'chrome' | 'heavy' | 'obscure';
  /**
   * Glass that reacts to touch — the press bulge and shimmer the OS gives its
   * own controls. ONLY for something the user presses; on a static surface it
   * is a lie about affordance.
   */
  isInteractive?: boolean;
};

/**
 * Liquid Glass on iOS 26+, a blur everywhere else, a SOLID surface when the
 * user has asked for one.
 *
 * `isLiquidGlassAvailable()` is a RUNTIME check, not a platform check — the
 * same iOS build runs on OS versions that do and do not have it, so branching
 * on Platform.OS alone renders nothing on older devices. It is paired with
 * `isGlassEffectAPIAvailable()`: the first says the OS can draw glass, the
 * second that this binary was compiled against an SDK that can ask for it.
 *
 * ── REDUCE TRANSPARENCY MEANS NO GLASS AND NO BLUR ────────────────────────
 * The OS honours it for its own chrome; an app that keeps rendering
 * translucent surfaces is the one thing on the screen the user cannot read.
 * So under that setting this is a plain view on `bg.raised`, and the check is
 * live — the setting can change while the app is open.
 *
 * ── THREE RULES THE GLASS VIEW ENFORCES BY BREAKING ───────────────────────
 *   1. No `overflow: 'hidden'` here or on any ancestor. Glass clips itself via
 *      `borderRadius` (+ `borderCurve`); outside clipping cuts off the rim
 *      highlight and the press bulge, and the surface reads as a flat tint.
 *   2. Never animate this view's `opacity` to 0, or any parent's. At opacity 0
 *      the effect does not render AT ALL, and it does not come back when the
 *      opacity does. Animate `glassEffectStyle` (`{ style, animate }`) or a
 *      transform instead.
 *   3. It is translucent. It samples whatever sits behind it, so anything
 *      placed under it must already be the right colour (see trap 5).
 */
export function Glass({
  intensity = 'chrome',
  isInteractive = false,
  style,
  children,
  ...rest
}: GlassProps) {
  const { theme, rt } = useUnistyles();
  const reduceTransparency = useReduceTransparency();

  if (reduceTransparency) {
    return (
      <View style={[styles.glass, styles.solid, style]} {...rest}>
        {children}
      </View>
    );
  }

  if (isLiquidGlassAvailable() && isGlassEffectAPIAvailable()) {
    return (
      <GlassView
        style={[styles.glass, style]}
        isInteractive={isInteractive}
        colorScheme={rt.themeName === 'dark' ? 'dark' : 'light'}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={theme.blur[intensity]}
      tint={rt.themeName === 'dark' ? 'dark' : 'light'}
      style={[styles.glass, styles.clipped, style]}
      {...rest}
    >
      {children}
    </BlurView>
  );
}

/**
 * The OS "Reduce Transparency" setting, kept current while mounted.
 *
 * Starts `false` and resolves on the first tick — the same shape as the Reduce
 * Motion hook in `lottie.tsx`, and for the same reason: the first render must
 * not block on a native round trip, and one frame of glass before it settles
 * to solid is cheaper than a hook that suspends.
 */
export function useReduceTransparency(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (active) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setEnabled,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

/** True when the OS can render real Liquid Glass. */
export { isLiquidGlassAvailable };

const styles = StyleSheet.create((theme) => ({
  // No `overflow: 'hidden'` — see rule 1 above. The shape role carries the
  // radius and the continuous curve, which is all glass needs to clip itself.
  glass: {
    ...theme.shape.card,
  },
  // A BlurView does NOT clip itself, so the fallback still needs the mask —
  // and it is the only branch that gets it.
  clipped: {
    overflow: 'hidden',
  },
  solid: {
    backgroundColor: theme.color.bg.raised,
    borderWidth: theme.border.hairline,
    borderColor: theme.color.border.subtle,
  },
}));

/** Re-exported so a screen can compose media without a second import. */
export { View as MediaBox };
