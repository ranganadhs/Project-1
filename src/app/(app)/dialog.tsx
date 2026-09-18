import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { VStack, HStack, Text, Button, Icon } from '@/components/ui';

/**
 * A dialog built as a real route on a `transparentModal` presentation, rather
 * than as conditionally-rendered state inside a screen.
 *
 * The payoff: it gets a URL, the back button and hardware back dismiss it for
 * free, and it survives deep links — none of which a boolean `visible` prop
 * gives you.
 */
export default function Dialog() {
  return (
    <View style={styles.root}>
      {/* Own the scrim: transparentModal draws nothing behind the content. */}
      <Pressable
        style={styles.scrim}
        accessibilityRole="button"
        accessibilityLabel="Dismiss dialog"
        onPress={() => router.back()}
      />

      <View style={styles.card}>
        <VStack gap={4}>
          <HStack gap={3}>
            <Icon name="information-circle" sf="info.circle.fill" size="xl" />
            <Text variant="subheading">Transparent modal</Text>
          </HStack>

          <Text variant="callout" tone="secondary">
            The route renders over the previous screen with no background of its own, so the
            scrim above is ours to draw.
            {Platform.OS === 'android'
              ? ' On Android the hardware back button dismisses this, because it is a real route rather than component state.'
              : ' On iOS there is no system dismissal here, so the scrim and the button below are the only exits.'}
          </Text>

          <HStack gap={3} justify="flex-end">
            <Button label="Cancel" variant="ghost" tone="neutral" onPress={() => router.back()} />
            <Button label="Confirm" onPress={() => router.back()} />
          </HStack>
        </VStack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space[6],
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.color.bg.scrim,
  },
  card: {
    width: '100%',
    padding: theme.space[5],
    ...theme.shape.overlay,
    backgroundColor: theme.color.bg.raised,
    ...theme.elevation.xl,
  },
}));
