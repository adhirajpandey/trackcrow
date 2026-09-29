import { router } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, minTarget, radii, shadows } from '../theme';

export function ScreenHeader({ section, reviewCount }: { section: string; reviewCount?: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Image source={require('../../assets/brand.png')} style={styles.markImage} accessibilityIgnoresInvertColors />
        </View>
        <View>
          <Text style={styles.name}>TrackCrow</Text>
          <Text style={styles.section}>{section}</Text>
        </View>
      </View>
      {reviewCount ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${reviewCount} transactions to review`}
          onPress={() => router.navigate('/transactions')}
          style={({ pressed }) => [styles.review, pressed ? styles.reviewPressed : styles.reviewShadow]}
        >
          <ReceiptText size={16} color={colors.foreground} strokeWidth={2.25} />
          <Text style={styles.reviewText}>{reviewCount} to review</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.shell,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.paperMint,
    overflow: 'hidden',
    boxShadow: shadows.control,
  },
  markImage: { width: '100%', height: '100%' },
  name: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.foreground },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.secondaryForeground,
    marginTop: 1,
  },
  review: {
    minHeight: minTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.paperYellow,
  },
  reviewShadow: { boxShadow: shadows.control },
  reviewPressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
  reviewText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
});
