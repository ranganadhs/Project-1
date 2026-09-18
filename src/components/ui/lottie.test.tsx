import '@/theme/unistyles';

import { AccessibilityInfo } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Lottie } from './lottie';
import { ANIMATION } from '@/lib/assets';

describe('Lottie', () => {
  afterEach(() => jest.restoreAllMocks());

  it('plays by default', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    await render(<Lottie source={ANIMATION.sample} testID="anim" />);
    await waitFor(() => expect(screen.getByTestId('anim').props.autoPlay).toBe(true));
  });

  /**
   * A looping animation is precisely what Reduce Motion exists to stop. The
   * primitive holds a still frame rather than dropping the artwork, so layout
   * does not shift between the two settings.
   *
   * `waitFor` is load-bearing: the check is asynchronous, so the first render
   * always says "playing" and the still frame arrives on a later commit.
   */
  it('holds a still frame when reduce motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(<Lottie source={ANIMATION.sample} testID="anim" />);
    await waitFor(() => {
      const { autoPlay, loop, progress } = screen.getByTestId('anim').props;
      expect(autoPlay).toBe(false);
      expect(loop).toBe(false);
      expect(progress).toBe(0);
    });
  });
});
