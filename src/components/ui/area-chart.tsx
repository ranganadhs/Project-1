import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { LinearGradient, vec } from '@shopify/react-native-skia';
import { CartesianChart, Line, Area } from 'victory-native';

export type AreaChartPoint = {
  /** Position along the x axis. Index, timestamp, week number — anything ordered. */
  x: number;
  y: number;
};

export type AreaChartProps = {
  data: AreaChartPoint[];
  /**
   * Which slot of `chart.categorical` to draw in. Assign by INDEX and never
   * cycle — the scale is a fixed, validated order, so a modulo would quietly
   * give two unrelated series the same colour and make them look related.
   */
  series?: number;
  /**
   * Fixes the y axis instead of fitting it to the data.
   *
   * Worth doing whenever the values have a natural range: an auto-fitted axis
   * rescales every time the data changes, so an 82 and a 43 render at the same
   * height on different days and the trend the chart exists to show disappears.
   */
  domain?: [number, number];
};

/**
 * A line with a gradient wash beneath it — the shape most product charts want.
 *
 * ── WHY victory-native AND NOT A PROP-DRIVEN LIBRARY ──────────────────────
 * victory-native XL is COMPOSITIONAL: it resolves the points and hands them
 * back, and you draw. That is what makes it fit a token-driven codebase — every
 * mark below reads `theme.color.chart.*` directly, rather than being configured
 * through forty props that each need their own colour argument.
 *
 * ── SKIA IS A NATIVE MODULE ───────────────────────────────────────────────
 * Rendering this on a binary built before `@shopify/react-native-skia` was
 * installed CRASHES; it does not degrade. After adding it, rebuild with
 * `npx expo run:ios` — a Metro reload is not enough.
 *
 * ── NO AXIS LABELS, DELIBERATELY ──────────────────────────────────────────
 * Skia draws its own text, so axis labels need a FONT FILE loaded through
 * `useFont` — it cannot see the family `expo-font` registered with the OS. This
 * boilerplate ships no custom font, so requiring one here would make a generic
 * chart depend on an asset most apps have not chosen yet. Pass a font and an
 * `axisOptions` when your app has one.
 */
export function AreaChart({ data, series = 0, domain }: AreaChartProps) {
  const { theme } = useUnistyles();

  if (data.length < 2) return null;

  // `?? fg.brand` satisfies the index check rather than describing a real case:
  // every caller passes a slot that exists, and the scale is never cycled.
  const stroke = theme.color.chart.categorical[series] ?? theme.color.fg.brand;

  return (
    <View style={styles.frame}>
      <CartesianChart data={data} xKey="x" yKeys={['y']} domain={domain ? { y: domain } : undefined}>
        {({ points, chartBounds }) => (
          <>
            <Area points={points.y} y0={chartBounds.bottom} curveType="natural">
              {/*
                Fades to the SURFACE colour, never to `transparent`.

                `transparent` is transparent BLACK, and Skia interpolates in
                premultiplied space — so a hue→transparent ramp drags its
                midtones through grey and the wash renders dirty. Ending on the
                surface the chart sits on looks like nothing at the bottom, and
                stays correct in dark mode where fading to white would glow.
              */}
              <LinearGradient
                start={vec(0, chartBounds.top)}
                end={vec(0, chartBounds.bottom)}
                colors={[stroke, theme.color.bg.raised]}
              />
            </Area>

            <Line
              points={points.y}
              color={stroke}
              strokeWidth={theme.stroke.medium}
              curveType="natural"
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // An explicit height, because a Skia canvas has NO INTRINSIC SIZE and
  // collapses to zero without one — the same failure mode as an @expo/ui Host.
  frame: {
    height: theme.size.chart.height,
    width: '100%',
  },
}));
