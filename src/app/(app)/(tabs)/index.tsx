import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  AreaChart,
  Screen,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Section,
  ListItem,
  Divider,
  Badge,
  Chip,
  Banner,
  Spinner,
  ProgressBar,
  Skeleton,
  Switch,
  TextField,
  SegmentedControl,
  Icon,
} from '@/components/ui';

const DENSITY = [
  { value: 'compact', label: 'Compact' },
  { value: 'cosy', label: 'Cosy' },
  { value: 'roomy', label: 'Roomy' },
] as const;

export default function Components() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [density, setDensity] = useState<(typeof DENSITY)[number]['value']>('cosy');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="display">Components</Text>
        <Text variant="callout" tone="secondary">
          Every primitive, every variant. All styling resolves to design tokens — a raw hex or
          spacing literal fails lint.
        </Text>
      </VStack>

      {/* ── Typography ─────────────────────────────────────────────── */}
      <Section title="Typography">
        <View style={styles.block}>
          <VStack gap={2}>
            <Text variant="display">Display</Text>
            <Text variant="title">Title</Text>
            <Text variant="heading">Heading</Text>
            <Text variant="subheading">Subheading</Text>
            <Text variant="body">Body — the default reading size.</Text>
            <Text variant="callout" tone="secondary">
              Callout, secondary tone.
            </Text>
            <Text variant="label" tone="tertiary">
              Label, tertiary tone.
            </Text>
            <Text variant="caption" tone="tertiary">
              Caption — the smallest step.
            </Text>
          </VStack>
        </View>
      </Section>

      {/* ── Buttons ────────────────────────────────────────────────── */}
      <Section title="Buttons" footnote="variant × tone × size, plus loading and icon slots.">
        <View style={styles.block}>
          <VStack gap={4}>
            <HStack gap={2} wrap>
              <Button label="Solid" />
              <Button label="Soft" variant="soft" />
              <Button label="Outline" variant="outline" />
              <Button label="Ghost" variant="ghost" />
            </HStack>

            <HStack gap={2} wrap>
              <Button label="Neutral" tone="neutral" />
              <Button label="Danger" tone="danger" />
              <Button label="Danger soft" tone="danger" variant="soft" />
            </HStack>

            <HStack gap={2} wrap align="center">
              <Button label="Small" size="sm" />
              <Button label="Medium" size="md" />
              <Button label="Large" size="lg" />
            </HStack>

            <HStack gap={2} wrap>
              <Button label="Disabled" disabled />
              <Button
                label={loading ? 'Loading' : 'Tap to load'}
                loading={loading}
                onPress={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1600);
                }}
              />
            </HStack>

            <Button
              label="With an icon"
              variant="outline"
              leading={<Icon name="sparkles" sf="sparkles" size="sm" />}
            />

            <Button label="Full width" fullWidth />
          </VStack>
        </View>
      </Section>

      {/* ── Form controls ──────────────────────────────────────────── */}
      <Section title="Form controls">
        <View style={styles.block}>
          <VStack gap={5}>
            <TextField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              hint="Border switches to the focus token while editing."
            />
            <TextField
              label="With an error"
              placeholder="Something invalid"
              defaultValue="not-an-email"
              error="That does not look like an email address."
            />
            <VStack gap={2}>
              <Text variant="label" tone="secondary">
                Density
              </Text>
              <SegmentedControl options={DENSITY} value={density} onChange={setDensity} />
            </VStack>
          </VStack>
        </View>
      </Section>

      {/* ── Grouped rows ───────────────────────────────────────────── */}
      <Section title="Grouped rows" footnote="The native settings idiom — rows flush inside a rounded group.">
        <ListItem
          title="Push notifications"
          subtitle="Native switch, themed via tokens"
          leading={<Icon name="notifications" sf="bell.fill" size="md" />}
          trailing={<Switch value={pushEnabled} onValueChange={setPushEnabled} />}
        />
        <Divider inset />
        <ListItem
          title="With a chevron"
          subtitle="Pressable, shows the platform disclosure"
          leading={<Icon name="person" sf="person.fill" size="md" />}
          onPress={() => {}}
        />
        <Divider inset />
        <ListItem title="Plain row" subtitle="No press target" />
        <Divider inset />
        <ListItem
          title="Destructive"
          leading={<Icon name="trash" sf="trash.fill" size="md" />}
          destructive
          onPress={() => {}}
        />
      </Section>

      {/* ── Status ─────────────────────────────────────────────────── */}
      <Section title="Status">
        <View style={styles.block}>
          <VStack gap={4}>
            <HStack gap={2} wrap>
              <Badge label="Neutral" />
              <Badge label="Brand" tone="brand" />
              <Badge label="Success" tone="success" />
              <Badge label="Warning" tone="warning" />
              <Badge label="Danger" tone="danger" />
              <Badge label="Info" tone="info" />
            </HStack>

            <HStack gap={2} wrap>
              <Chip label="Selected" selected />
              <Chip label="Unselected" />
              <Chip label="Another" />
            </HStack>

            <VStack gap={3}>
              <Banner tone="info" title="Informational" message="Every pair here clears WCAG AA." />
              <Banner tone="success" title="Saved" message="Your changes were stored." />
              <Banner tone="warning" title="Heads up" message="This action affects everyone." />
              <Banner tone="danger" title="Failed" message="We could not reach the server." />
            </VStack>
          </VStack>
        </View>
      </Section>

      {/* ── Loading ────────────────────────────────────────────────── */}
      <Section title="Loading">
        <View style={styles.block}>
          <VStack gap={4}>
            <HStack gap={4}>
              <Spinner />
              <Spinner size="large" />
            </HStack>
            <ProgressBar value={0.65} />
            <VStack gap={2}>
              <Skeleton width="70%" height={20} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="45%" height={14} />
            </VStack>
          </VStack>
        </View>
      </Section>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <Section
        title="Charts"
        footnote="victory-native on Skia. Compositional, so every mark reads a token — Skia is native, so a new install needs a rebuild, not a reload."
      >
        <View style={styles.block}>
          <Card>
            <AreaChart data={CHART_SAMPLE} domain={[0, 100]} />
          </Card>
        </View>
      </Section>

      {/* ── Surfaces ───────────────────────────────────────────────── */}
      <Section title="Surfaces" footnote="Elevation pairs an iOS shadow with an Android elevation at every step.">
        <View style={styles.block}>
          <VStack gap={4}>
            <Card elevation="none">
              <Text variant="label">elevation none</Text>
            </Card>
            <Card elevation="sm">
              <Text variant="label">elevation sm</Text>
            </Card>
            <Card elevation="md">
              <Text variant="label">elevation md</Text>
            </Card>
            <Card elevation="lg">
              <Text variant="label">elevation lg</Text>
            </Card>
          </VStack>
        </View>
      </Section>
    </Screen>
  );
}

/**
 * A fixed series, not random data: a showcase that reshuffles on every reload
 * makes it impossible to tell a rendering change from noise.
 */
const CHART_SAMPLE = [
  { x: 0, y: 42 },
  { x: 1, y: 55 },
  { x: 2, y: 48 },
  { x: 3, y: 71 },
  { x: 4, y: 86 },
];

const styles = StyleSheet.create((theme) => ({
  block: {
    padding: theme.space[4],
  },
}));
