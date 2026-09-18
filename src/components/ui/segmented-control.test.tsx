// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { render, screen } from '@testing-library/react-native';
import { SegmentedControl, TRACK_INSET, segmentWidthFor } from './segmented-control';
import { light } from '@/theme/themes/light';

/**
 * Guards the pill's geometry against the track's padding.
 *
 * ── THE BUG THIS EXISTS FOR ───────────────────────────────────────────────
 * The pill is absolutely positioned, so its WIDTH is computed in JS while its
 * INSET comes from the stylesheet. Two separate mechanisms reading one value,
 * and nothing made them agree — so a restyle that moves the track's padding
 * leaves the JS constant behind.
 *
 * Every segment is then a few points too wide. That is invisible on the first
 * segment and accumulates, so the only place it shows is the LAST one, whose
 * right edge lands on the track's OUTER edge with no right padding at all while
 * every other side keeps its inset. It reaches you as a screenshot; typecheck
 * and lint cannot see arithmetic that disagrees with a stylesheet.
 *
 * TWO things are asserted, and both are needed. `segmentWidthFor` is correct
 * for whatever inset it is handed, so the arithmetic test alone would pass
 * throughout the bug — what would be wrong is the value being handed in. The
 * stylesheet test closes that half.
 */
const TRACK_WIDTH = 320;

describe('segmentWidthFor', () => {
  it.each([2, 3, 4, 5])(
    'lands the last segment on the track inner edge with %i segments',
    (count) => {
      const inset = light.space[TRACK_INSET];
      const width = segmentWidthFor(TRACK_WIDTH, count, inset);

      // The pill starts at `inset` and the last one is translated by
      // (count - 1) * width, so its right edge is inset + count * width.
      expect(inset + count * width).toBeCloseTo(TRACK_WIDTH - inset, 5);
    },
  );

  it('divides the PADDED width, not the full width', () => {
    const inset = light.space[TRACK_INSET];
    expect(segmentWidthFor(TRACK_WIDTH, 2, inset)).toBeCloseTo((TRACK_WIDTH - inset * 2) / 2, 5);
    // The bug in one line: dividing the full width overflows by exactly 2*inset.
    expect(segmentWidthFor(TRACK_WIDTH, 2, inset)).not.toBeCloseTo(TRACK_WIDTH / 2, 5);
  });

  it('reports zero before the track has been measured, so nothing flashes at x=0', () => {
    expect(segmentWidthFor(0, 3, light.space[TRACK_INSET])).toBe(0);
  });
});

describe('SegmentedControl stylesheet', () => {
  it('pads the track with the same constant the geometry uses', async () => {
    await render(
      <SegmentedControl
        options={[
          { value: 'a', label: 'One' },
          { value: 'b', label: 'Two' },
        ]}
        value="a"
        onChange={() => {}}
      />,
    );

    const style = screen.getByTestId('segmented-control').props.style as { padding?: number };
    expect(style.padding).toBe(light.space[TRACK_INSET]);
  });

  /**
   * A segment IS the tap target, so it cannot sit under the touch floor
   * (`size.control.sm` is 32pt; a segment reading it is under the floor).
   *
   * Asserted against what the component RENDERS, not against the token ladder —
   * `control.md >= touchTarget` is true whether or not the segment reads it, so
   * a ladder assertion passes with the bug in place.
   */
  it('gives every segment at least the minimum touch target', async () => {
    await render(
      <SegmentedControl
        options={[
          { value: 'a', label: 'One' },
          { value: 'b', label: 'Two' },
        ]}
        value="a"
        onChange={() => {}}
      />,
    );

    const segments = screen.getAllByRole('tab');
    expect(segments.length).toBe(2);
    for (const segment of segments) {
      const style = segment.props.style as { minHeight?: number };
      expect(style.minHeight).toBeGreaterThanOrEqual(light.size.touchTarget);
    }
  });
});
