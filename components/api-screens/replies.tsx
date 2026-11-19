import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Avatar, styles } from "@/components/biz-ui";
import { useMabizServices } from "@/lib/services/service-provider";
import { errorText, pageRequest } from "@/lib/api-helpers";
import type { SocialApiComment } from "@/lib/api/feature-contracts";

export function Replies({ comment }: { comment: SocialApiComment }) {
  const services = useMabizServices();
  const [replies, setReplies] = useState<SocialApiComment[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    services.posts.listReplies(comment.id, pageRequest()).then((result) => {
      if (!mounted) return;
      if (!result.ok) setError(errorText(result.error));
      else setReplies(result.data.items);
    });
    return () => {
      mounted = false;
    };
  }, [comment.id, services]);
  return (
    <View style={{ marginLeft: 34, gap: 6 }}>
      {error ? (
        <Text accessibilityRole="alert" style={styles.caption}>
          Replies unavailable: {error}
        </Text>
      ) : (
        replies.map((reply) => (
          <View key={reply.id} style={styles.actionTile}>
            <Avatar name={reply.userName} image={reply.userAvatar} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{reply.userName}</Text>
              <Text style={styles.body}>{reply.text}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}