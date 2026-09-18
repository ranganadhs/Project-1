import { Platform } from 'react-native';
import { router } from 'expo-router';
import {
  Screen,
  VStack,
  HStack,
  Text,
  Section,
  ListItem,
  Divider,
  Icon,
  Badge,
  Card,
} from '@/components/ui';

/**
 * Every navigation presentation, reachable in one tap. The platform notes are
 * rendered from Platform.OS so the same build tells you what THIS platform does.
 */
export default function Patterns() {
  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="display">Navigation</Text>
        <Text variant="callout" tone="secondary">
          Each row opens a real route. Run this on both platforms — the presentations diverge in
          ways worth seeing.
        </Text>
      </VStack>

      <Card>
        <HStack gap={3}>
          <Icon
            name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'}
            sf={Platform.OS === 'ios' ? 'apple.logo' : undefined}
            size="lg"
          />
          <VStack gap={0.5} style={{ flex: 1 }}>
            <Text variant="label" weight="semibold">
              You are on {Platform.OS === 'ios' ? 'iOS' : 'Android'}
            </Text>
            <Text variant="caption" tone="secondary">
              Notes below describe this platform&apos;s behaviour.
            </Text>
          </VStack>
        </HStack>
      </Card>

      <Section title="Stack" footnote="The default presentation. Adds to the back history.">
        <ListItem
          title="Push a screen"
          subtitle={
            Platform.OS === 'ios'
              ? 'Slides from the trailing edge, interactive edge-swipe back'
              : 'Material slide-up, hardware back pops it'
          }
          leading={<Icon name="albums" sf="rectangle.stack.fill" size="md" />}
          onPress={() => router.push('/detail?from=patterns')}
        />
      </Section>

      <Section
        title="Sheets and modals"
        footnote="react-native-screens presentations — all native, no sheet library."
      >
        <ListItem
          title="Bottom sheet"
          subtitle={
            Platform.OS === 'ios'
              ? '3 detents, grabber, first detent undimmed'
              : '3 detents max — extras are ignored on Android'
          }
          leading={<Icon name="layers" sf="square.3.layers.3d.down.right" size="md" />}
          trailing={<Badge label="formSheet" tone="brand" />}
          onPress={() => router.push('/sheet')}
        />
        <Divider inset />
        <ListItem
          title="Modal"
          subtitle={
            Platform.OS === 'ios'
              ? 'Card that reveals the parent behind it'
              : 'Presents full screen — no card modal on Android'
          }
          leading={<Icon name="browsers" sf="rectangle.portrait.on.rectangle.portrait" size="md" />}
          trailing={<Badge label="modal" tone="warning" />}
          onPress={() => router.push('/modal')}
        />
        <Divider inset />
        <ListItem
          title="Full screen modal"
          subtitle="Covers everything, no drag to dismiss"
          leading={<Icon name="expand" sf="arrow.up.left.and.arrow.down.right" size="md" />}
          trailing={<Badge label="fullScreenModal" tone="success" />}
          onPress={() => router.push('/fullscreen')}
        />
        <Divider inset />
        <ListItem
          title="Transparent dialog"
          subtitle="A dialog as a route — gets back-button dismissal free"
          leading={<Icon name="chatbox-ellipses" sf="bubble.left.fill" size="md" />}
          trailing={<Badge label="transparentModal" tone="info" />}
          onPress={() => router.push('/dialog')}
        />
      </Section>

      <Section title="Tabs" footnote="Native tab bars: UITabBarController on iOS, Material on Android.">
        <ListItem
          title="Switch to Settings"
          subtitle="Tab state is preserved per tab — each keeps its own stack"
          leading={<Icon name="grid" sf="square.grid.2x2.fill" size="md" />}
          onPress={() => router.navigate('/settings')}
        />
      </Section>

      <Section title="Dismissal">
        <ListItem
          title="dismissTo('/')"
          subtitle="Unwinds the stack to a specific route rather than popping one at a time"
          leading={<Icon name="return-down-back" sf="arrow.uturn.backward" size="md" />}
          onPress={() => router.dismissTo('/')}
        />
      </Section>
    </Screen>
  );
}
