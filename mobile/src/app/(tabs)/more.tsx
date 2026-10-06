import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import {
  ChevronRight,
  UsersRound,
  WandSparkles,
  Tags,
  Landmark,
  Settings,
  Activity,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { type } from '../../components/ui';
import { useCredentials } from '../../lib/credentials';
import { colors, fonts, radii } from '../../theme';

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
            {section.pages.map(({ label, description, href, icon: Icon }) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={`${label}. ${description}`}
                onPress={() => router.push(href)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={[styles.badge, { backgroundColor: section.badge }]}>
                  <Icon size={20} color={colors.foreground} />
                </View>
                <View style={styles.text}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={type.muted}>{description}</Text>
                </View>
                <ChevronRight size={20} color={colors.foreground} />
              </Pressable>
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
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  pressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
  badge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
  },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  footer: { marginTop: 'auto', paddingVertical: 16, gap: 6 },
  center: { textAlign: 'center' },
});
