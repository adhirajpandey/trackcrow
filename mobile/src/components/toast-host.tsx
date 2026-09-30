import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { minTarget } from '../theme';
import { Panel, type } from './ui';
export type Toast = { message: string; undo?: () => void | Promise<void>; duration?: number };
const ToastContext = createContext<((toast: Toast) => void) | null>(null);
export function ToastHost({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const show = useCallback((next: Toast) => setToast({ ...next, id: ++nextId.current }), []);
  useEffect(() => {
    progress.value = withTiming(toast ? 1 : 0, { duration: reducedMotion ? 0 : 200 });
    if (!toast) return;
    // Android announces the live region; explicit announcement covers iOS as well.
    AccessibilityInfo.announceForAccessibility(`${toast.message}${toast.undo ? '. Undo available.' : ''}`);
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    void AccessibilityInfo.getRecommendedTimeoutMillis(toast.duration ?? 6000)
      .then((duration) => {
        if (active)
          timer = setTimeout(() => setToast((current) => (current?.id === toast.id ? null : current)), duration);
      })
      .catch(() => {
        if (active)
          timer = setTimeout(
            () => setToast((current) => (current?.id === toast.id ? null : current)),
            toast.duration ?? 6000,
          );
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [toast, reducedMotion, progress]);
  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * 12 }],
  }));
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View style={[styles.host, { bottom: Math.max(insets.bottom, 12) + 76 }, animated]}>
          <Panel raised tone="mint" style={{ padding: 12 }}>
            <View style={styles.row}>
              <Text accessibilityLiveRegion="polite" style={[type.body, { flex: 1 }]}>
                {toast.message}
              </Text>
              {toast.undo ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Undo"
                  style={styles.action}
                  onPress={() => {
                    const current = toast;
                    setToast(null);
                    Promise.resolve()
                      .then(() => current.undo?.())
                      .catch(() => show({ message: 'Could not undo. Try again.' }));
                  }}
                >
                  <Text style={type.label}>Undo</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                style={styles.action}
                onPress={() => setToast(null)}
              >
                <Text style={type.body}>×</Text>
              </Pressable>
            </View>
          </Panel>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside ToastHost');
  return show;
}
const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, zIndex: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  action: { minHeight: minTarget, minWidth: minTarget, alignItems: 'center', justifyContent: 'center' },
});
