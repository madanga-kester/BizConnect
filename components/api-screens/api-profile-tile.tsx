import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, Text } from "react-native";
import { styles } from "@/components/biz-ui";
import { colors } from "@/theme/tokens";
import { postIsReshared, postIsVideo, postThumb, type LoosePost } from "@/lib/profile-post-utils";
import type { Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

export function ApiProfileTile({ post, size }: { post: Post; size: number }) {
  useThemeContext();
  const loose = post as LoosePost;
  const uri = postThumb(loose);
  const video = postIsVideo(loose);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open post"
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.subtle,
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        overflow: "hidden",
      }}
    >
      {uri && !video ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : video ? (
        <Ionicons name="videocam" size={28} color={colors.muted} />
      ) : (
        <Text numberOfLines={5} style={[styles.caption, { textAlign: "center" }]}>
          {loose.caption ?? loose.text ?? ""}
        </Text>
      )}
      {video ? (
        <Ionicons name="play" size={16} color={colors.navy} style={{ position: "absolute", top: 6, right: 6 }} />
      ) : postIsReshared(loose) ? (
        <Ionicons name="repeat" size={16} color={colors.navy} style={{ position: "absolute", top: 6, right: 6 }} />
      ) : null}
    </Pressable>
  );
}