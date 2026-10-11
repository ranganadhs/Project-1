// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { render } from '@testing-library/react-native';
import { SectionHeader } from './section-header';

/**
 * The row that pushed its own action off the card.
 *
 * ── WHAT THIS CAN AND CANNOT SEE ──────────────────────────────────────────
 * It cannot see the bug. The bug is that a long subtitle consumed the row's
 * width and shoved "View all" past the card's right edge, and nothing in Jest
 * measures anything — there is no layout pass, so every node here is zero by
 * zero. A test that claimed to assert the action "still fits" would be pure
 * decoration, and this file would rather say so than imply cover it does not
 * have (lessons §6, §7).
 *
 * What it CAN see, and what actually fixes it, is STRUCTURE: the subtitle is no
 * longer in the same row as the action, so the two cannot compete for
 * horizontal space at all. That is a fact about the tree, and the tree is the
 * one thing the mock renders faithfully — the same reason `screen.test.tsx`
 * asserts the header is not a descendant of the scroller rather than asserting
 * where it ends up on screen.
 *
 * Confirmed by reintroducing the original single-`HStack` layout, which turns
 * the first two tests red.
 *
 * Pixel behaviour is a device check and stays one.
 */

const LONG = 'Every challenge and practice you have taken';

const flatten = (style: unknown): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value && typeof value === 'object') Object.assign(out, value);
  };
  walk(style);
  return out;
};

type Node = { parent?: unknown; children?: unknown[]; props?: Record<string, unknown> } | null;

/** The row the action sits in — the nearest ancestor laid out horizontally. */
function rowContaining(node: Node): Node {
  let current = node;
  while (current) {
    if (flatten(current.props?.style).flexDirection === 'row') return current;
    current = (current.parent ?? null) as Node;
  }
  return null;
}

/** Whether `text` appears anywhere beneath `node`. */
function contains(node: Node, text: string): boolean {
  if (!node || typeof node !== 'object') return false;
  if (node.children?.some((child) => child === text)) return true;
  return (node.children ?? []).some((child) => contains(child as Node, text));
}

describe('SectionHeader with both a subtitle and an action', () => {
  it('keeps the subtitle out of the row the action lays out in', async () => {
    const { getByText } = await render(
      <SectionHeader
        title="Attempt history"
        subtitle={LONG}
        actionLabel="View all"
        onAction={() => undefined}
      />,
    );
    const row = rowContaining(getByText('View all').parent as Node);
    expect(row).not.toBeNull();
    // The title IS in that row, so the assertion below cannot pass by having
    // walked up to the wrong element and found nothing in it.
    expect(contains(row, 'Attempt history')).toBe(true);
    expect(contains(row, LONG)).toBe(false);
  });

  it('still renders the subtitle somewhere', async () => {
    // Taking it out of the row must not mean dropping it. It is the copy that
    // explains the card.
    const { getByText } = await render(
      <SectionHeader
        title="Attempt history"
        subtitle={LONG}
        actionLabel="View all"
        onAction={() => undefined}
      />,
    );
    expect(getByText(LONG)).toBeTruthy();
  });
});

/**
 * The seven call sites that pass no subtitle must be untouched. The fix is only
 * worth having if it did not cost the common case its layout.
 */
describe('SectionHeader without a subtitle', () => {
  it('leaves the title and its action sharing one row', async () => {
    const { getByText } = await render(
      <SectionHeader title="Comments" actionLabel="View all" onAction={() => undefined} />,
    );
    const row = rowContaining(getByText('View all').parent as Node);
    expect(contains(row, 'Comments')).toBe(true);
  });

  it('renders a bare title with no action at all', async () => {
    const { getByText, queryByRole } = await render(<SectionHeader title="Dimension breakdown" />);
    expect(getByText('Dimension breakdown')).toBeTruthy();
    expect(queryByRole('button')).toBeNull();
  });
});
