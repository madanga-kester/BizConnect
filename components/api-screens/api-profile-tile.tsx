import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import {
  postIsReshared,
  postIsVideo,
  postThumb,
  type LoosePost,
} from "@/lib/profile-post-utils";
import type { Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

export function ApiProfileTile({ post, size }: { post: Post; size: number }) {
  useThemeContext();
  const loose = post as LoosePost;
  const uri = postThumb(loose);
  const video = postIsVideo(loose);
  const reshared = !video && postIsReshared(loose);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={video ? "Open video post" : "Open post"}
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}
      style={({ pressed }) => [
        localStyles.tile,
        { width: size, height: size },
        pressed && { opacity: 0.75 },
      ]}
    >
      {uri && !video ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : video ? (
        <Ionicons name="videocam-outline" size={26} color={colors.muted} />
      ) : (
        <Text
          numberOfLines={5}
          style={[styles.caption, localStyles.textPreview]}
        >
          {loose.caption ?? loose.text ?? ""}
        </Text>
      )}

      {video || reshared ? (
        <View style={localStyles.badge}>
          <Ionicons
            name={video ? "play-outline" : "repeat-outline"}
            size={14}
            color={colors.white}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    tile: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      padding: 6,
      overflow: "hidden",
    },
    textPreview: {
      textAlign: "center",
      color: colors.ink,
    },
    badge: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
  })
);