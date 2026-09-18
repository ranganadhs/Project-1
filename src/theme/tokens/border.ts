import { StyleSheet } from 'react-native';

export const border = {
  none: 0,
  /** One physical pixel — thinner than 1pt on retina. The default rule weight. */
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  medium: 1.5,
  thick: 2,
  /** Emphasis borders: selected cards, active states. */
  heavy: 3,
} as const;
