import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { PressableScale, type PressableScaleProps } from './pressable-scale';
import { Text } from './text';

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';
export type ButtonTone = 'brand' | 'neutral' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableScaleProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function Button({
  label,
  variant = 'solid',
  tone = 'brand',
  size = 'md',
  loading = false,
  fullWidth = false,
  leading,
  trailing,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { theme } = useUnistyles();
  const isInert = disabled === true || loading;

  styles.useVariants({ variant, tone, size, fullWidth, disabled: isInert });

  // The pairing rule, at the point it actually bites.
  //
  // A SOLID button has a brand-coloured fill in BOTH themes, so its label must
  // not follow the theme — `onBrand` is bound to that fill and stays legible on
  // it (white in light, dark in dark, because the dark fill is luminous).
  //
  // Every other variant is transparent or tinted, so the label sits on the
  // normal page surface and SHOULD follow the theme like any other text.
  //
  // Never replace this with `isDark ? …` or a hex — see CLAUDE.md, "pairing
  // tokens". If a new variant needs a colour this cannot express, the theme is
  // missing a token.
  const labelTone =
    variant === 'solid' ? 'onBrand' : tone === 'danger' ? 'danger' : tone === 'brand' ? 'brand' : 'primary';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      disabled={isInert}
      style={[styles.base, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'solid' ? theme.color.fg.onBrand : theme.color.interactive.primary.rest}
        />
      ) : (
        <>
          {leading ? <View>{leading}</View> : null}
          <Text variant={size === 'sm' ? 'label' : 'body'} weight="semibold" tone={labelTone}>
            {label}
          </Text>
          {trailing ? <View>{trailing}</View> : null}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    ...theme.shape.button,
    borderWidth: theme.border.none,
    borderColor: theme.color.border.default,

    variants: {
      size: {
        sm: {
          minHeight: theme.size.control.sm,
          paddingHorizontal: theme.space[3],
        },
        md: {
          minHeight: theme.size.control.md,
          paddingHorizontal: theme.space[5],
        },
        lg: {
          minHeight: theme.size.control.lg,
          paddingHorizontal: theme.space[6],
        },
      },
      variant: {
        solid: {},
        soft: {},
        outline: { borderWidth: theme.border.thin },
        ghost: {},
      },
      tone: {
        brand: {},
        neutral: {},
        danger: {},
      },
      fullWidth: {
        true: { alignSelf: 'stretch' },
        false: { alignSelf: 'flex-start' },
      },
      disabled: {
        true: { opacity: theme.opacity.disabled },
        false: {},
      },
    },

    compoundVariants: [
      // solid
      {
        variant: 'solid',
        tone: 'brand',
        styles: { backgroundColor: theme.color.interactive.primary.rest },
      },
      {
        variant: 'solid',
        tone: 'neutral',
        styles: { backgroundColor: theme.color.interactive.secondary.rest },
      },
      {
        variant: 'solid',
        tone: 'danger',
        // interactive.danger.rest, NOT status.danger.fg. `status.*.fg` is a
        // TEXT colour — sized to be legible ON the matching tint — so using it
        // as a fill both looked wrong and left the button with no pressed or
        // disabled state, since a text token has no state ladder. Only
        // `interactive.*` carries one; see themes.test.ts.
        styles: { backgroundColor: theme.color.interactive.danger.rest },
      },
      // soft
      {
        variant: 'soft',
        tone: 'brand',
        // bg.brandSubtle, NOT bg.sunken. On the neutral well a soft BRAND
        // button is indistinguishable from a soft neutral one — the tone prop
        // has no visible effect at this variant. themes.test.ts guards it.
        styles: { backgroundColor: theme.color.bg.brandSubtle },
      },
      {
        variant: 'soft',
        tone: 'neutral',
        styles: { backgroundColor: theme.color.interactive.secondary.rest },
      },
      {
        variant: 'soft',
        tone: 'danger',
        styles: { backgroundColor: theme.color.status.danger.bg },
      },
      // outline
      {
        variant: 'outline',
        tone: 'brand',
        styles: { borderColor: theme.color.interactive.primary.rest },
      },
      {
        variant: 'outline',
        tone: 'neutral',
        styles: { borderColor: theme.color.border.strong },
      },
      {
        variant: 'outline',
        tone: 'danger',
        styles: { borderColor: theme.color.status.danger.border },
      },
    ],
  },
}));
