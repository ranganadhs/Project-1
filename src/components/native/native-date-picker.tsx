import { Platform } from 'react-native';
// Default export; aliased because the module also exports a same-named symbol.
import NativeDateTimePicker from '@expo/ui/community/datetime-picker';
import { useUnistyles } from 'react-native-unistyles';

export type NativeDatePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  /**
   * iOS: 'compact' (a tappable pill), 'inline' (full calendar), 'spinner'.
   * Android: 'default' (dialog), 'calendar', 'clock', 'spinner'.
   * Leave unset to get each platform's idiomatic default.
   */
  display?: 'default' | 'spinner' | 'compact' | 'inline' | 'calendar' | 'clock';
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
};

/**
 * Native date and time picker: `UIDatePicker` on iOS, Material pickers on Android.
 *
 * The clearest reason to go native: correctness, not aesthetics. The OS control
 * handles locale-specific ordering (D/M/Y vs M/D/Y), 12- vs 24-hour clocks,
 * non-Gregorian calendars, DST boundaries, and per-locale first-day-of-week.
 * Every one of those is a bug waiting to happen in a hand-rolled picker.
 *
 * This drop-in replaces @react-native-community/datetimepicker, so its API is
 * unchanged if you migrate an existing screen.
 */
export function NativeDatePicker({
  value,
  onChange,
  mode = 'date',
  display,
  minimumDate,
  maximumDate,
  disabled = false,
}: NativeDatePickerProps) {
  const { theme, rt } = useUnistyles();

  return (
    <NativeDateTimePicker
      value={value}
      mode={mode}
      // iOS honours a tint on the selection; Android derives from the theme.
      accentColor={theme.color.interactive.primary.rest}
      themeVariant={rt.themeName === 'dark' ? 'dark' : 'light'}
      display={display ?? (Platform.OS === 'ios' ? 'compact' : 'default')}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      disabled={disabled}
      onValueChange={(_event, date) => onChange(date)}
    />
  );
}
