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
import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '../components/toast-host';
import { SessionBoundary } from '../components/session-boundary';
import { ApiError } from '../lib/api/client';
import { CredentialsProvider } from '../lib/credentials';
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
                      <Stack
                        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
                      >
                        <Stack.Screen name="(tabs)" />
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
