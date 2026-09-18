import { Slider } from '@expo/ui';
import { NativeHost } from './native-host';

export type NativeSliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Omit for a continuous slider; set for detented steps. */
  step?: number;
  disabled?: boolean;
};

/**
 * Native slider: SwiftUI `Slider` on iOS, Material `Slider` on Android.
 *
 * Going native matters here for feel rather than looks — the OS owns the touch
 * slop, the drag momentum, and the accessibility increment behaviour that
 * VoiceOver and TalkBack drive. A JS reimplementation gets the visuals right and
 * the interaction subtly wrong.
 */
export function NativeSlider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step,
  disabled = false,
}: NativeSliderProps) {
  return (
    <NativeHost sizing="hug">
      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </NativeHost>
  );
}
