import { FlashList, type FlashListProps } from '@shopify/flash-list';
import { RefreshControl } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

export type ListProps<T> = FlashListProps<T> & {
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * FlashList, not FlatList.
 *
 * FlatList keeps every rendered row mounted, so a long feed's memory and blank
 * cells during fast scroll get worse the further you go. FlashList recycles row
 * views, which is why it stays flat.
 *
 * Two things that decide whether it actually performs:
 *
 *   1. Rows must be CHEAP. Recycling reuses the view, so heavy per-row work
 *      runs again on every reuse. Memoise rows and hoist their styles.
 *   2. Give the recycled image a `recyclingKey` (see the Image primitive) or a
 *      reused row flashes the previous item's picture.
 *
 * FlashList v2 infers sizing; `estimatedItemSize` is not needed.
 * If rows differ structurally, set `getItemType` — recycling a header view as a
 * content row is the usual cause of visible jank.
 */
export function List<T>({ onRefresh, refreshing = false, ...rest }: ListProps<T>) {
  const { theme } = useUnistyles();

  return (
    <FlashList
      showsVerticalScrollIndicator={false}
      // The first scroll view under a native header or native tab bar is what
      // the OS insets for a large title collapsing or a Liquid Glass bar the
      // content passes beneath. Without this a FlashList screen starts under
      // the chrome while a `Screen scroll` beside it does not.
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.color.fg.tertiary}
            colors={[theme.color.interactive.primary.rest]}
            progressBackgroundColor={theme.color.bg.raised}
          />
        ) : undefined
      }
      {...rest}
    />
  );
}
