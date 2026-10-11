// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { act, useState } from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { CountUp, FadeIn } from './motion';

/**
 * Entrance motion wraps nearly every screen in the app, so the things asserted
 * here are the ones that would break EVERY screen at once if they regressed.
 *
 * What is deliberately NOT asserted: the animation itself. EaseView hands its
 * values to Core Animation / ObjectAnimator and nothing observable happens in
 * Node. Asserting a `transition` prop object would only restate the source.
 *
 * `render` is awaited throughout — RNTL 14 on React 19 renders concurrently and
 * returns a promise, which is why the rest of the suite awaits it too.
 */

describe('FadeIn', () => {
  it('renders its children', async () => {
    // The failure this guards is total: a wrapper that swallowed its subtree
    // would blank every screen it was applied to, and it would typecheck.
    const { getByTestId } = await render(
      <FadeIn>
        <View testID="child" />
      </FadeIn>,
    );
    expect(getByTestId('child')).toBeTruthy();
  });

  it('does not remount its children when the parent re-renders', async () => {
    // FadeIn sits between a screen and its content. If a re-render remounted
    // that subtree, every screen would lose local state and re-fade on any
    // refetch — the exact thing the "mount is the trigger" contract promises
    // it does not do.
    let mounts = 0;
    function Probe() {
      // A useState initialiser runs once per MOUNT and never on re-render,
      // which makes it a mount counter that does not depend on effects being
      // flushed. Same probe technique as media.test.tsx.
      useState(() => {
        mounts += 1;
        return null;
      });
      return <View testID="probe" />;
    }

    const { rerender } = await render(
      <FadeIn index={0}>
        <Probe />
      </FadeIn>,
    );
    await rerender(
      <FadeIn index={3}>
        <Probe />
      </FadeIn>,
    );

    expect(mounts).toBe(1);
  });
});

describe('CountUp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts at `from` and lands exactly on the value', async () => {
    // "Lands EXACTLY" is the assertion that matters. The interpolation only
    // ever gets arbitrarily close to its target, so without the explicit final
    // assignment a score of 68 can rest on screen as 67 — a wrong number, not
    // a rough animation.
    const { getByText } = await render(<CountUp value={68} from={0} />);
    expect(getByText('0')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(getByText('68')).toBeTruthy();
  });

  it('renders a value it is already on without animating', async () => {
    // from === value is the no-op case: a student whose score has not moved
    // should not watch it count 0 → 62 on every visit to the screen.
    const { getByText } = await render(<CountUp value={62} from={62} />);
    expect(getByText('62')).toBeTruthy();
  });

  it('honours precision', async () => {
    const { getByText } = await render(<CountUp value={7.5} from={7.5} precision={1} />);
    expect(getByText('7.5')).toBeTruthy();
  });
});
