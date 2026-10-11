import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  Badge,
  Card,
  Divider,
  FadeIn,
  IconTile,
  ListItem,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
  VStack,
} from '@/components/ui';
import { SectionHeader } from '@/features/shared/section-header';
import { MODELS, useDummyDownload, useModelStore, type ModelId } from '@/lib/model';
import { useThemeMode, type ThemeMode } from '@/theme/theme-mode';

const THEME_MODES: readonly { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Settings() {
  const { mode, setMode, resolved } = useThemeMode();
  const activeModelId = useModelStore((s) => s.activeModelId);
  const downloadedModelIds = useModelStore((s) => s.downloadedModelIds);
  const downloadingModelId = useModelStore((s) => s.downloadingModelId);
  const downloadProgress = useModelStore((s) => s.downloadProgress);
  const setActiveModel = useModelStore((s) => s.setActiveModel);
  const { begin } = useDummyDownload();

  const confirmSwitchModel = (model: ModelId) => {
    if (downloadingModelId) return; // one download in flight at a time
    const name = MODELS.find((m) => m.id === model)?.name;

    if (downloadedModelIds.includes(model)) {
      Alert.alert(`Switch to ${name}?`, 'Already on this device — switching takes effect right away.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => setActiveModel(model) },
      ]);
      return;
    }

    Alert.alert(
      `Switch to ${name}?`,
      'It downloads in the background here — your current model keeps working until it is ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => begin(model) },
      ],
    );
  };

  return (
    <Screen scroll topInset>
      <FadeIn index={0}>
        <VStack gap={2}>
          <Text variant="display">Settings</Text>
        </VStack>
      </FadeIn>

      <FadeIn index={1}>
        <VStack gap={2}>
          <SectionHeader title="Appearance" />
          <Card inset={false}>
            <ListItem
              title="Theme"
              subtitle={
                mode === 'system' ? `Following your phone — ${resolved} now` : `Always ${mode}`
              }
              leading={
                <IconTile icon="contrast-outline" sf="circle.lefthalf.filled" md="contrast" size="sm" />
              }
            />
            <View style={styles.modeRow}>
              <SegmentedControl options={THEME_MODES} value={mode} onChange={setMode} />
            </View>
          </Card>
        </VStack>
      </FadeIn>

      <FadeIn index={2}>
        <VStack gap={2}>
          <SectionHeader
            title="On-device model"
            subtitle="All data stays on this device — no account needed."
          />
          <Card inset={false}>
            {MODELS.map((model, i) => {
              const active = model.id === activeModelId;
              const downloading = model.id === downloadingModelId;
              const downloaded = downloadedModelIds.includes(model.id);
              return (
                <View key={model.id}>
                  {i > 0 ? <Divider inset /> : null}
                  <ListItem
                    title={model.name}
                    subtitle={`${model.sizeGb} GB · ${model.description}`}
                    leading={<IconTile icon="sparkles" sf="sparkles" md="auto_awesome" size="sm" />}
                    trailing={
                      active ? (
                        <Badge label="Active" tone="brand" />
                      ) : downloading ? (
                        <Text variant="label" weight="medium" tone="secondary" numeric>
                          {Math.round(downloadProgress * 100)}%
                        </Text>
                      ) : downloaded ? (
                        <IconTile
                          icon="checkmark-circle-outline"
                          sf="checkmark.circle"
                          md="check_circle"
                          size="sm"
                          tone="neutral"
                        />
                      ) : (
                        <IconTile
                          icon="cloud-download-outline"
                          sf="arrow.down.circle"
                          md="download"
                          size="sm"
                          tone="neutral"
                        />
                      )
                    }
                    disabled={downloadingModelId !== null && !downloading}
                    onPress={active || downloading ? undefined : () => confirmSwitchModel(model.id)}
                  />
                  {downloading ? (
                    <View style={styles.progressRow}>
                      <ProgressBar value={downloadProgress} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </VStack>
      </FadeIn>

      <FadeIn index={3}>
        <VStack gap={2}>
          <SectionHeader title="Privacy" />
          <Card inset={false}>
            <ListItem
              title="All data stays on this device"
              leading={<IconTile icon="shield-checkmark-outline" sf="checkmark.shield" md="verified_user" size="sm" />}
            />
          </Card>
        </VStack>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  modeRow: { paddingHorizontal: theme.space[4], paddingBottom: theme.space[4] },
  progressRow: { paddingHorizontal: theme.space[4], paddingBottom: theme.space[3] },
}));
