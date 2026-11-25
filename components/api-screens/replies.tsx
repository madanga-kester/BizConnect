import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { styles } from "@/components/biz-ui";
import { CommentItem } from "./comment-item";
import { useMabizServices } from "@/lib/services/service-provider";
import { pageRequest } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { SocialApiComment } from "@/lib/api/feature-contracts";
import { useThemeContext } from "@/lib/theme-provider";

/** Collapsed by default: replies are fetched only when the user expands them.
 *  Bump `version` (e.g. after posting a reply) to refetch while expanded. */
export function Replies({
  comment,
  version = 0,
}: {
  comment: SocialApiComment;
  version?: number;
}) {
  useThemeContext();
  const services = useMabizServices();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<SocialApiComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const count = comment.replyCount ?? 0;

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    setFailed(false);
    services.posts.listReplies(comment.id, pageRequest()).then((result) => {
      if (!mounted) return;
      if (!result.ok) setFailed(true);
      else setReplies(result.data.items);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [open, version, comment.id, services]);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        hitSlop={6}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [
          localStyles.toggle,
          pressed && { opacity: 0.6 },
        ]}
      >
        <View style={localStyles.toggleLine} />
        <Text style={localStyles.toggleText}>
          {open
            ? "Hide replies"
            : `View ${count} ${count === 1 ? "reply" : "replies"}`}
        </Text>
      </Pressable>

      {open ? (
        <View style={localStyles.container}>
          {loading && !replies.length ? (
            <Text style={styles.caption}>Loading replies…</Text>
          ) : null}
          {failed ? (
            <Text accessibilityRole="alert" style={styles.caption}>
              Couldn't load replies. Collapse and open again to retry.
            </Text>
          ) : (
            replies.map((reply, index) => (
              <View
                key={reply.id}
                style={[
                  localStyles.replyRow,
                  index === replies.length - 1 && localStyles.replyRowLast,
                ]}
              >
                <CommentItem comment={reply} compact />
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    toggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },
    toggleLine: {
      width: 20,
      borderTopWidth: 1.5,
      borderTopColor: colors.border,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.emeraldDark,
    },
    container: {
      marginLeft: 12,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      backgroundColor: colors.surface,
    },
    replyRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    replyRowLast: { borderBottomWidth: 0 },
    replyContent: { flex: 1, gap: 2 },
  })
);
