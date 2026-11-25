import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { SocialApiComment } from "@/lib/api/feature-contracts";
import { useThemeContext } from "@/lib/theme-provider";

export function timeAgo(value: unknown): string {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return date.toLocaleDateString();
}

export function CommentItem({
  comment,
  compact = false,
  onReply,
}: {
  comment: SocialApiComment;
  compact?: boolean;
  onReply?: () => void;
}) {
  useThemeContext();
  // Local only until the API supports comment likes.
  const [liked, setLiked] = useState(false);
  const time = timeAgo(
    (comment as unknown as { createdAt?: unknown }).createdAt
  );

  return (
    <View style={localStyles.row}>
      <Avatar
        name={comment.userName}
        image={comment.userAvatar}
        size={compact ? 28 : 36}
      />
      <View style={localStyles.body}>
        <View style={localStyles.meta}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {comment.userName}
          </Text>
          {time ? <Text style={styles.caption}>{time}</Text> : null}
        </View>
        <Text style={styles.body}>{comment.text}</Text>
        {onReply ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${comment.userName}`}
            onPress={onReply}
            hitSlop={6}
            style={({ pressed }) => [
              localStyles.replyAction,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={localStyles.replyText}>Reply</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={liked ? "Unlike comment" : "Like comment"}
        accessibilityState={{ selected: liked }}
        onPress={() => setLiked((value) => !value)}
        hitSlop={8}
        style={localStyles.like}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={compact ? 16 : 18}
          color={liked ? colors.orange : colors.muted}
        />
      </Pressable>
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    row: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    body: { flex: 1, gap: 2 },
    meta: { flexDirection: "row", alignItems: "center", gap: 6 },
    replyAction: { alignSelf: "flex-start", paddingTop: 4 },
    replyText: { fontSize: 12, fontWeight: "600", color: colors.muted },
    like: { paddingTop: 2, paddingHorizontal: 2 },
  })
);