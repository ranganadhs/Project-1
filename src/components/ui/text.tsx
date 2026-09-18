import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'callout'
  | 'label'
  | 'caption'
  | 'eyebrow';

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'brand' | 'onBrand' | 'danger';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'auto' | 'left' | 'center' | 'right';
  /**
   * For a number that CHANGES IN PLACE — a score after a submission, a
   * countdown, a live counter, a column of figures.
   *
   * Switches to tabular figures so the value does not reflow as its digits
   * change width. Proportional digits are different widths, so a changing
   * number visibly jitters without this.
   *
   * NOT for a number simply displayed once — a static rank or a count in a
   * sentence should stay with the text around it.
   */
  numeric?: boolean;
};

export function Text({
  variant = 'body',
  tone = 'primary',
  weight,
  align,
  numeric,
  style,
  ...rest
}: TextProps) {
  styles.useVariants({ variant, tone, weight, numeric });
  return <RNText style={[styles.text, align ? { textAlign: align } : null, style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    variants: {
      variant: {
        display: {
          fontSize: theme.typography.fontSize['3xl'],
          lineHeight: theme.typography.lineHeight['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          letterSpacing: theme.typography.letterSpacing.tight,
        },
        title: {
          fontSize: theme.typography.fontSize['2xl'],
          lineHeight: theme.typography.lineHeight['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          letterSpacing: theme.typography.letterSpacing.tight,
        },
        heading: {
          fontSize: theme.typography.fontSize.xl,
          lineHeight: theme.typography.lineHeight.xl,
          fontWeight: theme.typography.fontWeight.semibold,
        },
        subheading: {
          fontSize: theme.typography.fontSize.lg,
          lineHeight: theme.typography.lineHeight.lg,
          fontWeight: theme.typography.fontWeight.semibold,
        },
        body: {
          fontSize: theme.typography.fontSize.md,
          lineHeight: theme.typography.lineHeight.md,
          fontWeight: theme.typography.fontWeight.regular,
        },
        callout: {
          fontSize: theme.typography.fontSize.base,
          lineHeight: theme.typography.lineHeight.base,
          fontWeight: theme.typography.fontWeight.regular,
        },
        label: {
          fontSize: theme.typography.fontSize.sm,
          lineHeight: theme.typography.lineHeight.sm,
          fontWeight: theme.typography.fontWeight.medium,
        },
        caption: {
          fontSize: theme.typography.fontSize.xs,
          lineHeight: theme.typography.lineHeight.xs,
          fontWeight: theme.typography.fontWeight.regular,
        },
        /**
         * The small uppercase label above a card's content. A real type role
         * rather than a caption someone happened to uppercase: it carries its
         * own tracking, because uppercase text set at caption tracking reads
         * as cramped.
         */
        eyebrow: {
          fontSize: theme.typography.fontSize.xs,
          lineHeight: theme.typography.lineHeight.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          textTransform: theme.typography.textTransform.upper,
          letterSpacing: theme.typography.letterSpacing.wide,
        },
      },
      tone: {
        primary: { color: theme.color.fg.primary },
        secondary: { color: theme.color.fg.secondary },
        tertiary: { color: theme.color.fg.tertiary },
        brand: { color: theme.color.interactive.primary.rest },
        onBrand: { color: theme.color.fg.onBrand },
        danger: { color: theme.color.status.danger.fg },
      },
      weight: {
        regular: { fontWeight: theme.typography.fontWeight.regular },
        medium: { fontWeight: theme.typography.fontWeight.medium },
        semibold: { fontWeight: theme.typography.fontWeight.semibold },
        bold: { fontWeight: theme.typography.fontWeight.bold },
      },
      /**
       * DECLARED LAST, deliberately. Unistyles merges variants in declaration
       * order, so this has to come after `variant` and `weight` to win —
       * declared earlier, a `weight="bold"` numeric would be pulled back to
       * proportional figures and the value would jitter again.
       *
       * Invisible to typecheck, lint and the bundler. Do not reorder.
       */
      numeric: {
        true: { fontVariant: theme.typography.fontVariant.tabular },
        false: {},
      },
    },
  },
}));
