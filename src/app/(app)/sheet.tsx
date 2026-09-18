import { Platform } from 'react-native';
import { router } from 'expo-router';
import { Screen, VStack, HStack, Text, Button, Divider, Badge, ListItem, Icon } from '@/components/ui';

/**
 * Rendered inside a native `formSheet`. The detents, grabber, and corner radius
 * are configured on the Stack.Screen in (app)/_layout.tsx — this file is just
 * the content.
 */
export default function Sheet() {
  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="title">Native bottom sheet</Text>
        <Text variant="callout" tone="secondary">
          `presentation: &apos;formSheet&apos;` from react-native-screens. No third-party sheet
          library — this is the OS control.
        </Text>
      </VStack>

      <VStack gap={3}>
        <HStack gap={2}>
          <Badge label={Platform.OS === 'ios' ? 'iOS' : 'Android'} tone="brand" />
          <Badge label="3 detents" tone="info" />
        </HStack>
        <Text variant="callout" tone="secondary">
          {Platform.OS === 'ios'
            ? 'Drag the grabber between 35%, 60% and 95%. The first detent is undimmed, so the screen behind stays interactive — the “peek” pattern Maps uses. iOS accepts any number of detents.'
            : 'Drag between 35%, 60% and 95%. ANDROID IS CAPPED AT THREE DETENTS — extra values are silently ignored. The grabber and corner radius props are iOS-only; Android uses its own Material sheet chrome.'}
        </Text>
      </VStack>

      <Divider />

      <VStack gap={0}>
        <ListItem
          title="Scroll expands the sheet"
          subtitle="sheetExpandsWhenScrolledToEdge"
          leading={<Icon name="resize" sf="arrow.up.and.down" size="md" />}
        />
        <Divider inset />
        <ListItem
          title="Swipe down to dismiss"
          subtitle="Native gesture, no JS involved"
          leading={<Icon name="chevron-down" sf="chevron.down" size="md" />}
        />
      </VStack>

      <Button label="Close" fullWidth tone="neutral" onPress={() => router.back()} />
    </Screen>
  );
}
