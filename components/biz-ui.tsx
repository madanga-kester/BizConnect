import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent, type TextInputProps, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useThemeContext } from "@/lib/theme-provider";
import { isRunningInPreviewIframe } from "@/lib/embedded-preview";
import * as Network from "expo-network";
import { colors, createThemedStyles, radius } from "@/theme/tokens";
import { formatKes } from "@/utils/kenya";
import { resolveTopContentInset } from "@/utils/safe-area";
import { PEOPLE } from "@/data/seed";
import type { Business, Post, Product } from "@/types/domain";

function ConnectivityBanner() {
  useThemeContext();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let active = true;
    Network.getNetworkStateAsync().then((state) => { if (active) setOffline(state.isConnected === false || state.isInternetReachable === false); }).catch(() => undefined);
    const subscription = Network.addNetworkStateListener((state) => setOffline(state.isConnected === false || state.isInternetReachable === false));
    return () => { active = false; subscription.remove(); };
  }, []);
  return offline ? <View accessibilityRole="alert" style={styles.offlineNote}><Ionicons name="cloud-offline-outline" size={15} color={colors.warning} /><Text style={styles.offlineText}>You&apos;re offline · saved demo content is still available on this device.</Text></View> : null;
}

export function Page({ children, scroll = true, style, refreshing, onRefresh, onScroll, topColor }: { children: ReactNode; scroll?: boolean; style?: ViewStyle; refreshing?: boolean; onRefresh?: () => void; onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void; topColor?: string }) {
  useThemeContext();
  const content = <><ConnectivityBanner />{children}</>;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topInset = resolveTopContentInset({
    platform: Platform.OS,
    topInset: insets.top,
    viewportWidth: width,
    embeddedPreview: Platform.OS === "web" && isRunningInPreviewIframe(),
  });
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: topColor ?? colors.canvas, paddingTop: topInset }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    {scroll ? <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={[styles.page, style]} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.emerald} /> : undefined} onScroll={onScroll} scrollEventThrottle={onScroll ? 180 : undefined}>{content}</ScrollView> : <View style={[styles.page, { flex: 1, backgroundColor: colors.canvas }, style]}><ConnectivityBanner />{children}</View>}
  </KeyboardAvoidingView>;
}

export function TopBar({ title, back, right, subtitle, brandNameOnly = false, onTitlePress }: { title?: string; back?: boolean; right?: ReactNode; subtitle?: string; brandNameOnly?: boolean; onTitlePress?: () => void }) {
  useThemeContext();
  return <View style={styles.topbar}>
    {back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable> : brandNameOnly ? null : <View style={styles.brandMark}><Image source={require("../assets/images/splash-icon.png")} style={{ width: 32, height: 32 }} contentFit="contain" accessibilityLabel="Mabiz logo" /></View>}
    <View style={{ flex: 1 }}>
      {brandNameOnly && !title ? <Text style={[styles.topTitle, { fontSize: 21, letterSpacing: -0.55 }]}><Text style={{ color: colors.ink }}>Biz</Text><Text style={{ color: colors.emerald }}>Connect</Text></Text> : onTitlePress ? <Pressable accessibilityRole="button" accessibilityLabel="Switch profile" onPress={onTitlePress} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}><Text style={styles.topTitle}>{title ?? "Mabiz"}</Text><Ionicons name="chevron-down" size={18} color={colors.ink} /></Pressable> : <Text style={styles.topTitle}>{title ?? "Mabiz"}</Text>}
      {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>;
}

export function IconButton({ name, onPress, label, color = colors.ink, badge, compact = false }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; color?: string; badge?: boolean; compact?: boolean }) {
  useThemeContext();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.iconButton, compact ? { width: 34, height: 34, borderRadius: 12 } : null]}><Ionicons name={name} size={compact ? 18 : 21} color={color} />{badge ? <View style={styles.dot} /> : null}</Pressable>;
}

export function Button({ title, onPress, variant = "primary", icon, disabled, small }: { title: string; onPress: () => void; variant?: "primary" | "soft" | "outline" | "quiet" | "danger"; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; small?: boolean }) {
  useThemeContext();
  const palette = variant === "primary" ? [colors.emeraldFill, colors.white] : variant === "soft" ? [colors.emeraldTint, colors.emeraldDark] : variant === "danger" ? [colors.dangerTint, colors.danger] : variant === "outline" ? [colors.surface, colors.ink] : ["transparent", colors.ink];
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={(event) => { event.stopPropagation(); onPress(); }} style={({ pressed }) => [styles.button, { backgroundColor: palette[0], borderColor: variant === "outline" ? colors.border : palette[0], paddingVertical: small ? 8 : 12, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 }]}>
    {icon ? <Ionicons name={icon} size={16} color={palette[1]} /> : null}<Text style={[styles.buttonText, { color: palette[1], fontSize: small ? 12 : 14 }]}>{title}</Text>
  </Pressable>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  useThemeContext();
  return <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>{title}</Text>{action && onAction ? <Pressable accessibilityRole="button" onPress={onAction}><Text style={styles.link}>{action}</Text></Pressable> : null}</View>;
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  useThemeContext();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>{icon ? <Ionicons name={icon} size={14} color={selected ? colors.emeraldDark : colors.muted} /> : null}<Text style={[styles.chipText, selected && { color: colors.emeraldDark, fontWeight: "700" }]}>{label}</Text></Pressable>;
}

export function Avatar({ name, image, size = 42, ring = false }: { name: string; image?: string; size?: number; ring?: boolean }) {
  const { settings } = useAppStore();
  useThemeContext();
  const initials = (name ?? "").split(" ").slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const validImage = Boolean(image && /^(https?:|file:|content:|data:|asset:|\/seed-images\/)/i.test(image));
  const imageUsable = validImage && !settings.reducedData && (Platform.OS === "web" || !image?.startsWith("/seed-images/"));
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ring ? colors.orangeTint : colors.emeraldTint, borderWidth: ring ? 2 : 0, borderColor: colors.orange, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    {imageUsable ? <Image source={{ uri: image }} style={{ width: size, height: size }} contentFit="cover" /> : <Text style={{ color: colors.emeraldDark, fontWeight: "800", fontSize: size * 0.31 }}>{initials}</Text>}
  </View>;
}

const NATIVE_BUSINESS_MEDIA = {
  "/seed-images/image-2.webp": require("../assets/images/sample-businesses/fashion.webp"),
  "/seed-images/image-3.webp": require("../assets/images/sample-businesses/coast.webp"),
  "/seed-images/image-4.webp": require("../assets/images/sample-businesses/furniture.webp"),
  "/seed-images/image-5.webp": require("../assets/images/sample-businesses/skincare.webp"),
} as const;

export function MediaImage({ uri, height = 180, label }: { uri?: string; height?: number; label?: string }) {
  const { settings } = useAppStore();
  const validImage = Boolean(uri && /^(https?:|file:|content:|data:|asset:|\/seed-images\/)/i.test(uri));
  useThemeContext();
  const nativeSource = Platform.OS !== "web" && uri && uri in NATIVE_BUSINESS_MEDIA ? NATIVE_BUSINESS_MEDIA[uri as keyof typeof NATIVE_BUSINESS_MEDIA] : undefined;
  const imageUsable = validImage && !settings.reducedData && (Platform.OS === "web" || !uri?.startsWith("/seed-images/") || Boolean(nativeSource));
  return <View style={{ height, borderRadius: radius.md, backgroundColor: colors.emeraldTint, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
    {imageUsable ? <Image source={nativeSource ?? { uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={180} cachePolicy="memory-disk" accessibilityLabel={label} /> : <><View style={styles.imageOrnament} /><Ionicons name="leaf-outline" size={31} color={colors.emeraldDark} /><Text style={styles.imageFallback}>{label ?? "Local business"}</Text></>}
  </View>;
}


export function VideoPreview({ uri, height = 190 }: { uri: string; height?: number }) {
  useThemeContext();
  const player = useVideoPlayer(uri, (instance) => { instance.loop = false; instance.pause(); });
  return <View style={{ height, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.navy }}><VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls /></View>;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  useThemeContext();
  return verified ? <View style={styles.verified}><Ionicons name="checkmark-circle" size={14} color={colors.emerald} /><Text style={styles.verifiedText}>Verified</Text></View> : null;
}

export function BusinessCard({ business, horizontal = false }: { business: Business; horizontal?: boolean }) {
  const store = useAppStore();
  const requireAuth = useRequireAuth();
  useThemeContext();
  const isFollowing = store.followedBusinesses.includes(business.id);
  return <View style={[styles.card, horizontal ? { width: 270, marginRight: 12 } : null]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${business.name} business profile`} onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })}>
      <MediaImage uri={business.cover} height={horizontal ? 128 : 156} label={`${business.category} in ${business.town}`} />
      <View style={{ padding: 14, paddingBottom: 8, gap: 8 }}>
        <View style={styles.row}><Avatar name={business.name} size={34} /><View style={{ flex: 1 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}><Text style={styles.cardTitle}>{business.name}</Text><VerifiedBadge verified={business.verified} /></View><Text style={styles.caption}>{business.category} · {business.town}</Text></View></View>
        <Text style={styles.body} numberOfLines={2}>{business.description}</Text>
      </View>
    </Pressable>
    <View style={[styles.rowBetween, { paddingHorizontal: 14, paddingBottom: 14, gap: 8 }]}>
      <Text style={styles.caption}>★ {business.rating.toFixed(1)} · {business.followers.toLocaleString()} followers</Text>
      <Button title={isFollowing ? "Following" : "Follow"} small variant={isFollowing ? "soft" : "outline"} onPress={() => requireAuth(() => store.toggleBusinessFollow(business.id))} />
    </View>
  </View>;
}

export function PostCard({ post }: { post: Post }) {
  const store = useAppStore();
  const now = useClock();
  const requireAuth = useRequireAuth();
  useThemeContext();
  const biz = store.businesses.find((b) => b.id === post.identityId);
  const person = post.identityKind === "business" ? undefined : (post.authorId === store.user.id ? store.user : PEOPLE.find((item) => item.id === post.authorId));
  const name = biz?.name ?? person?.name ?? "Mabiz member";
  const liked = store.likedPosts.includes(post.id);
  const saved = store.savedPosts.includes(post.id);
  const poll = post.poll;
  const myPollVote = poll?.votes.find((vote) => vote.userId === store.user.id);
  const pollRespondents = poll?.votes.length ?? 0;
  const pollSelections = poll?.votes.reduce((total, vote) => total + vote.optionIds.length, 0) ?? 0;
  const pollDenominator = poll?.multipleChoice ? pollSelections : pollRespondents;
  const pollEnded = Boolean(poll && now > 0 && new Date(poll.endsAt).getTime() <= now);
  const onShare = async () => { try { await Share.share({ message: `${post.caption}\n\nShared from Mabiz` }); } catch {} };
  return <View style={styles.card}>
    <View style={[styles.row, { padding: 14, paddingBottom: 10 }]}><Avatar name={name} image={biz?.logo ?? person?.avatar} size={42} /><View style={{ flex: 1 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}><Text style={styles.cardTitle}>{name}</Text><VerifiedBadge verified={biz?.verified ?? false} /></View><Text style={styles.caption}>{person ? `@${person.username} · ` : ""}{post.location} · {new Intl.DateTimeFormat("en-KE", { hour: "numeric", minute: "2-digit" }).format(new Date(post.createdAt))}</Text></View>{biz ? <Button title={store.followedBusinesses.includes(biz.id) ? "Following" : "Follow"} small variant={store.followedBusinesses.includes(biz.id) ? "soft" : "outline"} onPress={() => requireAuth(() => store.toggleBusinessFollow(biz.id))} /> : null}<Pressable accessibilityLabel="More post actions" onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}><Ionicons name="ellipsis-horizontal" color={colors.muted} size={21} /></Pressable></View>
    <Text style={[styles.body, { paddingHorizontal: 14, paddingBottom: post.media ? 12 : 4, lineHeight: 21 }]}>{post.caption}</Text>
    {(post.mediaItems?.length || post.media) ? <View style={{ gap: 2 }}>{(post.mediaItems?.length ? post.mediaItems : [post.media!]).map((uri, index) => post.kind === "video" || post.video ? <VideoPreview key={`${uri}-${index}`} uri={uri} height={230} /> : <Pressable key={`${uri}-${index}`} accessibilityRole="image" accessibilityLabel={`${name} · photo ${index + 1}`} onPress={() => post.businessId && router.push({ pathname: "/business/[id]", params: { id: post.businessId } })}><MediaImage uri={uri} height={230} label={`${name} · photo ${index + 1}`} /></Pressable>)}</View> : null}
    {poll ? <View style={{ marginHorizontal: 14, marginTop: 10, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 15, gap: 8 }}><Text style={styles.cardTitle}>{poll.question}</Text>{poll.options.map((option) => { const count = poll.votes.filter((vote) => vote.optionIds.includes(option.id)).length; const selected = myPollVote?.optionIds.includes(option.id) ?? false; const percent = pollDenominator ? Math.round((count / pollDenominator) * 100) : 0; const canVote = !pollEnded && (!myPollVote || poll.multipleChoice); return <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={`${option.text}, ${percent}%`} accessibilityState={{ selected, disabled: !canVote }} disabled={!canVote} onPress={() => requireAuth(() => store.votePoll(post.id, option.id))} style={{ minHeight: 40, borderRadius: 11, borderWidth: 1, borderColor: selected ? colors.emerald : colors.border, overflow: "hidden", justifyContent: "center", paddingHorizontal: 10 }}><View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${percent}%`, backgroundColor: selected ? colors.emeraldTint : colors.subtle }} /><View style={[styles.rowBetween, { zIndex: 1 }]}><Text style={[styles.body, selected ? { fontWeight: "800" } : null]}>{option.text}</Text><Text style={styles.caption}>{pollDenominator ? `${percent}% · ${count}` : "Vote"}</Text></View></Pressable>; })}<Text style={styles.caption}>{pollRespondents} {pollRespondents === 1 ? "respondent" : "respondents"}{poll.multipleChoice ? ` · ${pollSelections} selections` : ""} · {pollEnded ? "Poll closed" : `Ends ${new Date(poll.endsAt).toLocaleDateString("en-KE")}`} · votes stored on this device</Text></View> : null}
    {post.businessTags?.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 14, paddingTop: 7 }}>{post.businessTags.map((id) => { const tagged = store.businesses.find((business) => business.id === id); return tagged ? <Pressable key={id} accessibilityRole="link" onPress={() => router.push({ pathname: "/business/[id]", params: { id } })}><Text style={{ color: colors.emeraldDark, fontWeight: "700", fontSize: 12 }}>@{tagged.name}</Text></Pressable> : null; })}</View> : null}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 14, paddingTop: 8 }}>{post.hashtags.map((tag) => <Text key={tag} style={{ color: colors.emerald, fontWeight: "700", fontSize: 12 }}>#{tag}</Text>)}</View>
    {post.productId ? (() => { const product = store.businesses.flatMap((business) => business.products).find((item) => item.id === post.productId); return product ? <ProductCard product={product} /> : null; })() : null}
    {(post.kind === "video" || post.video) ? <Button title="Watch in business videos" icon="play-outline" variant="soft" small onPress={() => router.push("/videos")} /> : null}
    <View style={[styles.rowBetween, { paddingHorizontal: 14, paddingVertical: 13, flexWrap: "wrap" }]}>
      {biz ? <Button title="Contact" icon="chatbubble-outline" variant="outline" small onPress={() => requireAuth(() => { if (store.settings.messagePermissions === "nobody" || (store.settings.messagePermissions === "following" && !store.followedBusinesses.includes(biz.id)) || store.blockedUsers.includes(biz.ownerId)) { router.push("/menu/privacy/profile-privacy"); return; } const id = store.startConversation(biz.ownerId, biz.founder, biz.id); if (!id) return; router.push({ pathname: "/messages/[id]", params: { id } }); })} /> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Unlike post" : "Like post"} onPress={() => requireAuth(() => store.toggleLike(post.id))} style={styles.action}><Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? colors.orange : colors.ink} /><Text style={styles.actionText}>{post.likes + (liked ? 1 : 0)}</Text></Pressable>
      {post.allowComments !== false ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })} style={styles.action}><Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.ink} /><Text style={styles.actionText}>{post.comments.length || "Comment"}</Text></Pressable> : <Text style={styles.caption}>Comments off</Text>}
      {post.allowSharing !== false ? <Pressable accessibilityRole="button" onPress={() => void onShare()} style={styles.action}><Ionicons name="share-social-outline" size={19} color={colors.ink} /><Text style={styles.actionText}>Share</Text></Pressable> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={saved ? "Unsave post" : "Save post"} onPress={() => requireAuth(() => store.togglePostSave(post.id))}><Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? colors.emerald : colors.ink} /></Pressable>
    </View>
  </View>;
}

export function ProductCard({ product }: { product: Product }) {
  useThemeContext();
  const business = useAppStore().businesses.find((b) => b.id === product.businessId);
  return <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })} style={styles.productCard}>
    <MediaImage uri={product.image} height={125} label={product.category} />
    <View style={{ padding: 11, gap: 4 }}><Text numberOfLines={1} style={styles.cardTitle}>{product.name}</Text><Text numberOfLines={1} style={styles.caption}>{business?.name ?? "Local business"} · {product.location}</Text><Text style={[styles.cardTitle, { color: colors.emeraldDark }]}>{formatKes(product.price)}</Text></View>
  </Pressable>;
}

type SkeletonVariant = "feed" | "cards" | "stories" | "rows";

function SkeletonBlock({ width = "100%", height = 12, radius = 8 }: { width?: ViewStyle["width"]; height?: number; radius?: number }) {
  return <View accessible={false} style={{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity: 0.78 }} />;
}

export function ScreenSkeleton({ variant = "feed", count = 2, label = "Loading content" }: { variant?: SkeletonVariant; count?: number; label?: string }) {
  useThemeContext();
  const rows = Array.from({ length: Math.max(1, Math.min(4, Math.floor(count))) }, (_, index) => index);

  if (variant === "stories") return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={{ flexDirection: "row", gap: 13, paddingVertical: 4 }}>
    {rows.map((index) => <View key={index} style={{ alignItems: "center", gap: 7 }}><SkeletonBlock width={58} height={58} radius={29} /><SkeletonBlock width={48} height={9} /></View>)}
  </View>;

  if (variant === "rows") return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={{ gap: 10 }}>
    {rows.map((index) => <View key={index} style={styles.actionTile}><SkeletonBlock width={42} height={42} radius={21} /><View style={{ flex: 1, gap: 7 }}><SkeletonBlock width="56%" height={12} /><SkeletonBlock width="82%" height={10} /></View><SkeletonBlock width={10} height={10} radius={5} /></View>)}
  </View>;

  if (variant === "cards") return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={{ gap: 2 }}>
    {rows.map((index) => <View key={index} style={styles.card}><SkeletonBlock height={150} radius={0} /><View style={{ padding: 14, gap: 9 }}><SkeletonBlock width="58%" height={13} /><SkeletonBlock width="88%" height={10} /><SkeletonBlock width="72%" height={10} /><SkeletonBlock width={92} height={28} radius={18} /></View></View>)}
  </View>;

  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={{ gap: 2 }}>
    {rows.map((index) => <View key={index} style={styles.card}>
      <View style={[styles.row, { padding: 14, paddingBottom: 11 }]}><SkeletonBlock width={42} height={42} radius={21} /><View style={{ flex: 1, gap: 7 }}><SkeletonBlock width="48%" height={12} /><SkeletonBlock width="72%" height={10} /></View></View>
      <View style={{ paddingHorizontal: 14, paddingBottom: 12, gap: 8 }}><SkeletonBlock width="96%" height={10} /><SkeletonBlock width="74%" height={10} /></View>
      <SkeletonBlock height={205} radius={0} />
      <View style={[styles.rowBetween, { paddingHorizontal: 14, paddingVertical: 13 }]}><SkeletonBlock width={58} height={26} radius={16} /><SkeletonBlock width={36} height={11} /><SkeletonBlock width={40} height={11} /><SkeletonBlock width={24} height={15} /></View>
    </View>)}
  </View>;
}

export function EmptyState({ title, detail, icon = "sparkles-outline", action, onAction }: { title: string; detail: string; icon?: keyof typeof Ionicons.glyphMap; action?: string; onAction?: () => void }) {
  useThemeContext();
  return <View style={styles.empty} accessibilityLiveRegion="polite"><View style={styles.emptyIcon}><Ionicons name={icon} size={25} color={colors.emeraldDark} /></View><Text style={styles.cardTitle}>{title}</Text><Text style={[styles.body, { textAlign: "center", color: colors.muted }]}>{detail}</Text>{action && onAction ? <Button title={action} onPress={onAction} variant="soft" small /> : null}</View>;
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, secureTextEntry, right }: TextInputProps & { label: string; right?: ReactNode }) {
  useThemeContext();
  return <View style={{ gap: 6 }}><Text style={styles.label}>{label}</Text><View style={[styles.inputWrap, multiline ? { alignItems: "flex-start" } : null]}><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} keyboardType={keyboardType} secureTextEntry={secureTextEntry} style={[styles.input, multiline ? { minHeight: 88, textAlignVertical: "top" } : null]} accessibilityLabel={label} />{right}</View></View>;
}

export function Stat({ value, label }: { value: string | number; label: string }) { useThemeContext(); return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.caption}>{label}</Text></View>; }
export function LocalNote({ text }: { text?: string }) { useThemeContext(); return <View style={styles.localNote}><Ionicons name="phone-portrait-outline" size={14} color={colors.navySoft} /><Text style={styles.localNoteText}>{text ?? "Demo mode · saved on this device only"}</Text></View>; }
export function Divider() { useThemeContext(); return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 7 }} />; }
export function ActionTile({ title, detail, icon, onPress }: { title: string; detail?: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) { useThemeContext(); return <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionTile}><View style={styles.tileIcon}><Ionicons name={icon} size={19} color={colors.emeraldDark} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{title}</Text>{detail ? <Text style={styles.caption}>{detail}</Text> : null}</View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>; }
export function LoadingState({ label = "Loading" }: { label?: string }) { useThemeContext(); return <View style={styles.loading}><ActivityIndicator color={colors.emerald} /><Text style={styles.caption}>{label}…</Text></View>; }

export function ConfirmModal({ visible, title, detail, confirmLabel = "Confirm", onCancel, onConfirm, destructive = false }: { visible: boolean; title: string; detail: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void; destructive?: boolean }) {
  useThemeContext();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.sectionHeading}>{title}</Text><Text style={styles.body}>{detail}</Text><View style={[styles.row, { justifyContent: "flex-end", marginTop: 10 }]}><Button title="Cancel" variant="quiet" onPress={onCancel} small /><Button title={confirmLabel} variant={destructive ? "danger" : "primary"} onPress={onConfirm} small /></View></View></View></Modal>;
}

export const styles = createThemedStyles(() => StyleSheet.create({
  page: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 34, gap: 16 },
  topbar: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  brandMark: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.emeraldFill },
    backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.subtle, alignItems: "center", justifyContent: "center" },
  topTitle: { color: colors.ink, fontWeight: "800", fontSize: 19, letterSpacing: -0.2 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  sectionTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  sectionHeading: { fontSize: 18, fontWeight: "800", color: colors.ink, letterSpacing: -0.25 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  link: { color: colors.emeraldDark, fontSize: 13, fontWeight: "700" },
  iconButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", position: "relative" },
  dot: { position: "absolute", width: 7, height: 7, borderRadius: 4, right: 7, top: 7, backgroundColor: colors.orange },
  button: { minHeight: 35, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  buttonText: { fontWeight: "700" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 5 },
  chipSelected: { backgroundColor: colors.emeraldTint, borderColor: colors.emeraldDark },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  imageOrnament: { position: "absolute", right: -25, top: -38, width: 120, height: 120, borderRadius: 80, backgroundColor: colors.emeraldTint },
  imageFallback: { color: colors.emeraldDark, fontSize: 12, fontWeight: "700", marginTop: 7 },
  verified: { flexDirection: "row", alignItems: "center", gap: 2 },
  verifiedText: { color: colors.emeraldDark, fontSize: 10, fontWeight: "800" },
  action: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 30 },
  actionText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  productCard: { width: 168, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  empty: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 23, alignItems: "center", gap: 9 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.emeraldTint, alignItems: "center", justifyContent: "center" },
  label: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  inputWrap: { minHeight: 46, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  input: { flex: 1, color: colors.ink, paddingVertical: 11, fontSize: 14 },
  stat: { alignItems: "center", minWidth: 60, gap: 3 },
  statValue: { fontSize: 17, fontWeight: "800", color: colors.ink },
  localNote: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.subtle },
  localNoteText: { color: colors.navySoft, fontSize: 11, flexShrink: 1 },
  offlineNote: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.orangeTint, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 },
  offlineText: { color: colors.warning, fontSize: 11, fontWeight: "700", flex: 1 },
  actionTile: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 13, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  themeOption: { flex: 1, minHeight: 44, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  tileIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.emeraldTint, alignItems: "center", justifyContent: "center" },
  loading: { alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 22 },
  modalCard: { width: "100%", maxWidth: 420, borderRadius: radius.lg, backgroundColor: colors.surface, padding: 20, gap: 12 },
}));
