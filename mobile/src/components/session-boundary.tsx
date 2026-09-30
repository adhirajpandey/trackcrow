import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeUnauthorized } from '../lib/api/client';
import type { Credentials } from '../lib/api/client';
import { useCredentials } from '../lib/credentials';
import { Button, Panel, type } from './ui';
export function SessionBoundary({ children }: { children: ReactNode }) {
  const { state, disconnect } = useCredentials();
  const current = useRef({ state, disconnect });
  useEffect(() => {
    current.current = { state, disconnect };
  }, [state, disconnect]);
  const queryClient = useQueryClient();
  const [rejected, setRejected] = useState<Credentials | null>(null);
  const rejecting = useRef(false);
  useEffect(
    () =>
      subscribeUnauthorized((credentials) => {
        const session = current.current;
        if (
          rejecting.current ||
          session.state.status !== 'ready' ||
          session.state.credentials.token !== credentials.token ||
          session.state.credentials.apiUrl !== credentials.apiUrl
        )
          return;
        rejecting.current = true;
        setRejected(credentials);
        void queryClient.cancelQueries();
        // Reuse sign-out so credentials and pending SMS are cleared together.
        void session
          .disconnect()
          .catch(() => undefined)
          .finally(() => {
            queryClient.clear();
            rejecting.current = false;
            router.replace('/settings');
          });
      }),
    [queryClient],
  );
  const expired =
    rejected &&
    (state.status !== 'ready' ||
      (state.credentials.token === rejected.token && state.credentials.apiUrl === rejected.apiUrl));
  const signingOut = expired && state.status === 'ready';
  return (
    <View style={{ flex: 1 }}>
      {expired ? (
        <SafeAreaView
          edges={['top']}
          style={signingOut ? { flex: 1, justifyContent: 'center', padding: 16 } : undefined}
        >
          <Panel tone="blush" style={{ padding: 16, gap: 8 }}>
            <Text accessibilityRole="alert" style={type.heading}>
              Sign in again
            </Text>
            <Text style={type.body}>Your sign-in expired or was revoked.</Text>
            <Button
              label="Open Settings"
              variant="secondary"
              disabled={Boolean(signingOut)}
              onPress={() => router.replace('/settings')}
            />
          </Panel>
        </SafeAreaView>
      ) : null}
      <View style={{ flex: 1, display: signingOut ? 'none' : 'flex' }}>{children}</View>
    </View>
  );
}
