// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState, ErrorState } from './states';

/**
 * Loading, error, empty, content — four states, and the two designed here are
 * the ones a screen most often leaves as a blank. What a test can see: that
 * each renders its copy, that an action is a real button, and that the error
 * state's retry is wired to the callback rather than decorative.
 */
describe('EmptyState', () => {
  it('renders the title and description', async () => {
    await render(<EmptyState title="No messages yet" description="Start a conversation." />);
    expect(screen.getByText('No messages yet')).toBeTruthy();
    expect(screen.getByText('Start a conversation.')).toBeTruthy();
  });

  it('renders no button when there is nothing to do', async () => {
    await render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('exposes the action as a pressable button', async () => {
    const onPress = jest.fn();
    await render(<EmptyState title="No items" action={{ label: 'Add one', onPress }} />);
    fireEvent.press(screen.getByRole('button', { name: 'Add one' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('lets an illustration replace the icon', async () => {
    await render(
      <EmptyState title="Empty">
        <View testID="illustration" />
      </EmptyState>,
    );
    expect(screen.getByTestId('illustration')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('defaults to a calm title and a retry action wired to onRetry', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState description="Check your connection." onRetry={onRetry} />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders no retry when a retry cannot help', async () => {
    await render(<ErrorState title="Account closed" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
