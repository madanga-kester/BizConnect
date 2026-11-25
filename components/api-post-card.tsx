
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Avatar,
  MediaImage,
  VideoPreview,
  styles,
} from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import type { Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

const errorText = (error: { message: string; code?: string }) =>
  `${error.message}${error.code ? ` (${error.code})` : ""}`;

export function ApiPostCard({ post }: { post: Post }) {
  useThemeContext();

  const services = useMabizServices();
  const app = useAppStore();
  const { width: screenWidth } = useWindowDimensions();

  const [liked, setLiked] = useState(Boolean(post.viewerHasLiked));
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [poll, setPoll] = useState(post.poll);
  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const personName =
    post.authorId === app.user.id
      ? app.user.name
      : post.authorName ?? "Mabiz member";

  const name =
    post.identityKind === "business"
      ? post.identityName ?? "Business"
      : personName;

  const media = post.mediaItems?.length
    ? post.mediaItems
    : post.media
      ? [post.media]
      : [];

  const openDetail = () =>
    router.push({
      pathname: "/post/[id]",
      params: { id: post.id },
    });

  const openProfile = () => {
    if (post.identityKind === "business" && post.businessId) {
      router.push({
        pathname: "/business/[id]",
        params: { id: post.businessId },
      });
      return;
    }

    openDetail();
  };

  const requireAuth = () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return false;
    }

    return true;
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;

    setBusy(true);
    setError("");

    try {
      const result = liked
        ? await services.posts.unlike(post.id)
        : await services.posts.like(post.id);

      if (!result.ok) {
        setError(errorText(result.error));
        return;
      }

      const nextLiked = !liked;
      setLiked(nextLiked);

      const status = await services.posts.getLikeStatus(post.id);

      if (status.ok) {
        setLiked(status.data.viewerHasLiked);
        setLikeCount(status.data.likeCount);
      } else {
        setLikeCount((count) =>
          Math.max(0, count + (nextLiked ? 1 : -1))
        );
        setError(
          `Like updated, but refresh failed: ${errorText(status.error)}`
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update like.");
    } finally {
      setBusy(false);
    }
  };

  const vote = async (optionId: string) => {
    if (!requireAuth()) return;

    setBusy(true);
    setError("");

    try {
      const result = await services.posts.vote(post.id, {
        optionIds: [optionId],
      });

      if (!result.ok) {
        setError(errorText(result.error));
      } else {
        setPoll(result.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit vote.");
    } finally {
      setBusy(false);
    }
  };

  const sharePost = async () => {
    try {
      await Share.share({
        message: `Check out this post by ${name} on Mabiz.`,
      });
    } catch {
      setError("Unable to share this post.");
    }
  };

  const toggleSaved = () => {
    if (!requireAuth()) return;

    setSaved((value) => !value);

    Alert.alert(
      saved ? "Removed from saved" : "Saved",
      saved
        ? "This post was removed from your saved posts."
        : "This post is saved locally. Connect your bookmark service to persist it."
    );
  };

  const showPostMenu = () => {
    Alert.alert("Post options", undefined, [
      {
        text: "View post",
        onPress: openDetail,
      },
      {
        text: "Visit profile",
        onPress: openProfile,
      },
      {
        text: "Share post",
        onPress: () => void sharePost(),
      },
      {
        text: "Report post",
        onPress: () =>
          Alert.alert(
            "Report post",
            "Connect this option to your moderation reporting service."
          ),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const iconButton = (
    icon: React.ComponentProps<typeof Ionicons>["name"],
    label: string,
    onPress: () => void,
    active = false,
    count?: number
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={onPress}
      hitSlop={8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 8,
      }}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? colors.orange : colors.ink}
      />

      {count !== undefined && (
        <Text
          style={{
            color: active ? colors.orange : colors.ink,
            fontSize: 13,
            fontWeight: "700",
          }}
        >
          {count.toLocaleString()}
        </Text>
      )}
    </Pressable>
  );

  const textMuted = {
    color: colors.muted,
    fontSize: 12,
  } as const;

  const pollHasVoted = Boolean(poll?.viewerVoteOptionId);

  return (
    <View
      style={[
        styles.card,
        {
          padding: 0,
          overflow: "hidden",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.white,
          shadowColor: "#000",
          shadowOpacity: 0.035,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
      ]}
    >
      {/* POST HEADER */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 15,
          paddingTop: 14,
          paddingBottom: 12,
          gap: 10,
        }}
      >
        <Pressable onPress={openProfile}>
          <Avatar
            name={name}
            image={
              post.identityKind === "business"
                ? post.identityAvatar
                : post.authorAvatar
            }
            size={43}
          />
        </Pressable>

        <Pressable
          onPress={openProfile}
          style={{ flex: 1, gap: 3 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: colors.ink,
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              {name}
            </Text>

            {post.identityKind === "business" && (
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={colors.emerald}
              />
            )}
          </View>

          <Text style={textMuted} numberOfLines={1}>
            {post.identityKind === "business"
              ? "Business"
              : `@${post.authorUsername || "member"}`}
            {" · "}
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More post options"
          onPress={showPostMenu}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color={colors.ink}
          />
        </Pressable>
      </View>

      {/* POST CAPTION */}
      {post.caption ? (
        <View
          style={{
            paddingHorizontal: 15,
            paddingBottom: media.length ? 12 : 14,
          }}
        >
          <Text
            numberOfLines={expanded ? undefined : 5}
            style={{
              color: colors.ink,
              fontSize: 14,
              lineHeight: 22,
            }}
          >
            {post.caption}
          </Text>

          {post.caption.length > 180 && (
            <Pressable
              onPress={() => setExpanded(!expanded)}
              style={{
                alignSelf: "flex-start",
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {expanded ? "See less" : "See more"}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* MEDIA - NATURAL IMAGE RATIO */}
      {media.length > 0 && (
        <View style={{ width: "100%" }}>
          <View
            style={{
              width: "100%",
              backgroundColor: colors.subtle,
            }}
          >
            {post.video ? (
              <VideoPreview
                uri={media[activeImage]}
                height={280}
              />
            ) : (
              <MediaImage
                uri={media[activeImage]}
                height={Math.min(screenWidth * 1.25, 620)}
                label={`${name} photo ${activeImage + 1}`}
              />
            )}
          </View>

          {media.length > 1 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 5,
                paddingVertical: 10,
              }}
            >
              {media.map((_, index) => (
                <Pressable
                  key={`${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Show image ${index + 1}`}
                  onPress={() => setActiveImage(index)}
                  style={{
                    width: activeImage === index ? 17 : 6,
                    height: 6,
                    borderRadius: 5,
                    backgroundColor:
                      activeImage === index
                        ? colors.emerald
                        : colors.border,
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* POLL */}
      {poll && (
        <View
          style={{
            marginHorizontal: 15,
            marginTop: 12,
            marginBottom: 5,
            padding: 13,
            borderRadius: 13,
            backgroundColor: colors.subtle,
            gap: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
            }}
          >
            <Ionicons
              name="stats-chart-outline"
              size={18}
              color={colors.emerald}
            />

            <Text
              style={{
                flex: 1,
                color: colors.ink,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {poll.question}
            </Text>
          </View>

          {poll.options.map((option) => {
            const votes = option.voteCount ?? 0;
            const total = poll.totalVotes ?? 0;

            const percentage =
              total > 0
                ? Math.round((votes / total) * 100)
                : 0;

            const selected =
              poll.viewerVoteOptionId === option.id;

            return (
              <Pressable
                key={option.id}
                disabled={
                  busy ||
                  poll.isClosed ||
                  pollHasVoted
                }
                onPress={() => void vote(option.id)}
                style={{
                  padding: 11,
                  borderRadius: 11,
                  borderWidth: 1,
                  borderColor: selected
                    ? colors.emerald
                    : colors.border,
                  backgroundColor: colors.white,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: 13,
                      fontWeight: selected ? "800" : "600",
                      flex: 1,
                    }}
                  >
                    {option.text}
                    {selected ? " · Your vote" : ""}
                  </Text>

                  {(pollHasVoted || poll.isClosed) && (
                    <Text
                      style={{
                        color: colors.emerald,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {percentage}%
                    </Text>
                  )}
                </View>

                {(pollHasVoted || poll.isClosed) && (
                  <View
                    style={{
                      height: 5,
                      borderRadius: 5,
                      backgroundColor: colors.border,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 5,
                        width: `${percentage}%`,
                        borderRadius: 5,
                        backgroundColor: colors.emerald,
                      }}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}

          <Text style={textMuted}>
            {poll.totalVotes ?? 0} votes
            {poll.isClosed ? " · Poll closed" : ""}
            {poll.endsAt
              ? ` · Closes ${new Date(
                  poll.endsAt
                ).toLocaleDateString()}`
              : ""}
          </Text>
        </View>
      )}

      {/* ENGAGEMENT COUNTS */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 15,
          paddingTop: 12,
        }}
      >
        <Text style={textMuted}>
          {likeCount.toLocaleString()} likes
        </Text>

        <Pressable onPress={openDetail}>
          <Text style={textMuted}>
            {post.commentCount ?? 0} comments
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
          marginHorizontal: 15,
          marginTop: 10,
        }}
      />

      {/* ACTION BAR */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingVertical: 6,
        }}
      >
        {iconButton(
          liked ? "heart" : "heart-outline",
          liked ? "Unlike" : "Like",
          () => void toggleLike(),
          liked
        )}

        {iconButton(
          "chatbubble-outline",
          "Comment",
          openDetail
        )}

        {iconButton(
          "repeat-outline",
          "Repost",
          () =>
            Alert.alert(
              "Repost",
              "Connect this action to your repost service."
            )
        )}

        {iconButton(
          "share-social-outline",
          "Share",
          () => void sharePost()
        )}

        {iconButton(
          saved ? "bookmark" : "bookmark-outline",
          saved ? "Unsave" : "Save",
          toggleSaved,
          saved
        )}
      </View>

      {/* BUSINESS PROFILE */}
      {post.businessId && (
        <Pressable
          onPress={openProfile}
          style={{
            marginHorizontal: 15,
            marginBottom: 13,
            padding: 11,
            borderRadius: 10,
            backgroundColor: colors.subtle,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons
              name="storefront-outline"
              size={18}
              color={colors.emerald}
            />

            <Text
              style={{
                color: colors.ink,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              Visit business profile
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={17}
            color={colors.muted}
          />
        </Pressable>
      )}

      {/* ERROR */}
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{
            color: colors.danger,
            fontSize: 12,
            paddingHorizontal: 15,
            paddingBottom: 12,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
