// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PressableScale } from './pressable-scale';
import { light } from '@/theme/themes/light';

const flatten = (style: unknown): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value && typeof value === 'object') Object.assign(out, value);
  };
  walk(style);
  return out;
};

/**
 * Press feedback is a CSS transition driven by pressed state — no shared value,
 * no worklet. What Jest can see: the transition is declared from tokens, the
 * scale follows the press edges, and the target comes from motion tokens.
 * Whether it FEELS right is a device question.
 */
describe('PressableScale', () => {
  it('declares a token-driven transform transition', async () => {
    await render(
      <PressableScale testID="press">
        <Text>tap</Text>
      </PressableScale>,
    );
    const style = flatten(screen.getByTestId('press').props.style);
    expect(style.transitionProperty).toBe('transform');
    expect(style.transitionDuration).toBe(light.motion.duration.press);
    expect(style.transitionTimingFunction).toEqual(
      expect.objectContaining({ type: 'cubicBezier' }),
    );
  });

  it('scales to the token target while pressed and back to 1 on release', async () => {
    await render(
      <PressableScale testID="press">
        <Text>tap</Text>
      </PressableScale>,
    );
    const scaleOf = () =>
      (flatten(screen.getByTestId('press').props.style).transform as { scale: number }[])[0]
        ?.scale;

    expect(scaleOf()).toBe(1);
    // The press edges set React state, and React 19 batches that past the
    // synchronous event — flush it before reading the re-rendered style.
    await act(async () => fireEvent(screen.getByTestId('press'), 'pressIn'));
    expect(scaleOf()).toBe(light.motion.pressScale.subtle);
    await act(async () => fireEvent(screen.getByTestId('press'), 'pressOut'));
    expect(scaleOf()).toBe(1);
  });

  it('expands the touch target by the small hit slop unless overridden', async () => {
    await render(
      <PressableScale testID="press">
        <Text>tap</Text>
      </PressableScale>,
    );
    expect(screen.getByTestId('press').props.hitSlop).toEqual(light.hitSlop.sm);
  });
});
