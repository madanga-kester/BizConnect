import { Image, Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export function SquareAvatar({
  name,
  image,
  size,
  borderColor,
}: {
  name: string;
  image?: string;
  size: number;
  borderColor?: string;
}) {
  useThemeContext();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.emeraldTint,
        borderWidth: borderColor ? 2 : 0,
        borderColor: borderColor ?? "transparent",
      }}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            color: colors.emeraldDark,
            fontWeight: "800",
            fontSize: Math.round(size * 0.4),
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}