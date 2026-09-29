import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Image source={require('../../assets/brand.png')} style={styles.mark} accessibilityLabel="Trackcrow logo" />
        <Text style={styles.brand}>Trackcrow</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>A fresh start.</Text>
          <Text style={styles.description}>Your money, in view.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24 },
  mark: { width: 44, height: 44, borderRadius: 8 },
  brand: { color: colors.foreground, fontSize: 24, fontWeight: '800' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 10,
    padding: 28,
    gap: 12,
    boxShadow: '4px 5px 0 #171714',
  },
  title: { color: colors.foreground, fontSize: 32, fontWeight: '800' },
  description: { color: colors.mutedForeground, fontSize: 18, lineHeight: 27 },
});
