import { router } from 'expo-router';
import { Construction } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { ScreenHeader } from './screen-header';
import { AppHeader } from './app-header';
import { Button, Panel, type } from './ui';

export function ComingSoon({
  section,
  tab = false,
  children,
}: {
  section: string;
  tab?: boolean;
  children?: ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {tab ? <AppHeader section={section} /> : <ScreenHeader section={section} />}
      <View style={styles.content}>
        <Text style={type.note}>not built yet</Text>
        <Panel raised style={styles.panel}>
          <View style={styles.icon}>
            <Construction size={22} color={colors.foreground} />
          </View>
          <Text style={type.heading}>This page doesn&apos;t exist yet</Text>
          <Text style={type.muted}>{section} is on its way to the Android app. Until then, use the web app.</Text>
          {section === 'Transactions' ? (
            <Button label="Add expense" onPress={() => router.push('/transactions/new')} />
          ) : null}
          <Button label="Back to overview" variant="secondary" onPress={() => router.navigate('/')} />
          {children}
        </Panel>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 20, gap: 8 },
  panel: { padding: 20, gap: 12 },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.paperYellow,
  },
});
