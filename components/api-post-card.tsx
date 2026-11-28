import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Avatar, VideoPreview } from "@/components/biz-ui";
import { SquareAvatar } from "@/components/square-avatar";
import { useAppStore } from "@/hooks/use-app-store";
import { errorText } from "@/lib/api-helpers";
import { useMabizServices } from "@/lib/services/service-provider";
import { useThemeContext } from "@/lib/theme-provider";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { Post } from "@/types/domain";

// ASSUMED: change to your real public post URL (or deep-link scheme).
const POST_URL_BASE = "https://mabiz.app/post/";

const CAPTION_LINES = 7;
const CAPTION_CHAR_LIMIT = 320;
const MIN_RATIO = 0.8; // 4:5 portrait
const MAX_RATIO = 1.91; // landscape
const DOUBLE_TAP_MS = 280;

const REPORT_REASONS: { id: string; label: string }[] = [
  { id: "spam", label: "Spam or misleading" },
  { id: "scam", label: "Scam or fraud" },
  { id: "harassment", label: "Harassment or hate" },
  { id: "sexual", label: "Nudity or sexual content" },
  { id: "violence", label: "Violence or dangerous content" },
  { id: "illegal_goods", label: "Counterfeit or illegal goods" },
  { id: "other", label: "Something else" },
];

const relativeTime = (value: string | number | Date) => {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type ApiPostCardProps = {
  post: Post;
  hideBusinessLink?: boolean;
  currentProfileId?: string;
  /** Receives the post, so the parent can pass ONE stable function to every card */
  onOpenComments?: (post: Post) => void;
  /** Pass a live count (e.g. from CommentsSheet) to override post.commentCount */
  commentCount?: number;
  /** Remove the card from the feed ("Not interested" / after a report) */
  onHide?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
};

function ApiPostCardBase({
  post,
  hideBusinessLink = false,
  currentProfileId,
  onOpenComments,
  commentCount,
  onHide,
  onEdit,
  onDelete,
}: ApiPostCardProps) {
  useThemeContext();

  const services = useMabizServices();
  const app = useAppStore();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [liked, setLiked] = useState(Boolean(post.viewerHasLiked));
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(false); // local only for now
  const [busy, setBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [error, setError] = useState("");
  const [poll, setPoll] = useState(post.poll);
  const [activeImage, setActiveImage] = useState(0);
  // Full-bleed: always the screen width, even inside a padded parent list
  const cardWidth = screenWidth;
  const [imageRatio, setImageRatio] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<"menu" | "report">("menu");
  const [reporting, setReporting] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const menuProgress = useRef(new Animated.Value(0)).current;

  const lastTapRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // animations
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const likeBounce = useRef(new Animated.Value(1)).current;
  const saveBounce = useRef(new Animated.Value(1)).current;

  useEffect(
    () => () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    },
    []
  );

  // Backdrop fades, sheet slides: separate animations so the dark layer never "floats"
  useEffect(() => {
    if (menuOpen) {
      setMenuMounted(true);
      Animated.timing(menuProgress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(menuProgress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMenuMounted(false);
          setMenuView("menu");
        }
      });
    }
  }, [menuOpen, menuProgress]);

  const menuScrimOpacity = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });
  const menuSheetY = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight * 0.6, 0],
  });

  const media = post.mediaItems?.length
    ? post.mediaItems
    : post.media
      ? [post.media]
      : [];

  const firstMediaUri = media[0];

  // Use the FIRST image's ratio (clamped) for the whole carousel so the
  // card never jumps in height while swiping.
  useEffect(() => {
    setImageRatio(1);
    setActiveImage(0);
    if (!firstMediaUri || post.video) return;
    let isCurrent = true;
    Image.getSize(
      firstMediaUri,
      (w, h) => {
        if (isCurrent && w > 0 && h > 0) {
          setImageRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, w / h)));
        }
      },
      () => {
        if (isCurrent) setImageRatio(1);
      }
    );
    return () => {
      isCurrent = false;
    };
  }, [firstMediaUri, post.video]);

  useEffect(() => {
    setLiked(Boolean(post.viewerHasLiked));
    setLikeCount(post.likes);
    setPoll(post.poll);
  }, [post.viewerHasLiked, post.likes, post.poll]);

  // collapse again if the caption changes
  useEffect(() => {
    setExpanded(false);
  }, [post.caption]);

  const personName =
    app.user && post.authorId === app.user.id
      ? app.user.name
      : post.authorName ?? "Mabiz member";

  const name =
    post.identityKind === "business"
      ? post.identityName ?? "Business"
      : personName;

  const isOwner = Boolean(app.user && post.authorId === app.user.id);
  const isBusiness = post.identityKind === "business";
  const showVerified =
    isBusiness && (post as any).identityVerified !== false;
  const commentTotal = commentCount ?? post.commentCount ?? 0;
  const mediaHeight = post.video ? 280 : cardWidth / imageRatio;

  // Cut the caption ourselves so it works the same on web and native
  const captionFull = post.caption ?? "";
  const showSeeMore =
    captionFull.length > CAPTION_CHAR_LIMIT ||
    captionFull.split("\n").length > CAPTION_LINES;
  const captionShown = (() => {
    if (!showSeeMore || expanded) return captionFull;
    let text = captionFull.split("\n").slice(0, CAPTION_LINES).join("\n");
    if (text.length > CAPTION_CHAR_LIMIT) {
      text = text.slice(0, CAPTION_CHAR_LIMIT);
      const lastSpace = text.lastIndexOf(" ");
      if (lastSpace > CAPTION_CHAR_LIMIT * 0.6) text = text.slice(0, lastSpace);
    }
    return `${text.trimEnd()}…`;
  })();

  const openDetail = () =>
    router.push({ pathname: "/post/[id]", params: { id: post.id } });

  const openProfile = () => {
    if (isBusiness) {
      const targetBusinessId = post.businessId ?? post.identityId;
      if (targetBusinessId) {
        router.push({
          pathname: "/business/[id]",
          params: { id: targetBusinessId },
        });
        return;
      }
    }

    if (post.authorId) {
      if (currentProfileId && post.authorId === currentProfileId) return;

      if (app.user && post.authorId === app.user.id) {
        router.push("/(tabs)/profile");
        return;
      }

      router.push({ pathname: "/person/[id]", params: { id: post.authorId } });
      return;
    }

    openDetail();
  };

  const openComments = () =>
    onOpenComments ? onOpenComments(post) : openDetail();

  const requireAuth = () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return false;
    }
    return true;
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ---------- animations ----------
  const popHeart = () => {
    heartScale.setValue(0.3);
    heartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const bounce = (value: Animated.Value) => {
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.3,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.spring(value, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ---------- like ----------
  const toggleLike = async () => {
    if (!requireAuth() || likeBusy) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikeCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
    setLikeBusy(true);
    setError("");
    if (nextLiked) bounce(likeBounce);

    try {
      const result = previousLiked
        ? await services.posts.unlike(post.id)
        : await services.posts.like(post.id);

      if (!result.ok) {
        setLiked(previousLiked);
        setLikeCount(previousCount);
        setError(errorText(result.error));
      }
    } catch (e) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setError(e instanceof Error ? e.message : "Unable to update like.");
    } finally {
      setLikeBusy(false);
    }
  };

  // single tap on media -> open post, double tap -> like with heart pop
  const handleMediaPress = () => {
    const now = Date.now();

    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      if (!requireAuth()) return;
      popHeart();
      if (!liked) void toggleLike();
      return;
    }

    lastTapRef.current = now;
    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      lastTapRef.current = 0;
      openDetail();
    }, DOUBLE_TAP_MS);
  };

  const vote = async (optionId: string) => {
    if (!requireAuth()) return;

    setBusy(true);
    setError("");

    try {
      const result = await services.posts.vote(post.id, {
        optionIds: [optionId],
      });

      if (!result.ok) setError(errorText(result.error));
      else setPoll(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit vote.");
    } finally {
      setBusy(false);
    }
  };

  const sharePost = async () => {
    const url = `${POST_URL_BASE}${post.id}`;
    const snippet = post.caption
      ? post.caption.length > 80
        ? `${post.caption.slice(0, 80)}...`
        : post.caption
      : "";
    try {
      await Share.share({
        message: `${name} on Mabiz${snippet ? `: ${snippet}` : ""}\n${url}`,
        url, // iOS
      });
    } catch {
      setError("Unable to share this post.");
    }
  };

  // Local-only for now: no alert, just a quiet toggle + bounce.
  const toggleSaved = () => {
    if (!requireAuth()) return;
    const next = !saved;
    setSaved(next);
    if (next) bounce(saveBounce);
  };

  const confirmDelete = () =>
    Alert.alert("Delete post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (onDelete) onDelete(post);
          else
            Alert.alert(
              "Delete post",
              "Connect this option to your delete service."
            );
        },
      },
    ]);

  const onHidePost = () => {
    if (onHide) onHide(post.id);
    else Alert.alert("Post hidden", "We'll show fewer posts like this.");
  };

  // ---------- report ----------
  // Calls services.posts.report(postId, { reason }) if your service has it.
  const submitReport = async (reason: string) => {
    if (reporting) return;
    setReporting(true);
    try {
      const api = services.posts as any;
      if (typeof api.report !== "function") {
        closeMenu();
        Alert.alert("Report", "Reporting isn't connected to the server yet.");
        return;
      }
      const result = await api.report(post.id, { reason });
      closeMenu();
      if (result && result.ok === false) {
        setError(errorText(result.error));
        return;
      }
      Alert.alert("Thanks for reporting", "We'll review this post.");
      onHide?.(post.id);
    } catch (e) {
      closeMenu();
      setError(e instanceof Error ? e.message : "Unable to send report.");
    } finally {
      setReporting(false);
    }
  };

  // ---------- carousel ----------
  const onCarouselEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    setActiveImage(Math.max(0, Math.min(media.length - 1, index)));
  };

  // ---------- caption with styled #tags and @mentions ----------
  const onTagPress = (tag: string) => {
    if (tag.startsWith("#")) {
      router.push({ pathname: "/discover", params: { q: tag } } as any);
    }
  };

  const renderCaption = (value: string) =>
    value.split(/(#\w+|@[\w.]+)/g).map((part, i) =>
      /^[#@]/.test(part) && part.length > 1 ? (
        <Text key={i} style={s.tag} onPress={() => onTagPress(part)}>
          {part}
        </Text>
      ) : (
        part
      )
    );

  // ---------- small builders ----------
  const actionButton = (
    icon: IconName,
    accessibilityLabel: string,
    onPress: () => void,
    count?: number,
    active = false,
    disabled = false,
    scale?: Animated.Value
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={s.actionButton}
    >
      <Animated.View style={scale ? { transform: [{ scale }] } : undefined}>
        <Ionicons
          name={icon}
          size={22}
          color={active ? colors.orange : colors.ink}
        />
      </Animated.View>

      {typeof count === "number" && (
        <Text
          style={{
            color: active ? colors.orange : colors.ink,
            fontSize: 15,
            fontWeight: active ? "700" : "600",
          }}
        >
          {count.toLocaleString()}
        </Text>
      )}
    </Pressable>
  );

  const flyoutOption = (
    icon: IconName,
    label: string,
    onPress: () => void,
    destructive = false,
    keepOpen = false
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        if (!keepOpen) closeMenu();
        onPress();
      }}
      style={({ pressed }) => [
        s.flyoutOption,
        { backgroundColor: pressed ? colors.subtle : "transparent" },
      ]}
    >
      <Ionicons
        name={icon}
        size={21}
        color={destructive ? colors.danger : colors.ink}
      />
      <Text
        style={[
          s.flyoutLabel,
          { color: destructive ? colors.danger : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const pollHasVoted = Boolean(poll?.viewerVoteOptionId);

  return (
    <View style={[s.card, { width: screenWidth }]}>
      {/* HEADER */}
      <View style={s.header}>
        <Pressable onPress={openProfile}>
          {isBusiness ? (
            <SquareAvatar name={name} image={post.identityAvatar} size={43} />
          ) : (
            <Avatar name={name} image={post.authorAvatar} size={43} />
          )}
        </Pressable>

        <Pressable onPress={openProfile} style={{ flex: 1, gap: 3 }}>
          <View style={s.nameRow}>
            <Text numberOfLines={1} style={s.name}>
              {name}
            </Text>
            {showVerified && (
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={colors.emerald}
              />
            )}
          </View>

          <Text style={s.muted} numberOfLines={1}>
            {isBusiness ? "Business" : `@${post.authorUsername || "member"}`}
            {" \u00B7 "}
            {relativeTime(post.createdAt)}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More post options"
          onPress={() => setMenuOpen(true)}
          hitSlop={10}
          style={s.moreButton}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
        </Pressable>
      </View>

      {/* CAPTION */}
      {post.caption ? (
        <View
          style={{
            paddingHorizontal: 15,
            paddingBottom: media.length ? 12 : 14,
          }}
        >
          <Pressable onPress={openDetail}>
            <Text
              numberOfLines={expanded ? undefined : CAPTION_LINES}
              style={s.caption}
            >
              {renderCaption(captionShown)}
            </Text>
          </Pressable>

          {showSeeMore && (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              style={{ alignSelf: "flex-start", marginTop: 4 }}
            >
              <Text style={s.seeMore}>{expanded ? "See less" : "See more"}</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* MEDIA: swipeable carousel, double-tap to like */}
      {media.length > 0 && (
        <View style={{ width: "100%" }}>
          <View style={{ width: "100%", height: mediaHeight }}>
            {post.video ? (
              <Pressable onPress={handleMediaPress}>
                <VideoPreview uri={media[0]} height={280} />
              </Pressable>
            ) : (
              <FlatList
                data={media}
                horizontal
                pagingEnabled
                scrollEnabled={media.length > 1}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(uri, i) => `${i}-${uri}`}
                onMomentumScrollEnd={onCarouselEnd}
                getItemLayout={(_, index) => ({
                  length: cardWidth,
                  offset: cardWidth * index,
                  index,
                })}
                renderItem={({ item, index }) => (
                  <Pressable
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`${name} photo ${index + 1} of ${media.length}`}
                    onPress={handleMediaPress}
                  >
                    <Image
                      source={{ uri: item }}
                      resizeMode="cover"
                      style={{ width: cardWidth, height: mediaHeight }}
                    />
                  </Pressable>
                )}
              />
            )}

            {/* heart pop overlay */}
            <Animated.View
              pointerEvents="none"
              style={[
                s.heartOverlay,
                { opacity: heartOpacity, transform: [{ scale: heartScale }] },
              ]}
            >
              <Ionicons name="heart" size={96} color={colors.white} />
            </Animated.View>

            {media.length > 1 && (
              <View style={s.counterPill} pointerEvents="none">
                <Ionicons name="images-outline" size={13} color={colors.white} />
                <Text style={s.counterText}>
                  {activeImage + 1}/{media.length}
                </Text>
              </View>
            )}
          </View>

          {media.length > 1 && (
            <View style={s.dots}>
              {media.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: activeImage === index ? 17 : 6,
                    height: 6,
                    borderRadius: 5,
                    backgroundColor:
                      activeImage === index ? colors.emerald : colors.border,
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* POLL */}
      {poll && (
        <View style={s.poll}>
          <View style={s.pollHeader}>
            <Ionicons
              name="stats-chart-outline"
              size={18}
              color={colors.emerald}
            />
            <Text style={s.pollQuestion}>{poll.question}</Text>
          </View>

          {poll.options.map((option) => {
            const votes = option.voteCount ?? 0;
            const total = poll.totalVotes ?? 0;
            const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
            const selected = poll.viewerVoteOptionId === option.id;
            const showResults = pollHasVoted || poll.isClosed;

            return (
              <Pressable
                key={option.id}
                disabled={busy || poll.isClosed || pollHasVoted}
                onPress={() => void vote(option.id)}
                style={[
                  s.pollOption,
                  { borderColor: selected ? colors.emerald : "transparent" },
                ]}
              >
                {showResults && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${percentage}%`,
                      backgroundColor: colors.emeraldTint,
                    }}
                  />
                )}
                <View style={s.pollOptionRow}>
                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: 13,
                      fontWeight: selected ? "800" : "600",
                      flex: 1,
                    }}
                  >
                    {option.text}
                    {selected ? " \u00B7 Your vote" : ""}
                  </Text>
                  {showResults && (
                    <Text style={s.pollPercent}>{percentage}%</Text>
                  )}
                </View>
              </Pressable>
            );
          })}

          <Text style={s.muted}>
            {poll.totalVotes ?? 0} votes
            {poll.isClosed ? " \u00B7 Poll closed" : ""}
            {poll.endsAt
              ? ` \u00B7 Closes ${new Date(poll.endsAt).toLocaleDateString()}`
              : ""}
          </Text>
        </View>
      )}

      {/* BUSINESS PROFILE LINK */}
      {!hideBusinessLink && isBusiness && post.businessId && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${post.identityName ?? name} profile`}
          onPress={openProfile}
          style={({ pressed }) => [s.businessLink, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="storefront-outline" size={13} color={colors.emerald} />
          <Text style={s.businessLinkText}>View Profile</Text>
          <Ionicons name="arrow-forward" size={12} color={colors.emerald} />
        </Pressable>
      )}

      {/* ACTION BAR */}
      <View style={s.actionBar}>
        <View style={s.actionGroup}>
          {actionButton(
            liked ? "heart" : "heart-outline",
            liked ? "Unlike post" : "Like post",
            () => void toggleLike(),
            likeCount,
            liked,
            likeBusy,
            likeBounce
          )}

          {actionButton(
            "chatbubble-outline",
            "Comments",
            openComments,
            commentTotal
          )}

          {actionButton("repeat-outline", "Repost", () =>
            Alert.alert("Repost", "Connect this action to your repost service.")
          )}
        </View>

        <View style={s.actionGroup}>
          {actionButton(
            "share-social-outline",
            "Share post",
            () => void sharePost()
          )}

          {actionButton(
            saved ? "bookmark" : "bookmark-outline",
            saved ? "Remove from saved" : "Save post",
            toggleSaved,
            undefined,
            saved,
            false,
            saveBounce
          )}
        </View>
      </View>

      {/* VIEW ALL COMMENTS / ADD A COMMENT */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open comments"
        onPress={openComments}
        style={s.commentsLink}
      >
        <Text style={s.commentsLinkText}>
          {commentTotal > 0
            ? `View all ${commentTotal.toLocaleString()} ${
                commentTotal === 1 ? "comment" : "comments"
              }`
            : "Be the first to comment"}
        </Text>
      </Pressable>

      {/* ERROR */}
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : null}

      {/* BOTTOM SHEET: options menu, swaps to the report reasons in place */}
      <Modal
        visible={menuMounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        <View style={s.menuRoot}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              s.menuScrim,
              { opacity: menuScrimOpacity },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            style={{ flex: 1 }}
            onPress={closeMenu}
          />

          <Animated.View
            style={[s.menuSheet, { transform: [{ translateY: menuSheetY }] }]}
          >
            <View style={s.menuHandle} />

            {menuView === "report" ? (
              <>
                <View style={s.reportHeader}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    onPress={() => setMenuView("menu")}
                    hitSlop={10}
                    disabled={reporting}
                  >
                    <Ionicons name="chevron-back" size={22} color={colors.ink} />
                  </Pressable>
                  <Text style={s.reportTitle}>Report post</Text>
                  <View style={{ width: 22 }} />
                </View>

                <Text style={s.reportHint}>Why are you reporting this post?</Text>

                {REPORT_REASONS.map((reason) => (
                  <Pressable
                    key={reason.id}
                    accessibilityRole="button"
                    accessibilityLabel={reason.label}
                    disabled={reporting}
                    onPress={() => void submitReport(reason.id)}
                    style={({ pressed }) => [
                      s.reportRow,
                      {
                        backgroundColor: pressed ? colors.subtle : "transparent",
                        opacity: reporting ? 0.5 : 1,
                      },
                    ]}
                  >
                    <Text style={s.flyoutLabel}>{reason.label}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                ))}

                {reporting ? (
                  <ActivityIndicator
                    style={{ marginTop: 10 }}
                    color={colors.emerald}
                  />
                ) : null}
              </>
            ) : (
              <>
                {flyoutOption("eye-outline", "View post", openDetail)}

                {flyoutOption("share-social-outline", "Share post", () =>
                  void sharePost()
                )}

                {flyoutOption(
                  isBusiness ? "storefront-outline" : "person-outline",
                  `About ${name}`,
                  openProfile
                )}

                {isOwner ? (
                  <>
                    {flyoutOption("create-outline", "Edit post", () => {
                      if (onEdit) onEdit(post);
                      else
                        Alert.alert(
                          "Edit post",
                          "Connect this option to your edit screen."
                        );
                    })}
                    <View style={s.menuDivider} />
                    {flyoutOption(
                      "trash-outline",
                      "Delete post",
                      confirmDelete,
                      true
                    )}
                  </>
                ) : (
                  <>
                    {flyoutOption(
                      "eye-off-outline",
                      "Not interested",
                      onHidePost
                    )}
                    <View style={s.menuDivider} />
                    {flyoutOption(
                      "flag-outline",
                      "Report post",
                      () => {
                        if (!requireAuth()) {
                          closeMenu();
                          return;
                        }
                        setMenuView("report");
                      },
                      true,
                      true
                    )}
                  </>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

export const ApiPostCard = memo(ApiPostCardBase);

const s = createThemedStyles(() =>
  StyleSheet.create({
    card: {
      alignSelf: "center",
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingTop: 14,
      paddingBottom: 12,
      gap: 10,
    },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    name: { color: colors.ink, fontSize: 14, fontWeight: "800" },
    muted: { color: colors.muted, fontSize: 12 },
    moreButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    caption: { color: colors.ink, fontSize: 14, lineHeight: 22 },
    tag: { color: colors.emerald, fontWeight: "600" },
    seeMore: { color: colors.muted, fontSize: 13, fontWeight: "700" },
    heartOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    counterPill: {
      position: "absolute",
      top: 10,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    counterText: { color: colors.white, fontSize: 12, fontWeight: "700" },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
      paddingVertical: 10,
    },
    poll: {
      marginHorizontal: 15,
      marginTop: 4,
      marginBottom: 5,
      gap: 10,
    },
    pollHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
    pollQuestion: {
      flex: 1,
      color: colors.ink,
      fontSize: 15,
      fontWeight: "800",
    },
    pollOption: {
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: colors.subtle,
      overflow: "hidden",
    },
    pollOptionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pollPercent: { color: colors.emerald, fontSize: 12, fontWeight: "800" },
    businessLink: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginLeft: 15,
      marginTop: 2,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.emerald,
    },
    businessLinkText: {
      color: colors.emerald,
      fontSize: 12,
      fontWeight: "700",
    },
    actionBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 15,
      paddingTop: 6,
      paddingBottom: 4,
    },
    actionGroup: { flexDirection: "row", alignItems: "center", gap: 22 },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 6,
    },
    commentsLink: {
      alignSelf: "flex-start",
      paddingHorizontal: 15,
      paddingTop: 2,
      paddingBottom: 14,
    },
    commentsLinkText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
    error: {
      color: colors.danger,
      fontSize: 12,
      paddingHorizontal: 15,
      paddingBottom: 12,
    },
    menuRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    menuScrim: {
      backgroundColor: "#000000",
    },
    menuSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 10,
      paddingBottom: 28,
    },
    menuHandle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 8,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 6,
      marginHorizontal: 18,
    },
    flyoutOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    flyoutLabel: { fontSize: 15, fontWeight: "600", color: colors.ink },
    reportHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingBottom: 6,
    },
    reportTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
    reportHint: {
      color: colors.muted,
      fontSize: 13,
      paddingHorizontal: 18,
      paddingBottom: 6,
    },
    reportRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
  })
);