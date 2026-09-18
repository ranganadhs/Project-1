import { useState } from 'react';
import { Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  Screen,
  VStack,
  HStack,
  Text,
  Section,
  Card,
  Divider,
  Badge,
  Button,
  Icon,
  ListItem,
  SegmentedControl,
  ProgressBar,
} from '@/components/ui';
import {
  ContextMenu,
  Menu,
  NativePicker,
  NativeSlider,
  NativeDatePicker,
  type MenuAction,
} from '@/components/native';

const MENU_ACTIONS: MenuAction[] = [
  { id: 'share', title: 'Share', image: 'square.and.arrow.up' },
  { id: 'duplicate', title: 'Duplicate', image: 'plus.square.on.square' },
  {
    id: 'move',
    title: 'Move to',
    image: 'folder',
    subactions: [
      { id: 'move-inbox', title: 'Inbox' },
      { id: 'move-archive', title: 'Archive' },
    ],
  },
  { id: 'pin', title: 'Pin', image: 'pin', state: 'on' },
  {
    id: 'delete',
    title: 'Delete',
    image: 'trash',
    attributes: { destructive: true },
  },
];

const TIMEZONES = [
  { label: 'Asia/Kolkata', value: 'kolkata' },
  { label: 'Europe/London', value: 'london' },
  { label: 'America/New_York', value: 'newyork' },
  { label: 'Australia/Sydney', value: 'sydney' },
] as const;

const RN_ONLY = [
  { value: 'a', label: 'One' },
  { value: 'b', label: 'Two' },
] as const;

export default function Native() {
  const [selected, setSelected] = useState<string>('—');
  const [zone, setZone] = useState<(typeof TIMEZONES)[number]['value']>('kolkata');
  const [volume, setVolume] = useState(0.4);
  const [date, setDate] = useState(new Date());
  const [rnPick, setRnPick] = useState<(typeof RN_ONLY)[number]['value']>('a');

  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="display">Native</Text>
        <Text variant="callout" tone="secondary">
          Real SwiftUI on iOS, Jetpack Compose on Android — via `@expo/ui`. Used only where the
          OS does something JS genuinely cannot.
        </Text>
      </VStack>

      <Card>
        <VStack gap={3}>
          <HStack gap={2}>
            <Icon name="information-circle" sf="info.circle.fill" size="md" />
            <Text variant="label" weight="semibold">
              The trade-off
            </Text>
          </HStack>
          <Text variant="callout" tone="secondary">
            These views are drawn by the OS, so they follow the system look and do not read the
            design tokens. We bridge what the API allows — colour scheme, Material You seed
            colour, and accent tint. Everything else is the platform&apos;s call.
          </Text>
          <Text variant="callout" tone="secondary">
            That is the right trade for menus and pickers, and the wrong one for a branded
            button — which is why Button stays pure React Native.
          </Text>
        </VStack>
      </Card>

      {/* ── Menus ──────────────────────────────────────────────────── */}
      <Section
        title="Menu & context menu"
        footnote="The strongest case for native. No JS fallback exists in this boilerplate because none would be credible."
      >
        <View style={styles.block}>
          <VStack gap={4}>
            <Text variant="callout" tone="secondary">
              {Platform.OS === 'ios'
                ? 'SwiftUI Menu: blur-and-lift preview, submenu chevrons, haptics, and the system dismissal gesture. Destructive actions render red; `state: on` renders a checkmark.'
                : 'Compose DropdownMenu: Material elevation, ripple, and anchored positioning. Submenus render as nested items; SF Symbol names are ignored here — pass an image source for Android icons.'}
            </Text>

            <HStack gap={3} wrap>
              <Menu actions={MENU_ACTIONS} onSelect={setSelected} title="Actions">
                <Button label="Tap for menu" variant="outline" />
              </Menu>

              <ContextMenu actions={MENU_ACTIONS} onSelect={setSelected} title="Actions">
                <Button label="Long-press me" variant="soft" />
              </ContextMenu>
            </HStack>

            <HStack gap={2}>
              <Text variant="label" tone="secondary">
                Last selected:
              </Text>
              <Badge label={selected} tone="brand" />
            </HStack>
          </VStack>
        </View>
      </Section>

      {/* ── Picker ─────────────────────────────────────────────────── */}
      <Section title="Picker" footnote="Our SegmentedControl handles 2–4 short options. Past that, this is the correct control.">
        <View style={styles.block}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text variant="label" tone="secondary">
                Native picker — menu appearance
              </Text>
              <NativePicker options={TIMEZONES} value={zone} onChange={setZone} appearance="menu" />
            </VStack>

            <VStack gap={2}>
              <Text variant="label" tone="secondary">
                Native picker — wheel appearance
              </Text>
              <NativePicker options={TIMEZONES} value={zone} onChange={setZone} appearance="wheel" />
            </VStack>

            <Divider />

            <VStack gap={2}>
              <HStack gap={2}>
                <Text variant="label" tone="secondary">
                  For comparison — our RN SegmentedControl
                </Text>
                <Badge label="tokens" tone="success" />
              </HStack>
              <SegmentedControl options={RN_ONLY} value={rnPick} onChange={setRnPick} />
              <Text variant="caption" tone="tertiary">
                Fully themed, but cannot scale past a handful of short labels.
              </Text>
            </VStack>
          </VStack>
        </View>
      </Section>

      {/* ── Slider ─────────────────────────────────────────────────── */}
      <Section title="Slider" footnote="Native for feel, not looks — touch slop, drag momentum, and VoiceOver/TalkBack increments are the OS's.">
        <View style={styles.block}>
          <VStack gap={5}>
            <VStack gap={2}>
              <HStack gap={2} justify="space-between">
                <Text variant="label" tone="secondary">
                  Native slider
                </Text>
                <Badge label={volume.toFixed(2)} />
              </HStack>
              <NativeSlider value={volume} onValueChange={setVolume} min={0} max={1} />
            </VStack>

            <Divider />

            <VStack gap={2}>
              <Text variant="label" tone="secondary">
                For comparison — our RN ProgressBar (display only, not interactive)
              </Text>
              <ProgressBar value={volume} />
            </VStack>
          </VStack>
        </View>
      </Section>

      {/* ── Date picker ────────────────────────────────────────────── */}
      <Section
        title="Date & time"
        footnote="Native for correctness: locale ordering, 12/24h, non-Gregorian calendars, DST, first-day-of-week."
      >
        <View style={styles.block}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text variant="label" tone="secondary">
                {Platform.OS === 'ios' ? 'Compact — a tappable pill' : 'Default — opens a dialog'}
              </Text>
              <NativeDatePicker value={date} onChange={setDate} mode="date" />
            </VStack>

            <VStack gap={2}>
              <Text variant="label" tone="secondary">
                Time
              </Text>
              <NativeDatePicker value={date} onChange={setDate} mode="time" />
            </VStack>

            <Text variant="caption" tone="tertiary">
              Selected: {date.toLocaleString()}
            </Text>
          </VStack>
        </View>
      </Section>

      {/* ── Guidance ───────────────────────────────────────────────── */}
      <Section title="When to reach for native">
        <ListItem
          title="Menus & context menus"
          subtitle="Always native — no credible JS equivalent"
          leading={<Icon name="ellipsis-horizontal-circle" sf="ellipsis.circle" size="md" />}
          trailing={<Badge label="native" tone="brand" />}
        />
        <Divider inset />
        <ListItem
          title="Pickers, sliders, date & time"
          subtitle="Native — OS owns feel, locale, and accessibility"
          leading={<Icon name="options" sf="slider.horizontal.3" size="md" />}
          trailing={<Badge label="native" tone="brand" />}
        />
        <Divider inset />
        <ListItem
          title="Buttons, cards, badges, banners"
          subtitle="React Native — must carry your brand exactly"
          leading={<Icon name="color-palette" sf="paintpalette.fill" size="md" />}
          trailing={<Badge label="tokens" tone="success" />}
        />
        <Divider inset />
        <ListItem
          title="Tab bars, sheets, modals"
          subtitle="Native via expo-router & react-native-screens"
          leading={<Icon name="layers" sf="square.3.layers.3d" size="md" />}
          trailing={<Badge label="native" tone="brand" />}
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  block: {
    padding: theme.space[4],
  },
}));
