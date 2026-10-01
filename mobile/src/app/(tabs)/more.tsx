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
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { Panel, type } from '../../components/ui';
import { useCredentials } from '../../lib/credentials';
import { colors } from '../../theme';

const pages: { label: string; description: string; href: Href; icon: LucideIcon }[] = [
  {
    label: 'Recipients',
    description: 'Names, aliases, and payment history',
    href: '/recipients',
    icon: UsersRound,
  },
  { label: 'Rules', description: 'Classify or ignore future imports', href: '/rules', icon: WandSparkles },
  {
    label: 'Categories',
    description: 'Organize categories and subcategories',
    href: '/categories',
    icon: Tags,
  },
  { label: 'Accounts', description: 'Name the accounts you pay from', href: '/accounts', icon: Landmark },
  { label: 'Settings', description: 'Sign-in and SMS import status', href: '/settings', icon: Settings },
  {
    label: 'Diagnostics',
    description: 'Check app and import diagnostics',
    href: '/diagnostics',
    icon: Activity,
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="More" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, flexGrow: 1 }}>
        {[pages.slice(0, 4), pages.slice(4)].map((group, index) => (
          <Panel key={index}>
            {group.map(({ label, description, href, icon: Icon }, row) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={`${label}. ${description}`}
                onPress={() => router.push(href)}
                style={({ pressed }) => ({
                  padding: 16,
                  minHeight: 80,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderTopWidth: row ? 1 : 0,
                  borderColor: colors.secondary,
                  backgroundColor: pressed ? colors.paperMint : colors.card,
                })}
              >
                <Icon size={24} color={colors.foreground} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={type.heading}>{label}</Text>
                  <Text style={type.muted}>{description}</Text>
                </View>
                <ChevronRight size={20} color={colors.foreground} />
              </Pressable>
            ))}
          </Panel>
        ))}
        <View style={{ marginTop: 'auto', paddingVertical: 16, gap: 6 }}>
          <Text style={[type.body, { textAlign: 'center' }]}>{identity}</Text>
          <Text style={[type.muted, { textAlign: 'center' }]}>
            Version {Constants.expoConfig?.version ?? 'unknown'} (
            {Constants.expoConfig?.android?.versionCode ?? '?'})
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
