import { Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { HStack, Spacer, VStack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';

/**
 * A card's title row, optionally with a trailing text action ("View all ›").
 *
 * The action is a `Pressable` with an enlarged hit slop rather than a bare
 * `Text` with `onPress`: the label is ~11pt, which is well under the 44pt touch
 * floor, and a tap target you can miss is worse than no shortcut at all.
 *
 * ── THE SUBTITLE IS NOT IN THE TITLE ROW, AND THAT IS THE FIX ─────────────
 * Title, subtitle, `Spacer` and action used to share ONE `HStack` with no flex
 * constraint on any of them. Nothing shrank and nothing truncated, so a long
 * subtitle simply ate the width and shoved the action off the card — the Score
 * tab's Attempt history row rendered "…practice you have taken**Vi**", clipped
 * by the screen edge. `Spacer` cannot help: it distributes FREE space, and
 * there was none left.
 *
 * Constraining the row would only have chosen which text to damage. Taking the
 * subtitle OUT of the row makes the failure unwriteable instead (lessons §4):
 * a full-width line of its own cannot compete with the action for horizontal
 * space, because it is no longer in the same axis as it.
 *
 * ── WHY THAT WAS WORTH DOING IN THE COMPONENT ────────────────────────────
 * The second instance is DATA-DRIVEN. `home-screen` passes `cohort?.label`
 * off the wire; this staging account's is short or null, so Home looks correct,
 * and a student in "Grade 9 · Section A · St. Xavier's High School" gets the
 * clipped action that no amount of UAT on this account would ever show. Same
 * shape as the header avatar: the environment happens to be passing.
 *
 * The title row itself is UNCHANGED — same `HStack`, same `align="baseline"` —
 * so the seven call sites that pass no subtitle render exactly as they did.
 */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useUnistyles();

  return (
    <VStack gap={1}>
      <HStack align="baseline">
        {/*
          `flexShrink` on both, in opposite directions, so that if the TITLE
          ever grows past the row the pressure lands on the text rather than on
          the control. Every title today is a hardcoded literal, so this is
          defence rather than a fix — but it is the same one line that would
          have contained the subtitle, and a `Pressable` that can be squeezed to
          nothing is worth ruling out once.
        */}
        <Text variant="heading" style={styles.title}>
          {title}
        </Text>
        <Spacer />
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            onPressIn={haptics.soft}
            hitSlop={theme.hitSlop.lg}
            accessibilityRole="button"
            // "See all" alone is ambiguous with several sections on one screen.
            accessibilityLabel={`${actionLabel}, ${title}`}
            style={styles.action}
          >
            <Text variant="body" tone="brand" weight="semibold">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </HStack>
      {/*
        A SLOT, null when empty, rather than a branch that changes the tree.
        `cohort?.label` arrives from the wire, so this really does flip from
        absent to present on a mounted component — and swapping which elements
        exist under a live parent is trap 13's shape.
      */}
      {subtitle ? (
        <Text variant="caption" tone="secondary">
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}

const styles = StyleSheet.create(() => ({
  title: { flexShrink: 1 },
  action: { flexShrink: 0 },
}));
