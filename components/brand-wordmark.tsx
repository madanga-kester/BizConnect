import { Text, type StyleProp, type TextStyle } from "react-native";
import { GrandHotel_400Regular, useFonts } from "@expo-google-fonts/grand-hotel";

export function BrandWordmark({ style }: { style?: StyleProp<TextStyle> }) {
  const [loaded] = useFonts({ GrandHotel_400Regular });
  return (
    <Text
      accessibilityRole="header"
      style={[
        style,
        loaded
          ? { fontFamily: "GrandHotel_400Regular", fontWeight: "normal", letterSpacing: 0, fontSize: 38 }
          : null,
      ]}
    >
      Mabiz
    </Text>
  );
}