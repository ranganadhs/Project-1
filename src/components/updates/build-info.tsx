import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native-unistyles';
// Leaf imports, not the `@/components/ui` barrel. The barrel re-exports
// `area-chart`, which pulls in Skia — untransformable under jest, so a single
// barrel import makes this module untestable. Same reasoning as trap 18.
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/stack';
import { updateInfo } from '@/lib/updates';

/**
 * TWO NUMBERS, AND THEY ANSWER DIFFERENT QUESTIONS.
 *
 * The app version identifies the BINARY. It lives in the installed app
 * (`CFBundleShortVersionString` / `versionName`) and changes only when someone
 * ships a build to the store.
 *
 * The bundle line identifies the JAVASCRIPT running inside that binary, which
 * an over-the-air update replaces without the version moving at all. Two
 * users can both be on "1.0.0 (12)" and be running different code.
 *
 * ── WHY THE VERSION IS NOT, AND MUST NOT BE, OTA-UPDATABLE ────────────────
 *
 * It is tempting to read `Constants.expoConfig.version` instead, because it
 * comes from the MANIFEST and an update replaces the manifest — so the number
 * would appear to follow a publish. Two reasons not to:
 *
 *   1. It cannot actually move. `version` is part of `expoConfig`, which is a
 *      fingerprint input, so bumping it changes `runtimeVersion` and the update
 *      reaches no existing build.
 *   2. If you defeated that — `sourceSkips: ['ExpoConfigVersions']` exists and
 *      would do it — the number would then LIE. The binary on the phone is
 *      still 1.0.0 whatever the manifest says, and a version that disagrees
 *      with the App Store is worse than no version at all, because support
 *      will trust it.
 *
 * So this reads the binary, via expo-application, and reports the OTA layer
 * separately. That separation is the entire point of the component: when a
 * user sends a screenshot, these two lines say exactly which binary and
 * exactly which bundle, and neither can be mistaken for the other.
 */
export type BuildDescription = {
  /** The binary. Only a store release changes this. */
  version: string;
  /** The JavaScript. An OTA publish changes this. */
  bundle: string;
};

export function describeBuild(): BuildDescription {
  // `applicationName` is the display name baked into the binary, so it follows
  // a rename with nobody editing this file — and, like the version, it reports
  // what is INSTALLED rather than what the manifest currently claims.
  const name = Application.applicationName ?? 'App';
  const version = Application.nativeApplicationVersion ?? '—';
  const build = Application.nativeBuildVersion;

  return {
    version: build ? `${name} ${version} (${build})` : `${name} ${version}`,
    bundle: describeBundle(),
  };
}

/**
 * The publish ordinal this bundle was stamped with, or null.
 *
 * `Constants.expoConfig` is the manifest of the update currently RUNNING, so
 * this reads the number the bundle was given at its own publish — which is the
 * right source for a property of the bundle, and precisely the wrong source for
 * `version`, a property of the binary. Same object, opposite conclusions,
 * because the two facts live in different places.
 */
function otaBuildNumber(): number | null {
  const raw = Constants.expoConfig?.extra?.otaBuild;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function describeBundle(): string {
  // Dev, Expo Go, or any binary built without EAS Update. Saying "built-in"
  // here would be true but misleading — it implies an update could arrive.
  if (!updateInfo.isEnabled) return 'Development bundle';

  // The JS that shipped inside the binary. No update has been applied — either
  // none has been published for this runtime version, or one was rolled back.
  // This is also the state a fresh store release starts in, which is why the
  // OTA count reads as absent rather than as zero.
  if (updateInfo.isEmbedded) return 'Built-in bundle';

  const channel = updateInfo.channel;
  const ota = otaBuildNumber();

  // Prefer the ordinal — "OTA 3" is something a person can say on the phone
  // and a support agent can search for. Fall back to the update id when a
  // publish could not establish the count: `scripts/ota-publish.mjs` omits the
  // number rather than guessing, because two updates both calling themselves
  // "OTA 4" is worse than neither having a name.
  const label = ota === null ? `Update ${updateInfo.updateId?.slice(0, 8) ?? 'unknown'}` : `OTA ${ota}`;

  // The channel is worth the characters: it is how you tell a tester on the
  // preview track from a user on production when both report the same bug —
  // and the ordinals restart per binary, so "OTA 3" alone is not unique.
  return channel ? `${label} · ${channel}` : label;
}

/**
 * The drop-in footer form: one line per question, centred, for the bottom of a
 * settings or menu screen where a version belongs and nothing competes with it.
 *
 * Settings uses `describeBuild()` directly instead, because it already has
 * grouped `ListItem` rows and a version reads better as one of them. Both call
 * sites are legitimate — take whichever suits the screen, and delete this
 * component if you only ever want rows.
 *
 * `selectable` so the strings can be copied out of a screenshot conversation
 * without pulling in a clipboard dependency for two lines of text.
 */
export function BuildInfo() {
  const { version, bundle } = describeBuild();

  return (
    <VStack gap={0} align="center" style={styles.block}>
      <Text variant="caption" tone="tertiary" align="center" selectable>
        {version}
      </Text>
      <Text variant="caption" tone="tertiary" align="center" selectable>
        {bundle}
      </Text>
    </VStack>
  );
}

const styles = StyleSheet.create((theme) => ({
  block: { paddingTop: theme.space[2] },
}));
