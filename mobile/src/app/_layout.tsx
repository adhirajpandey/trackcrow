import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Kalam_400Regular } from '@expo-google-fonts/kalam';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '../components/toast-host';
import { SessionBoundary } from '../components/session-boundary';
import { ApiError } from '../lib/api/client';
import { onboarding, shouldSkipOnboarding, DEFAULT_API_URL } from '../lib/onboarding';
import { CredentialsProvider, useCredentials } from '../lib/credentials';
import { SmsIngestionProvider } from '../lib/sms-ingestion';
import { colors } from '../theme';

export default function Layout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: (count, error) =>
              !(error instanceof ApiError && [401, 403].includes(error.status ?? 0)) && count < 1,
          },
        },
      }),
  );
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Kalam_400Regular,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? (
          <QueryClientProvider client={queryClient}>
            <CredentialsProvider>
              <SmsIngestionProvider>
                <BottomSheetModalProvider>
                  <ToastHost>
                    <SessionBoundary>
                      <FirstRunRedirect />
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: colors.background },
                        }}
                      >
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="onboarding/index" />
                      </Stack>
                    </SessionBoundary>
                  </ToastHost>
                </BottomSheetModalProvider>
              </SmsIngestionProvider>
            </CredentialsProvider>
          </QueryClientProvider>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.background }} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function FirstRunRedirect() {
  const { state } = useCredentials();
  const segments = useSegments();
  const inSetup = segments[0] === 'onboarding';
  const inSettings = segments[0] === 'settings';
  const apiUrl = state.status === 'ready' ? state.credentials.apiUrl : DEFAULT_API_URL;
  useEffect(() => {
    if (state.status === 'loading' || inSetup || inSettings) return;
    let active = true;
    async function check() {
      const setup = await onboarding.read(apiUrl);
      const granted =
        Platform.OS === 'android' &&
        (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS));
      const decided = !!(await AsyncStorage.getItem('trackcrow.smsPermissionDecision'));
      if (!active) return;
      if (shouldSkipOnboarding(setup, state.status === 'ready', granted, decided)) {
        if (!setup) await onboarding.save(apiUrl, { complete: true, mode: granted ? 'sms' : 'manual' });
      } else router.replace('/onboarding');
    }
    void check().catch(() => {
      if (active) router.replace('/onboarding');
    });
    return () => {
      active = false;
    };
  }, [state.status, apiUrl, inSetup, inSettings]);
  return null;
}
