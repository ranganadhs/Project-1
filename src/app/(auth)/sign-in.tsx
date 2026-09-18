import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useSession } from '@/lib/auth';

export default function SignIn() {
  const { signIn } = useSession();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>
        Backed by the mock adapter. Swap it with configureAuth() to talk to a real backend.
      </Text>
      <Pressable
        style={styles.button}
        accessibilityRole="button"
        onPress={() => void signIn({ email: 'demo@example.com', password: 'demo' })}
      >
        <Text style={styles.buttonLabel}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[4],
    padding: theme.space[6],
    backgroundColor: theme.color.bg.canvas,
  },
  title: {
    color: theme.color.fg.primary,
    fontSize: theme.typography.fontSize['2xl'],
    lineHeight: theme.typography.lineHeight['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    color: theme.color.fg.secondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.base,
    textAlign: 'center',
  },
  button: {
    minHeight: theme.size.control.md,
    justifyContent: 'center',
    paddingHorizontal: theme.space[5],
    ...theme.shape.field,
    backgroundColor: theme.color.interactive.primary.rest,
  },
  buttonLabel: {
    color: theme.color.fg.onBrand,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
}));
