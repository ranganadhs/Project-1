import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  Badge,
  Button,
  FadeIn,
  HStack,
  Icon,
  PressableScale,
  ProgressBar,
  Screen,
  Text,
  VStack,
} from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { MODELS, useDummyDownload, useModelStore, type ModelId } from '@/lib/model';

/**
 * Pick a Gemma checkpoint once, download it, then every chat and quiz runs
 * fully offline — see on_device_ai_student_companion.md §3.1–3.2. This is
 * the guard `(onboarding)` flips on once `markDownloadComplete` fires; see
 * docs/app-plan.md "Guards".
 */
export default function ModelSetup() {
  const { theme } = useUnistyles();
  const downloadingModelId = useModelStore((s) => s.downloadingModelId);
  const downloadProgress = useModelStore((s) => s.downloadProgress);
  const { begin } = useDummyDownload();
  const [pickedId, setPickedId] = useState<ModelId>(() => MODELS.find((m) => m.bestFit)!.id);

  const picked = MODELS.find((m) => m.id === pickedId)!;
  const downloading = downloadingModelId !== null;

  return (
    <Screen topInset scroll>
      <FadeIn index={0} rise={false}>
        <HStack gap={3} align="center">
          <View style={styles.mark}>
            <Icon name="sparkles" sf="sparkles" md="auto_awesome" size="md" color={theme.color.fg.onBrand} />
          </View>
          <Text variant="heading">Lumen</Text>
        </HStack>
      </FadeIn>

      <FadeIn index={1}>
        <VStack gap={2}>
          <Text variant="display">A tutor that lives on your phone.</Text>
          <Text variant="body" tone="secondary">
            Pick a free model once. After the download, every chat, diagram and quiz runs
            offline on this device.
          </Text>
        </VStack>
      </FadeIn>

      <FadeIn index={2}>
        <VStack gap={2}>
          {(['No account', 'Works offline', 'Chats stay private'] as const).map((label) => (
            <HStack key={label} gap={2} align="center">
              <Icon name="checkmark" sf="checkmark" md="check" size="sm" color={theme.color.status.success.solid} />
              <Text variant="body" tone="secondary">
                {label}
              </Text>
            </HStack>
          ))}
        </VStack>
      </FadeIn>

      <FadeIn index={3}>
        <VStack gap={3}>
          <HStack align="baseline">
            <Text variant="label" tone="tertiary" style={styles.flex}>
              CHOOSE A MODEL
            </Text>
            <Text variant="caption" tone="tertiary">
              Your phone: 8 GB RAM
            </Text>
          </HStack>
          <VStack gap={2}>
            {MODELS.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                selected={model.id === pickedId}
                downloading={downloading && downloadingModelId === model.id}
                progress={downloadProgress}
                onPress={() => {
                  if (downloading) return;
                  haptics.select();
                  setPickedId(model.id);
                }}
              />
            ))}
          </VStack>
        </VStack>
      </FadeIn>

      <FadeIn index={4}>
        <VStack gap={2}>
          <Button
            label={downloading ? `Downloading ${picked.name}… ${Math.round(downloadProgress * 100)}%` : `Get started with ${picked.name}`}
            size="lg"
            fullWidth
            disabled={downloading}
            onPress={() => begin(picked.id)}
            leading={downloading ? undefined : <Icon name="download" sf="arrow.down.circle" md="download" size="sm" color={theme.color.fg.onBrand} />}
            testID="model-setup-start"
          />
          <Text variant="caption" tone="tertiary" align="center">
            Best on Wi-Fi. Download continues in the background and you can switch models
            later in Settings.
          </Text>
        </VStack>
      </FadeIn>
    </Screen>
  );
}

function ModelCard({
  model,
  selected,
  downloading,
  progress,
  onPress,
}: {
  model: (typeof MODELS)[number];
  selected: boolean;
  downloading: boolean;
  progress: number;
  onPress: () => void;
}) {
  styles.useVariants({ selected });

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${model.name}, ${model.description}, ${model.sizeGb} GB`}
    >
      <HStack gap={3} align="center">
        <View style={styles.radio}>{selected ? <View style={styles.radioDot} /> : null}</View>
        <VStack gap={1} style={styles.flex}>
          <HStack gap={2} align="center">
            <Text variant="body" weight="semibold">
              {model.name}
            </Text>
            {model.bestFit ? <Badge label="Best fit" tone="brand" /> : null}
          </HStack>
          <Text variant="label" tone="secondary">
            {model.description}
          </Text>
          <Text variant="caption" tone="tertiary">
            Needs {model.minRamGb} GB RAM
          </Text>
        </VStack>
        <Text variant="label" weight="medium" tone="tertiary" numeric>
          {model.sizeGb} GB
        </Text>
      </HStack>
      {downloading ? (
        <View style={styles.progressRow}>
          <ProgressBar value={progress} />
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1, minWidth: 0 },
  mark: {
    width: theme.size.tile.sm,
    height: theme.size.tile.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shape.tile,
    backgroundColor: theme.color.bg.brand,
  },
  card: {
    padding: theme.space[4],
    gap: theme.space[3],
    ...theme.shape.card,
    backgroundColor: theme.color.bg.raised,
    borderWidth: theme.border.thin,
    borderColor: theme.color.border.default,
    variants: {
      selected: {
        true: {
          borderColor: theme.color.border.selected,
          borderWidth: theme.border.thick,
          backgroundColor: theme.color.bg.brandSubtle,
        },
        false: {},
      },
    },
  },
  progressRow: { paddingLeft: theme.size.dot.lg * 2 + theme.space[3] },
  radio: {
    width: theme.size.dot.lg * 2,
    height: theme.size.dot.lg * 2,
    borderRadius: theme.radius.full,
    borderWidth: theme.border.thick,
    borderColor: theme.color.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      selected: {
        true: { borderColor: theme.color.interactive.primary.rest },
        false: {},
      },
    },
  },
  radioDot: {
    width: theme.size.dot.lg,
    height: theme.size.dot.lg,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.interactive.primary.rest,
  },
}));
