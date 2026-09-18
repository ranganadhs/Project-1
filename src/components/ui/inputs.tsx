import { useState } from 'react';
import {
  Platform,
  Switch as RNSwitch,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from './text';

/** Themed switch. Wraps the platform control rather than redrawing it. */
export function Switch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { theme } = useUnistyles();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      // iOS tints the whole track; Android tints thumb and track separately.
      trackColor={{
        false: theme.color.border.default,
        true: theme.color.interactive.primary.rest,
      }}
      thumbColor={Platform.OS === 'android' ? theme.color.bg.raised : undefined}
      ios_backgroundColor={theme.color.border.default}
    />
  );
}

export type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, style, ...rest }: TextFieldProps) {
  const { theme } = useUnistyles();
  const [focused, setFocused] = useState(false);

  styles.useVariants({ state: error ? 'error' : focused ? 'focused' : 'rest' });

  return (
    <View style={styles.fieldGroup}>
      {label ? (
        <Text variant="label" tone="secondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={theme.color.fg.tertiary}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  fieldGroup: {
    gap: theme.space[1.5],
  },
  input: {
    minHeight: theme.size.control.md,
    paddingHorizontal: theme.space[3],
    ...theme.shape.field,
    borderWidth: theme.border.thin,
    backgroundColor: theme.color.bg.raised,
    color: theme.color.fg.primary,
    fontSize: theme.typography.fontSize.md,
    variants: {
      state: {
        rest: { borderColor: theme.color.border.default },
        focused: { borderColor: theme.color.border.focus },
        error: { borderColor: theme.color.status.danger.fg },
      },
    },
  },
}));
