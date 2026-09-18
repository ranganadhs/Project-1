import { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { queryClient } from './client';

/**
 * React Query's focus and online managers are browser-driven and INERT in React
 * Native — `refetchOnWindowFocus` and `refetchOnReconnect` do nothing at all
 * until they are wired to AppState and NetInfo.
 *
 * This wiring lives in an effect rather than at module scope on purpose: a
 * module-load NetInfo subscription executes eagerly on import and breaks under
 * Jest, where the native module is unavailable.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    // setEventListener returns void — it owns the teardown of the previous
    // listener internally — so capture NetInfo's own unsubscribe to clean up.
    let unsubscribeNetInfo: (() => void) | undefined;
    onlineManager.setEventListener((setOnline) => {
      unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        // isInternetReachable is null while unknown; treat that as online so a
        // slow probe never blocks requests that would actually have succeeded.
        setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      });
      return unsubscribeNetInfo;
    });

    return () => {
      appStateSub.remove();
      unsubscribeNetInfo?.();
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
