import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Avatar, VideoPreview } from "@/components/biz-ui";
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
  const [likeBusy, setLikeBusy] = useState(false);
  const [error, setError] = useState("");
  const [poll, setPoll] = useState(post.poll);
  const [activeImage, setActiveImage] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const media = post.mediaItems?.length
    ? post.mediaItems
    : post.media
      ? [post.media]
      : [];

  const activeMediaUri = media[activeImage];

  useEffect(() => {
    setImageAspectRatio(1);
    if (!activeMediaUri || post.video) return;

    let isCurrent = true;

    Image.getSize(
      activeMediaUri,
      (width, height) => {
        if (isCurrent && width > 0 && height > 0) {
          setImageAspectRatio(width / height);
        }
      },
      () => {
        if (isCurrent) setImageAspectRatio(1);
      }
    );

    return () => {
      isCurrent = false;
    };
  }, [activeMediaUri, post.video]);

  useEffect(() => {
    setLiked(Boolean(post.viewerHasLiked));
    setLikeCount(post.likes);
    setPoll(post.poll);
  }, [post.viewerHasLiked, post.likes, post.poll]);

  const personName =
    app.user && post.authorId === app.user.id
      ? app.user.name
      : post.authorName ?? "Mabiz member";

  const name =
    post.identityKind === "business"
      ? post.identityName ?? "Business"
      : personName;

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
    if (!requireAuth() || likeBusy) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    let applied = false;

    setLiked(nextLiked);
    setLikeCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
    setLikeBusy(true);
    setError("");

    try {
      const result = previousLiked
        ? await services.posts.unlike(post.id)
        : await services.posts.like(post.id);

      if (!result.ok) {
        setLiked(previousLiked);
        setLikeCount(previousCount);
        setError(errorText(result.error));
        return;
      }

      applied = true;
      const status = await services.posts.getLikeStatus(post.id);

      if (status.ok) {
        setLiked(status.data.viewerHasLiked);
        setLikeCount(status.data.likeCount);
      } else {
        setError(
          `Like updated, but refresh failed: ${errorText(status.error)}`
        );
      }
    } catch (e) {
      if (!applied) {
        setLiked(previousLiked);
        setLikeCount(previousCount);
      }
      setError(e instanceof Error ? e.message : "Unable to update like.");
    } finally {
      setLikeBusy(false);
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

    const nextSaved = !saved;
    setSaved(nextSaved);

    Alert.alert(
      nextSaved ? "Saved" : "Removed from saved",
      nextSaved
        ? "This post is saved locally. Connect your bookmark service to persist it."
        : "This post was removed from your saved posts."
    );
  };

  const actionButton = (
    icon: React.ComponentProps<typeof Ionicons>["name"],
    accessibilityLabel: string,
    onPress: () => void,
    count?: number,
    active = false,
    disabled = false
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 6,
      }}
    >
      <Ionicons
        name={icon}
        size={21}
        color={active ? colors.orange : colors.ink}
      />

      {typeof count === "number" && (
        <Text
          style={{
            color: active ? colors.orange : colors.ink,
            fontSize: 13,
            fontWeight: active ? "700" : "600",
          }}
        >
          {count.toLocaleString()}
        </Text>
      )}
    </Pressable>
  );

  const flyoutOption = (
    icon: React.ComponentProps<typeof Ionicons>["name"],
    label: string,
    onPress: () => void,
    destructive = false
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        setMenuOpen(false);
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        backgroundColor: pressed ? colors.subtle : "transparent",
      })}
    >
      <Ionicons
        name={icon}
        size={21}
        color={destructive ? colors.danger : colors.ink}
      />
      <Text
        style={{
          color: destructive ? colors.danger : colors.ink,
          fontSize: 15,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const textMuted = {
    color: colors.muted,
    fontSize: 12,
  } as const;

  const pollHasVoted = Boolean(poll?.viewerVoteOptionId);

  return (
    <View
      style={{
        width: screenWidth,
        alignSelf: "center",
        backgroundColor: "transparent",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
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
          onPress={() => setMenuOpen(true)}
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
          <View style={{ width: "100%", margin: 0, padding: 0 }}>
            {post.video ? (
              <VideoPreview
                uri={activeMediaUri}
                height={280}
              />
            ) : (
              <Image
                source={{ uri: activeMediaUri }}
                accessibilityLabel={`${name} photo ${activeImage + 1}`}
                resizeMode="contain"
                style={{
                  width: "100%",
                  aspectRatio: imageAspectRatio,
                  backgroundColor: "transparent",
                }}
                onError={() => setImageAspectRatio(1)}
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
                  hitSlop={{ top: 12, bottom: 12, left: 2, right: 2 }}
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
                  backgroundColor: colors.surface,
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

      {/* UNIFIED ENGAGEMENT & ACTION BAR */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 15,
          paddingTop: 10,
          paddingBottom: post.businessId ? 4 : 12,
        }}
      >
        {/* LEFT: Unified Like/Love + Conversation Actions */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 18,
          }}
        >
          {/* Like & Love combined into one single interaction with count */}
          {actionButton(
            liked ? "heart" : "heart-outline",
            liked ? "Unlike post" : "Like post",
            () => void toggleLike(),
            likeCount,
            liked,
            likeBusy
          )}

          {/* Conversation actions: Comment & Repost */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            {actionButton(
              "chatbubble-outline",
              "Comments",
              openDetail,
              post.commentCount ?? 0
            )}

            {actionButton(
              "repeat-outline",
              "Repost",
              () =>
                Alert.alert(
                  "Repost",
                  "Connect this action to your repost service."
                )
            )}
          </View>
        </View>

        {/* RIGHT: Secondary Actions (Share & Save) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          {actionButton(
            "paper-plane-outline",
            "Share post",
            () => void sharePost()
          )}

          {actionButton(
            saved ? "bookmark" : "bookmark-outline",
            saved ? "Remove from saved" : "Save post",
            toggleSaved,
            undefined,
            saved
          )}
        </View>
      </View>

      {/* SMALL BUSINESS LINK (LEFT AS IS) */}
      {post.businessId && (
        <Pressable
          onPress={openProfile}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginLeft: 15,
            marginBottom: 12,
            paddingVertical: 2,
          }}
        >
          <Ionicons
            name="storefront-outline"
            size={14}
            color={colors.emerald}
          />

          <Text
            style={{
              color: colors.emerald,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            Visit business
          </Text>

          <Ionicons
            name="chevron-forward"
            size={12}
            color={colors.emerald}
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

      {/* BOTTOM FLYOUT MENU */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            style={{ flex: 1 }}
            onPress={() => setMenuOpen(false)}
          />

          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 10,
              paddingBottom: 28,
            }}
          >
            {/* DRAG HANDLE */}
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: "center",
                marginBottom: 8,
              }}
            />

            {flyoutOption("eye-outline", "View post", openDetail)}

            {flyoutOption(
              post.identityKind === "business"
                ? "storefront-outline"
                : "person-outline",
              `About ${name}`,
              openProfile
            )}

            {flyoutOption(
              "eye-off-outline",
              "Not interested",
              () =>
                Alert.alert(
                  "Post hidden",
                  "We'll show fewer posts like this."
                )
            )}

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 6,
                marginHorizontal: 18,
              }}
            />

            {flyoutOption(
              "flag-outline",
              "Report post",
              () =>
                Alert.alert(
                  "Report post",
                  "Connect this option to your moderation reporting service."
                ),
              true
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}