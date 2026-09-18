import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';
import {
  Screen,
  VStack,
  Text,
  Section,
  ListItem,
  Divider,
  Switch,
  Icon,
  Button,
  SegmentedControl,
} from '@/components/ui';
import { useSession } from '@/lib/auth';
import { useThemeMode, type ThemeMode } from '@/theme/theme-mode';
import { describeBuild } from '@/components/updates/build-info';

const THEME_MODES: readonly { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function Settings() {
  const { session, signOut } = useSession();
  const { mode, setMode, resolved } = useThemeMode();
  const [push, setPush] = useState(true);
  const { version, bundle } = describeBuild();
  const [haptics, setHaptics] = useState(true);

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="display">Settings</Text>
        <Text variant="callout" tone="secondary">
          Grouped rows, the native settings idiom.
        </Text>
      </VStack>

      <Section title="Account">
        <ListItem
          title={session?.user.name ?? 'Not signed in'}
          subtitle={session?.user.id}
          leading={<Icon name="person-circle" sf="person.crop.circle.fill" size="xl" />}
          onPress={() => {}}
        />
      </Section>

      <Section title="Preferences">
        <ListItem
          title="Push notifications"
          leading={<Icon name="notifications" sf="bell.fill" size="md" />}
          trailing={<Switch value={push} onValueChange={setPush} />}
        />
        <Divider inset />
        <ListItem
          title="Haptic feedback"
          leading={<Icon name="pulse" sf="waveform" size="md" />}
          trailing={<Switch value={haptics} onValueChange={setHaptics} />}
        />
      </Section>

      <Section
        title="Appearance"
        footnote="Choosing Light or Dark overrides the system setting and persists across launches. On System, flipping the OS appearance re-themes the app with no reload — Unistyles applies it over JSI."
      >
        <ListItem
          title="Theme"
          subtitle={mode === 'system' ? `Following system — currently ${resolved}` : `Forced ${mode}`}
          leading={<Icon name="contrast" sf="circle.lefthalf.filled" size="md" />}
        />
        <View style={styles.modeRow}>
          <SegmentedControl options={THEME_MODES} value={mode} onChange={setMode} />
        </View>
      </Section>

      <Section title="Privacy">
        <ListItem
          title="Permissions"
          subtitle="Notifications, location, camera, photos and more"
          leading={<Icon name="lock-closed" sf="lock.fill" size="md" />}
          onPress={() => router.push('/permissions')}
        />
      </Section>

      {/*
        TWO ROWS, BECAUSE THEY ANSWER DIFFERENT QUESTIONS.

        `Version` identifies the BINARY and changes only when you ship a build.
        `Bundle` identifies the JAVASCRIPT inside it, which an over-the-air
        update replaces without the version moving at all — two people on the
        same store version can be running different code.

        Never read `Constants.expoConfig?.version` for this row: it is the
        manifest's copy, so once OTA updates are live it reports the version of
        whatever bundle is running, not of the installed app. See
        components/updates/build-info.tsx for the full argument, and
        docs/ota-updates.md.
      */}
      <Section title="About">
        <ListItem
          title="Version"
          trailing={
            <Text variant="label" tone="secondary">
              {version}
            </Text>
          }
        />
        <Divider inset />
        <ListItem
          title="Bundle"
          trailing={
            <Text variant="label" tone="secondary">
              {bundle}
            </Text>
          }
        />
        <Divider inset />
        <ListItem
          title="Platform"
          trailing={
            <Text variant="label" tone="secondary">
              {Platform.OS} {String(Platform.Version)}
            </Text>
          }
        />
      </Section>

      <VStack gap={3}>
        <Button
          label="Sign out"
          tone="danger"
          variant="soft"
          fullWidth
          onPress={confirmSignOut}
          leading={<Icon name="log-out" sf="rectangle.portrait.and.arrow.right" size="sm" />}
        />
        <Text variant="caption" tone="tertiary" align="center">
          Signing out clears the session, which flips the route guard and returns you to sign-in.
          No imperative redirect involved.
        </Text>
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  modeRow: {
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[4],
  },
}));
