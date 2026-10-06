import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import {
  UsersRound,
  WandSparkles,
  Tags,
  Landmark,
  Settings,
  Activity,
  type LucideIcon,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { MenuRow } from '../../components/menu-row';
import { type } from '../../components/ui';
import { useCredentials } from '../../lib/credentials';
import { colors, radii } from '../../theme';

type Page = { label: string; description: string; href: Href; icon: LucideIcon };

const sections: { title: string; tint: string; badge: string; pages: Page[] }[] = [
  {
    title: 'Data management',
    tint: colors.paperMint,
    badge: colors.primary,
    pages: [
      { label: 'Recipients', description: 'Names, aliases, and payment history', href: '/recipients', icon: UsersRound },
      { label: 'Rules', description: 'Classify or ignore future imports', href: '/rules', icon: WandSparkles },
      { label: 'Categories', description: 'Organize categories and subcategories', href: '/categories', icon: Tags },
      { label: 'Accounts', description: 'Name the accounts you pay from', href: '/accounts', icon: Landmark },
    ],
  },
  {
    title: 'App',
    tint: colors.uncategorized,
    badge: colors.accent,
    pages: [
      { label: 'Settings', description: 'Sign-in and SMS import status', href: '/settings', icon: Settings },
      { label: 'Diagnostics', description: 'Check app and import diagnostics', href: '/diagnostics', icon: Activity },
    ],
  },
];

export default function MoreScreen() {
  const { state } = useCredentials();
  const identity =
    state.status === 'ready'
      ? state.credentials.method === 'google'
        ? state.credentials.email
        : 'Connected with an access token'
      : state.status === 'loading'
        ? 'Loading account…'
        : 'Not signed in';
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <AppHeader section="More" />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={[styles.section, { backgroundColor: section.tint }]}>
            <Text style={type.label}>{section.title}</Text>
            {section.pages.map(({ label, description, href, icon }) => (
              <MenuRow
                key={label}
                icon={icon}
                label={label}
                description={description}
                badge={section.badge}
                onPress={() => router.push(href)}
              />
            ))}
          </View>
        ))}
        <View style={styles.footer}>
          <Text style={[type.body, styles.center]}>{identity}</Text>
          <Text style={[type.muted, styles.center]}>
            Version {Constants.expoConfig?.version ?? 'unknown'} ({Constants.expoConfig?.android?.versionCode ?? '?'})
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, flexGrow: 1 },
  section: {
    padding: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
  },
  footer: { marginTop: 'auto', paddingVertical: 16, gap: 6 },
  center: { textAlign: 'center' },
});
