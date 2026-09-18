// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UpdateBanner } from './update-banner';

// The banner sits outside every `Screen`, so it pays the top inset itself and
// reads the hook directly. Without a provider the real hook throws — supplied
// here the same way `screen.test.tsx` and `app-header.test.tsx` do it.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
}));

const useUpdates = Updates.useUpdates as jest.Mock;
const reloadAsync = Updates.reloadAsync as jest.Mock;

const QUIET = {
  currentlyRunning: { updateId: 'current', isEmbeddedLaunch: true },
  isUpdateAvailable: false,
  isUpdatePending: false,
  isChecking: false,
  isDownloading: false,
  isStartupProcedureRunning: false,
  isRestarting: false,
  availableUpdate: undefined,
  downloadedUpdate: undefined,
};

const downloaded = (updatePolicy: string) => ({
  ...QUIET,
  isUpdateAvailable: true,
  isUpdatePending: true,
  downloadedUpdate: {
    type: 'new',
    updateId: 'next',
    createdAt: new Date('2026-08-20'),
    manifest: { extra: { expoClient: { extra: { updatePolicy } } } },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  useUpdates.mockReturnValue(QUIET);
});

/**
 * The banner is the ONLY visible consequence of the whole OTA policy channel,
 * and every other gate is blind to it: a haptic changes no pixel, `reloadAsync`
 * is a native call, and the Unistyles jest mock resolves no variant styles. If
 * this file does not assert it, nothing does.
 */
describe('UpdateBanner', () => {
  it('shows nothing when no update is pending', async () => {
    await render(<UpdateBanner />);
    expect(screen.queryByText('Update ready')).toBeNull();
  });

  // The default policy, and nearly every real publish. A silent update is
  // already on the device and runs at the next cold start — putting a banner in
  // front of a user for one would make routine releases feel like incidents.
  it('shows nothing for a pending silent update', async () => {
    useUpdates.mockReturnValue(downloaded('silent'));
    await render(<UpdateBanner />);
    expect(screen.queryByText('Update ready')).toBeNull();
  });

  it('shows nothing for a forced update that has not finished downloading', async () => {
    useUpdates.mockReturnValue({
      ...downloaded('forced'),
      isUpdatePending: false,
      downloadedUpdate: undefined,
      availableUpdate: downloaded('forced').downloadedUpdate,
    });
    await render(<UpdateBanner />);
    expect(screen.queryByText('Update ready')).toBeNull();
  });

  it('shows the banner once a forced update is downloaded and pending', async () => {
    useUpdates.mockReturnValue(downloaded('forced'));
    await render(<UpdateBanner />);
    expect(screen.getByText('Update ready')).toBeTruthy();
  });

  it('restarts into the new bundle when pressed', async () => {
    useUpdates.mockReturnValue(downloaded('forced'));
    await render(<UpdateBanner />);

    fireEvent.press(screen.getByRole('button', { name: /Update ready/i }));

    expect(reloadAsync).toHaveBeenCalledTimes(1);
    // A branded reload screen rather than a white flash — SDK 57 only, and
    // silently ignored if the option is dropped, so it is asserted here.
    expect(reloadAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        reloadScreenOptions: expect.objectContaining({ fade: true }),
      }),
    );
  });

  // `medium` is the weight for a primary committing control. NOT `heavy`, which
  // this repo reserves for destructive — restarting into a fixed build is the
  // opposite of destructive. Nothing but a test can see which waveform fired.
  //
  // And it fires on the COMMIT (press), not on touch-down: a haptic confirms a
  // result, and a press-in that the finger drags off is not one.
  it('fires a medium haptic when the restart is committed, and none on touch-down', async () => {
    useUpdates.mockReturnValue(downloaded('forced'));
    await render(<UpdateBanner />);

    const banner = screen.getByRole('button', { name: /Update ready/i });
    fireEvent(banner, 'pressIn');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();

    fireEvent.press(banner);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
