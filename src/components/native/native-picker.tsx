import { Picker } from '@expo/ui';
import { NativeHost } from './native-host';

export type NativePickerOption<T extends string | number> = {
  label: string;
  value: T;
};

export type NativePickerProps<T extends string | number> = {
  options: readonly NativePickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * 'wheel' is the classic iOS drum / Android scroll picker — good for long
   * ordered lists like dates or durations.
   * 'menu' is a compact button that opens the platform menu — good when the
   * field is one row in a form.
   */
  appearance?: 'wheel' | 'menu';
  enabled?: boolean;
};

/**
 * Native picker: SwiftUI `Picker` on iOS, Compose on Android.
 *
 * Worth going native for: the wheel's inertia, snapping, and accessibility all
 * come from the OS. Our `SegmentedControl` only works for two to four short
 * options — past that this is the correct control.
 */
export function NativePicker<T extends string | number>({
  options,
  value,
  onChange,
  appearance = 'menu',
  enabled = true,
}: NativePickerProps<T>) {
  return (
    <NativeHost sizing="hug">
      <Picker
        selectedValue={value}
        onValueChange={(next) => onChange(next as T)}
        appearance={appearance}
        enabled={enabled}
      >
        {options.map((option) => (
          <Picker.Item key={String(option.value)} label={option.label} value={option.value} />
        ))}
      </Picker>
    </NativeHost>
  );
}
