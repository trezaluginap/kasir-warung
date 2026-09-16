/**
 * ============================================
 * MICRO-INTERACTIONS - Komponen animasi ringan
 * ============================================
 *
 * Semua animasi pakai react-native-reanimated v4:
 * - Jalan di UI THREAD (bukan JS thread) -> TIDAK nge-lag
 * - 0 library baru, 0 ukuran APK tambahan
 *
 * Komponen:
 * 1. PressableScale  - tombol membesar saat ditekan (spring)
 * 2. AnimatedNumber  - angka count-up saat value berubah
 * 3. FadeInView      - konten fade+slide saat pertama muncul
 * 4. BounceInView    - elemen bounce (success check, dll)
 */

import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

/* ============ 1. PressableScale ============
 * Tombol yang "memantul" saat ditekan.
 * Pakai Gesture.Tap dari react-native-gesture-handler
 * (sudah terinstall, auto-worklet di reanimated v4) —
 * jauh lebih reliable daripada Pressable biasa.
 */
export function PressableScale({ children, style, scaleTo = 0.94, onPress, disabled, ...props }) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(5000)
    .onBegin(() => {
      scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 });
    })
    .onEnd(() => {
      if (onPress && !disabled) {
        runOnJS(onPress)();
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[animStyle, style]} {...props}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

/* ============ 2. AnimatedNumber ============
 * Angka count-up saat value berubah.
 * Format: "Rp 25.000" — animasi 300ms, tidak blokir input.
 */
function formatRupiah(n) {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}

export function AnimatedNumber({ value, duration = 300, style }) {
  const [display, setDisplay] = React.useState(value);
  const prevRef = React.useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    const diff = value - prev;
    const steps = 12;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDisplay(prev + (diff * step) / steps);
      if (step >= steps) {
        clearInterval(interval);
        setDisplay(value);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value, duration]);

  return (
    <Text style={style} numberOfLines={1} adjustsFontSizeToFit>
      {formatRupiah(Math.round(display))}
    </Text>
  );
}

/* ============ 3. FadeInView ============
 * Konten muncul dengan fade + slide halus.
 * Dipakai untuk: item list pertama render, section baru.
 */
export function FadeInView({ children, delay = 0, direction = "down" }) {
  const entering = direction === "down" ? FadeInDown : FadeInUp;
  return (
    <Animated.View entering={entering.delay(delay).duration(250).springify()}>
      {children}
    </Animated.View>
  );
}

/* ============ 4. BounceInView ============
 * Elemen bounce masuk (success check, emoji, kartu sukses).
 * ZoomIn bawaan reanimated: 0 -> 1 dengan effect kenyal.
 */
export function BounceInView({ children, delay = 0 }) {
  return (
    <Animated.View entering={ZoomIn.delay(delay).duration(350)}>
      {children}
    </Animated.View>
  );
}