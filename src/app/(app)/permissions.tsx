import { Platform } from 'react-native';
import {
  Screen,
  VStack,
  HStack,
  Text,
  Card,
  Section,
  ListItem,
  Divider,
  Badge,
  Button,
  Icon,
  Spinner,
} from '@/components/ui';
import {
  usePermission,
  useRequestOrSettings,
  PERMISSION_KEYS,
  type PermissionKey,
  type PermissionStatus,
} from '@/lib/permissions';

const TONE: Record<PermissionStatus, 'success' | 'danger' | 'warning' | 'neutral' | 'info'> = {
  granted: 'success',
  limited: 'info',
  denied: 'warning',
  blocked: 'danger',
  undetermined: 'neutral',
  unavailable: 'neutral',
};

const ICON: Record<PermissionKey, { name: string; sf: string }> = {
  notifications: { name: 'notifications', sf: 'bell.fill' },
  location: { name: 'location', sf: 'location.fill' },
  locationBackground: { name: 'navigate', sf: 'location.circle.fill' },
  camera: { name: 'camera', sf: 'camera.fill' },
  microphone: { name: 'mic', sf: 'mic.fill' },
  mediaLibrary: { name: 'images', sf: 'photo.on.rectangle' },
  contacts: { name: 'people', sf: 'person.2.fill' },
  calendar: { name: 'calendar', sf: 'calendar' },
  tracking: { name: 'analytics', sf: 'hand.raised.fill' },
};

function PermissionRow({ permissionKey }: { permissionKey: PermissionKey }) {
  const permission = usePermission(permissionKey);
  const requestOrSettings = useRequestOrSettings(permissionKey);
  const icon = ICON[permissionKey];

  const subtitle = permission.unavailable
    ? `Not available on ${Platform.OS}`
    : permission.blocked
      ? 'Refused permanently — only Settings can change it'
      : permission.limited
        ? 'Granted for selected items only'
        : permission.hasAsked
          ? 'Asked before'
          : 'Never asked';

  return (
    <ListItem
      title={permission.label}
      subtitle={subtitle}
      leading={<Icon name={icon.name as never} sf={icon.sf as never} size="md" />}
      trailing={
        permission.isPending ? (
          <Spinner />
        ) : (
          <HStack gap={2}>
            <Badge label={permission.status} tone={TONE[permission.status]} />
            {!permission.granted && !permission.unavailable ? (
              <Button
                label={permission.blocked ? 'Settings' : 'Allow'}
                size="sm"
                variant={permission.blocked ? 'outline' : 'solid'}
                onPress={() => void requestOrSettings()}
              />
            ) : null}
          </HStack>
        )
      }
    />
  );
}

export default function Permissions() {
  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="title">Permissions</Text>
        <Text variant="callout" tone="secondary">
          One hook per permission, all normalised to the same shape. Every row below is the same
          component — only the key differs.
        </Text>
      </VStack>

      <Card>
        <VStack gap={3}>
          <HStack gap={2}>
            <Icon name="refresh" sf="arrow.clockwise" size="md" />
            <Text variant="label" weight="semibold">
              Try this
            </Text>
          </HStack>
          <Text variant="callout" tone="secondary">
            Grant something, background the app, revoke it in system Settings, then come back.
            The row updates itself — `usePermission` re-checks on foreground, because the OS
            never tells you when a permission changes underneath you.
          </Text>
        </VStack>
      </Card>

      <Section
        title="All permissions"
        footnote="blocked means the OS will no longer prompt. Calling request() then does nothing at all, which is why the button becomes Settings."
      >
        {PERMISSION_KEYS.map((key, index) => (
          <VStack key={key} gap={0}>
            {index > 0 ? <Divider inset /> : null}
            <PermissionRow permissionKey={key} />
          </VStack>
        ))}
      </Section>

      <Section title="The six states">
        <ListItem title="undetermined" subtitle="Never requested — safe to prompt" trailing={<Badge label="neutral" />} />
        <Divider inset />
        <ListItem title="granted" subtitle="Full access" trailing={<Badge label="success" tone="success" />} />
        <Divider inset />
        <ListItem title="limited" subtitle="iOS photos: a user-picked subset" trailing={<Badge label="info" tone="info" />} />
        <Divider inset />
        <ListItem title="denied" subtitle="Refused, but the OS will ask again" trailing={<Badge label="warning" tone="warning" />} />
        <Divider inset />
        <ListItem title="blocked" subtitle="Refused permanently — Settings only" trailing={<Badge label="danger" tone="danger" />} />
        <Divider inset />
        <ListItem title="unavailable" subtitle="No such permission on this platform" trailing={<Badge label="neutral" />} />
      </Section>
    </Screen>
  );
}
