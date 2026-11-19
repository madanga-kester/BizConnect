import { useEffect, useRef } from "react";
import { useThemeContext } from "@/lib/theme-provider";
import { colors } from "@/theme/tokens";
import {
  Animated,
  Easing,
  View,
 
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = "100%", height = 14, radius = 8, style }: SkeletonProps) {
  useThemeContext();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonGrid({ count = 9, size }: { count?: number; size: number }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width={size} height={size} radius={0} />
      ))}
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <Skeleton width={82} height={82} radius={41} />
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ alignItems: "center", gap: 6 }}>
              <Skeleton width={32} height={18} />
              <Skeleton width={52} height={12} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton width="55%" height={20} />
        <Skeleton width="35%" height={12} />
        <Skeleton width="90%" height={14} />
      </View>
      <View style={{ flexDirection: "row", gap: 9 }}>
        <Skeleton height={36} radius={10} style={{ flex: 1 }} />
        <Skeleton height={36} radius={10} style={{ flex: 1 }} />
      </View>
    </View>
  );
}