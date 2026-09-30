import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { Button } from '../../components/ui';
import { colors } from '../../theme';
const pages: { label: string; href: Href }[] = [
  { label: 'Recipients', href: '/recipients' },
  { label: 'Rules', href: '/rules' },
  { label: 'Categories', href: '/categories' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Settings', href: '/settings' },
  { label: 'Diagnostics', href: '/diagnostics' },
];
export default function MoreScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <AppHeader section="More" />
      <ScrollView contentContainerStyle={styles.content}>
        {pages.map((page) => (
          <Button key={page.label} label={page.label} variant="secondary" onPress={() => router.push(page.href)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
});
