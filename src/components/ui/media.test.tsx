// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { useState } from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { Gradient } from './media';
import { light } from '@/theme/themes/light';

/**
 * Two properties of `Gradient` that no gate can otherwise see.
 */

/**
 * A `useState` initialiser runs once per MOUNT and never on re-render, which
 * makes it a mount counter that does not depend on effects being flushed.
 */
function makeProbe() {
  const state = { mounts: 0 };
  function Probe() {
    useState(() => {
      state.mounts += 1;
      return null;
    });
    return <View testID="probe" />;
  }
  return { state, Probe };
}

/** Every backgroundColor on the rendered root, however the style was composed. */
function backgroundOf(json: unknown): unknown {
  const style = (json as { props?: { style?: unknown } })?.props?.style;
  const out: Record<string, unknown> = {};
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value && typeof value === 'object') Object.assign(out, value);
  };
  walk(style);
  return out.backgroundColor;
}

const A = ['#101828', '#475467'] as const;
const B = ['#7F56D9', '#B692F6'] as const;

describe('Gradient element tree', () => {
  /**
   * Guards trap 13. `Gradient` wraps whole screens, so if it ever returns a
   * DIFFERENT element tree for some stops than for others — a plain `<View>`
   * when the stops happen to match, say — React reconciles by position, matches
   * the children against the wrong slot, and tears down and rebuilds everything
   * under it. A theme toggle would then throw away scroll position and every
   * piece of local state on the screen.
   */
  it('keeps its children mounted when the stops change', async () => {
    const { state, Probe } = makeProbe();

    const { rerender } = await render(
      <Gradient colors={A}>
        <Probe />
      </Gradient>,
    );
    expect(state.mounts).toBe(1);

    await rerender(
      <Gradient colors={B}>
        <Probe />
      </Gradient>,
    );
    // Re-rendered, not re-mounted. A second mount here means the tree changed
    // shape and every screen under a Gradient would flicker and lose its state.
    expect(state.mounts).toBe(1);
  });

  /**
   * There must never be a frame where nothing is painting. A transparent view
   * shows the bare native root through it, which reads as a flash of the wrong
   * colour — the same class of failure as trap 5.
   */
  it('always paints an opaque floor, taken from its first stop', async () => {
    const { toJSON } = await render(
      <Gradient colors={A}>
        <View />
      </Gradient>,
    );
    expect(backgroundOf(toJSON())).toBe(A[0]);
  });

  it('defaults its stops to the theme brand gradient', async () => {
    const { toJSON } = await render(
      <Gradient>
        <View />
      </Gradient>,
    );
    expect(backgroundOf(toJSON())).toBe(light.color.gradient.brand[0]);
  });
});

/**
 * Guards trap 16. Asymmetric corners make iOS mask the view and the gradient
 * layer is masked out with it, leaving only the opaque floor — a perfectly
 * plausible flat card, with correct tokens, correct types and correct styles.
 * Nothing but a device catches it, so the component says so itself.
 */
describe('Gradient asymmetric-radius warning', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('warns when the corners disagree with each other', async () => {
    await render(
      <Gradient
        colors={A}
        style={{ ...light.shape.card, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <View />
      </Gradient>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Gradient]'));
  });

  it('warns when one corner is set and the rest are implicitly square', async () => {
    await render(
      <Gradient colors={A} style={{ borderTopLeftRadius: 16 }}>
        <View />
      </Gradient>,
    );
    expect(warn).toHaveBeenCalled();
  });

  it('stays quiet for a uniform radius spread in from a shape token', async () => {
    await render(
      <Gradient colors={A} style={light.shape.card}>
        <View />
      </Gradient>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays quiet when every corner is set to the same value', async () => {
    await render(
      <Gradient
        colors={A}
        style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <View />
      </Gradient>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays quiet when no radius is given at all', async () => {
    await render(
      <Gradient colors={A}>
        <View />
      </Gradient>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});
