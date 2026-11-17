
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  IconButton,
  MediaImage,
  Page,
  ProductCard,
  SectionTitle,
  Stat,
  TopBar,
  VerifiedBadge,
  styles,
} from "@/components/biz-ui";
import { PEOPLE, STORIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  useMabizServices,
  useMabizServiceMode,
} from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { hasBusinessRole } from "@/utils/business-permissions";
import { filterVisiblePosts } from "@/utils/privacy-policy";
import { ApiBusinessProfile } from "@/components/api-social-screens";

const TABS = [
  "Overview",
  "Posts",
  "Videos",
  "Products",
  "Services",
  "Our Story",
] as const;

type ProfileTab = (typeof TABS)[number];

function ProfileDivider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
      }}
    />
  );
}

function ProfileHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {subtitle ? (
        <Text style={styles.caption}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function ProfileAction({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 76,
        borderRadius: 15,
        backgroundColor: active ? colors.emeraldTint : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.emerald : colors.border,
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingVertical: 10,
        paddingHorizontal: 5,
      }}
    >
      <Ionicons
        name={icon}
        size={21}
        color={active ? colors.emeraldDark : colors.ink}
      />
      <Text
        style={{
          color: active ? colors.emeraldDark : colors.ink,
          fontSize: 11,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const apiMode = useMabizServiceMode() === "api";

  return apiMode ? (
    <ApiBusinessProfile businessId={id ?? ""} />
  ) : (
    <MockBusinessProfileScreen />
  );
}

function MockBusinessProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useAppStore();
  const services = useMabizServices();
  const apiMode = useMabizServiceMode() === "api";
  const requireAuth = useRequireAuth();

  const [remoteBusiness, setRemoteBusiness] = useState<
    typeof app.businesses[number] | undefined
  >();

  const [apiLoading, setApiLoading] = useState(apiMode);
  const [apiError, setApiError] = useState("");
  const [tab, setTab] = useState<ProfileTab>("Overview");

  const business = apiMode
    ? remoteBusiness
    : app.businesses.find((item) => item.id === id);

  const businessId = business?.id;
  const { recordBusinessView } = app;
  const upsertApiBusiness = app.upsertApiBusiness;

  useEffect(() => {
    if (!apiMode || !id) return;

    let active = true;

    setApiLoading(true);
    setApiError("");
    setRemoteBusiness(undefined);

    void services.businesses.get(id).then((result) => {
      if (!active) return;

      if (result.ok) {
        const mapped =
          app.isAuthenticated && result.data.currentUserRole
            ? {
                ...result.data,
                team: [
                  {
                    userId: app.user.id,
                    role: result.data.currentUserRole,
                    joinedAt: result.data.joinedAt,
                    displayName: app.user.name,
                    email: app.user.email ?? "",
                  },
                ],
              }
            : result.data;

        setRemoteBusiness(mapped);

        if (app.isAuthenticated) {
          upsertApiBusiness(mapped);
        }
      } else {
        setApiError(result.error.message);
      }

      setApiLoading(false);
    });

    return () => {
      active = false;
    };
  }, [
    apiMode,
    id,
    services,
    app.isAuthenticated,
    app.user.id,
    app.user.name,
    app.user.email,
    upsertApiBusiness,
  ]);

  useEffect(() => {
    if (!apiMode && businessId) {
      recordBusinessView(businessId);
    }
  }, [apiMode, businessId, recordBusinessView]);

  const posts = useMemo(
    () =>
      apiMode
        ? []
        : filterVisiblePosts(app.posts, {
            viewerId: app.user.id,
            people: [
              ...PEOPLE.filter((person) => person.id !== app.user.id),
              app.user,
            ],
            businesses: app.businesses,
            blockedUserIds: app.blockedUsers,
            hiddenPostIds: app.hiddenPosts,
            followedPeople: app.followedPeople,
          }).filter((post) => post.businessId === business?.id),
    [
      apiMode,
      app.posts,
      app.user,
      app.businesses,
      app.blockedUsers,
      app.hiddenPosts,
      app.followedPeople,
      business?.id,
    ],
  );

  if (apiMode && apiLoading) {
    return (
      <Page>
        <TopBar title="Business profile" back />
        <View style={{ padding: 20, gap: 12 }}>
          <View
            style={{
              height: 190,
              borderRadius: 18,
              backgroundColor: colors.surface,
            }}
          />
          <Text style={styles.body}>
            Loading business profile from Mabiz...
          </Text>
        </View>
      </Page>
    );
  }

  if (
    !business ||
    (!apiMode && app.blockedUsers.includes(business.ownerId))
  ) {
    return (
      <Page>
        <TopBar title="Business profile" back />
        <View style={{ padding: 20, gap: 16 }}>
          <EmptyState
            title="Business unavailable"
            detail={apiError || "This business is currently unavailable."}
            icon="business-outline"
          />
          <Button
            title="Back to Discover"
            onPress={() => router.replace("/(tabs)/discover")}
          />
        </View>
      </Page>
    );
  }

  const founder = PEOPLE.find((p) => p.id === business.founderId);
  const story = STORIES.find((s) => s.businessId === business.id);

  const following = app.followedBusinesses.includes(business.id);
  const saved = app.savedBusinesses.includes(business.id);

  const activeProducts = business.products.filter(
    (product) => !product.archived,
  );

  const activeServices = business.services.filter(
    (service) => !service.archived,
  );

  const offeringCount = activeProducts.length + activeServices.length;

  const share = async () => {
    try {
      await Share.share({
        message: `Explore ${business.name} on Mabiz — ${business.description}`,
      });
    } catch {}
  };

  const startMessage = () => {
    if (!app.isAuthenticated) {
      return router.push("/auth/login");
    }

    if (
      app.settings.messagePermissions === "nobody" ||
      (app.settings.messagePermissions === "following" &&
        !app.followedBusinesses.includes(business.id))
    ) {
      const message =
        "Your message-permission settings do not allow this enquiry.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Messaging limited", message);
      }

      return;
    }

    if (app.blockedUsers.includes(business.ownerId)) {
      const message = "You have blocked this business owner.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Messaging unavailable", message);
      }

      return;
    }

    const conversationId = app.startConversation(
      business.ownerId,
      business.founder,
      business.id,
    );

    if (!conversationId) return;

    router.push({
      pathname: "/messages/[id]",
      params: { id: conversationId },
    });
  };

  const renderBody = () => {
    if (tab === "Products") {
      return activeProducts.length ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {activeProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No products listed yet"
          detail="New catalogue products from this business will appear here."
          icon="pricetag-outline"
        />
      );
    }

    if (tab === "Services") {
      return activeServices.length ? (
        <View style={{ gap: 12 }}>
          {activeServices.map((service) => (
            <View
              key={service.id}
              style={[
                styles.card,
                {
                  padding: 16,
                  gap: 11,
                  borderRadius: 17,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{service.name}</Text>
                <Ionicons
                  name="briefcase-outline"
                  color={colors.emerald}
                  size={21}
                />
              </View>

              <Text style={styles.body}>{service.description}</Text>

              <ProfileDivider />

              <View style={styles.rowBetween}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      color: colors.emeraldDark,
                      fontWeight: "800",
                    }}
                  >
                    {service.priceLabel}
                  </Text>
                  <Text style={styles.caption}>{service.location}</Text>
                </View>

                <Button
                  title="Enquire"
                  variant="soft"
                  small
                  onPress={startMessage}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          title="No services listed yet"
          detail="New services from this business will appear here."
          icon="briefcase-outline"
        />
      );
    }

    if (tab === "Posts" || tab === "Videos") {
      const selected = posts.filter((post) =>
        tab === "Videos"
          ? post.kind === "video" || post.video
          : post.kind !== "video" && !post.video,
      );

      return selected.length ? (
        <View style={{ gap: 14 }}>
          {selected.map((post) => (
            <Pressable
              key={post.id}
              style={[
                styles.card,
                { overflow: "hidden", borderRadius: 17 },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/post/[id]",
                  params: { id: post.id },
                })
              }
            >
              <MediaImage
                uri={post.media}
                height={205}
                label={business.name}
              />

              <View style={{ padding: 15, gap: 10 }}>
                <Text style={styles.body}>{post.caption}</Text>

                {post.kind === "video" || post.video ? (
                  <Button
                    title="Watch in video discovery"
                    icon="play-outline"
                    variant="soft"
                    small
                    onPress={() => router.push("/videos")}
                  />
                ) : null}

                <View style={styles.rowBetween}>
                  <View style={styles.row}>
                    <Ionicons
                      name="heart-outline"
                      size={15}
                      color={colors.muted}
                    />
                    <Text style={styles.caption}>
                      {post.likes} likes
                    </Text>
                  </View>

                  <Text style={styles.caption}>
                    {post.comments.length} comments
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          title={`No ${tab.toLowerCase()} yet`}
          detail="New content shared by this business will appear here."
          icon={
            tab === "Videos"
              ? "videocam-outline"
              : "albums-outline"
          }
        />
      );
    }

    if (tab === "Our Story") {
      return (
        <View
          style={[
            styles.card,
            { padding: 18, gap: 14, borderRadius: 18 },
          ]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.emeraldTint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="book-outline"
              size={23}
              color={colors.emeraldDark}
            />
          </View>

          <SectionTitle title="How it started" />

          <Text style={styles.body}>{business.originStory}</Text>

          <ProfileDivider />

          <Text style={styles.caption}>
            Founded by {business.founder} · {business.town},{" "}
            {business.county}
          </Text>

          {story ? (
            <Button
              title={`Read founder story · ${story.durationMinutes} min`}
              variant="soft"
              icon="book-outline"
              onPress={() =>
                router.push({
                  pathname: "/story/[id]",
                  params: { id: story.id },
                })
              }
            />
          ) : null}
        </View>
      );
    }

    return (
      <View style={{ gap: 20 }}>
        <View
          style={[
            styles.card,
            { padding: 17, gap: 13, borderRadius: 18 },
          ]}
        >
          <ProfileHeading
            title="About this business"
            subtitle="Get to know what makes this business different."
          />

          <Text style={styles.body}>{business.about}</Text>

          <ProfileDivider />

          <View style={{ gap: 10 }}>
            {[
              {
                icon: "person-outline" as const,
                label: "Founder",
                value: business.founder,
              },
              {
                icon: "time-outline" as const,
                label: "Operating hours",
                value: business.operatingHours,
              },
              {
                icon: "location-outline" as const,
                label: "Service areas",
                value: business.serviceAreas.join(", "),
              },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={colors.emerald}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.caption}>{item.label}</Text>
                  <Text style={styles.body}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {business.email ||
          business.phone ||
          business.website ||
          Object.keys(business.socialLinks ?? {}).length ? (
            <>
              <ProfileDivider />

              <Text style={styles.cardTitle}>Contact information</Text>

              {business.email ? (
                <View style={styles.row}>
                  <Ionicons
                    name="mail-outline"
                    size={17}
                    color={colors.muted}
                  />
                  <Text style={styles.caption}>{business.email}</Text>
                </View>
              ) : null}

              {business.phone ? (
                <View style={styles.row}>
                  <Ionicons
                    name="call-outline"
                    size={17}
                    color={colors.muted}
                  />
                  <Text style={styles.caption}>{business.phone}</Text>
                </View>
              ) : null}

              {business.website ? (
                <View style={styles.row}>
                  <Ionicons
                    name="globe-outline"
                    size={17}
                    color={colors.muted}
                  />
                  <Text style={styles.caption}>{business.website}</Text>
                </View>
              ) : null}

              {Object.entries(business.socialLinks ?? {}).map(
                ([network, url]) => (
                  <View key={network} style={styles.row}>
                    <Ionicons
                      name="share-social-outline"
                      size={17}
                      color={colors.muted}
                    />
                    <Text style={styles.caption}>
                      {network} · {url}
                    </Text>
                  </View>
                ),
              )}
            </>
          ) : null}

          <ProfileDivider />

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 7,
            }}
          >
            <Chip label={business.category} />
            <Chip label={business.subcategory} />
            <Chip label={business.priceRange} />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <SectionTitle
            title="Products & services"
            action="View all"
            onAction={() => setTab("Products")}
          />

          {activeProducts.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {activeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ScrollView>
          ) : null}

          {activeServices.slice(0, 3).map((service) => (
            <View
              key={service.id}
              style={[
                styles.card,
                {
                  padding: 14,
                  borderRadius: 15,
                  gap: 6,
                },
              ]}
            >
              <Text style={styles.cardTitle}>{service.name}</Text>
              <Text style={styles.caption}>
                {service.priceLabel} · {service.location}
              </Text>
            </View>
          ))}

          {!offeringCount ? (
            <EmptyState
              title="No offerings listed yet"
              detail="This business can add products and services to its catalogue."
              icon="cube-outline"
            />
          ) : null}
        </View>

        <View style={{ gap: 12 }}>
          <SectionTitle
            title="Business journey"
            action="View milestones"
            onAction={() =>
              router.push({
                pathname: "/milestones",
                params: { businessId: business.id },
              })
            }
          />

          {business.milestones.slice(0, 2).map((milestone) => (
            <View
              key={milestone.id}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                paddingVertical: 5,
              }}
            >
              <View
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  backgroundColor: colors.orange,
                  marginTop: 5,
                }}
              />

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>
                  {milestone.title}
                </Text>
                <Text style={styles.caption}>
                  {milestone.date} · {milestone.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/story/[id]",
              params: { id: story?.id ?? "" },
            })
          }
          style={[
            styles.card,
            {
              padding: 17,
              gap: 10,
              borderRadius: 18,
            },
          ]}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Our story</Text>
            <Ionicons
              name="arrow-forward"
              color={colors.emerald}
              size={19}
            />
          </View>

          <Text style={styles.body}>{business.originStory}</Text>

          {story ? (
            <Text style={styles.link}>Meet the founder →</Text>
          ) : null}
        </Pressable>

        <View
          style={[
            styles.card,
            { padding: 17, gap: 12, borderRadius: 18 },
          ]}
        >
          <ProfileHeading
            title="Location & service area"
            subtitle="Where customers can find this business."
          />

          <View style={styles.row}>
            <Ionicons
              name="location-outline"
              color={colors.emerald}
              size={19}
            />
            <Text style={styles.body}>
              {business.neighbourhood}, {business.town},{" "}
              {business.county}
            </Text>
          </View>

          <View
            style={{
              minHeight: 100,
              borderRadius: 15,
              backgroundColor: colors.emeraldTint,
              alignItems: "center",
              justifyContent: "center",
              padding: 15,
              gap: 8,
            }}
          >
            <Ionicons
              name="map-outline"
              color={colors.emeraldDark}
              size={27}
            />

            <Text style={styles.caption}>
              {business.serviceAreas.join(" · ")}
            </Text>
          </View>

          <Text style={styles.caption}>
            Public business area · no personal precise location displayed
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Page>
      <TopBar
        title="Business profile"
        back
        right={
          <IconButton
            name="share-social-outline"
            label="Share business"
            onPress={() => void share()}
          />
        }
      />

      <View style={{ gap: 0 }}>
        <View style={{ position: "relative" }}>
          <MediaImage
            uri={business.cover}
            height={205}
            label={`${business.category} profile cover`}
          />

          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 75,
              backgroundColor: "rgba(0,0,0,0.20)",
            }}
          />
        </View>

        <View
          style={{
            paddingHorizontal: 14,
            marginTop: -43,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <View
            style={{
              padding: 4,
              backgroundColor: colors.canvas,
              borderRadius: 22,
            }}
          >
            <Avatar name={business.name} size={82} />
          </View>

          <View style={{ flex: 1, paddingBottom: 8 }}>
            <Text style={styles.caption}>
              {business.category} business
            </Text>
          </View>

          {!apiMode ? (
            <Button
              title={following ? "Following" : "Follow"}
              icon={following ? "checkmark" : "add"}
              variant={following ? "soft" : "primary"}
              small
              onPress={() =>
                requireAuth(() =>
                  app.toggleBusinessFollow(business.id),
                )
              }
            />
          ) : null}
        </View>
      </View>

      {apiMode && apiError ? (
        <Text style={styles.caption}>{apiError}</Text>
      ) : null}

      <View style={{ gap: 12, paddingTop: 12 }}>
        <View style={{ gap: 7 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={styles.sectionHeading}>
              {business.name}
            </Text>

            <VerifiedBadge verified={business.verified} />
          </View>

          <Text style={styles.caption}>
            {business.category} · {business.subcategory}
          </Text>

          <View style={styles.row}>
            <Ionicons
              name="location-outline"
              color={colors.muted}
              size={15}
            />
            <Text style={styles.caption}>
              {business.neighbourhood}, {business.town}
            </Text>
          </View>

          <Text style={styles.body}>{business.description}</Text>
        </View>

        <View
          style={[
            styles.card,
            {
              padding: 15,
              borderRadius: 17,
              gap: 13,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <Stat
              value={business.followers.toLocaleString()}
              label="Followers"
            />

            <View
              style={{
                width: 1,
                height: 36,
                backgroundColor: colors.border,
              }}
            />

            <Stat
              value={business.rating.toFixed(1)}
              label="Rating"
            />

            <View
              style={{
                width: 1,
                height: 36,
                backgroundColor: colors.border,
              }}
            />

            <Stat
              value={String(offeringCount)}
              label="Offerings"
            />
          </View>

          <ProfileDivider />

          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={colors.emerald}
              />
              <Text style={styles.caption}>Price range</Text>
            </View>

            <Text style={styles.cardTitle}>
              {business.priceRange}
            </Text>
          </View>
        </View>

        {!apiMode ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <ProfileAction
              icon="chatbubble-outline"
              label="Message"
              onPress={startMessage}
            />

            <ProfileAction
              icon="call-outline"
              label="Contact"
              onPress={startMessage}
            />

            <ProfileAction
              icon={saved ? "bookmark" : "bookmark-outline"}
              label={saved ? "Saved" : "Save"}
              active={saved}
              onPress={() =>
                requireAuth(() =>
                  app.toggleBusinessSave(business.id),
                )
              }
            />
          </View>
        ) : null}

        <View style={{ gap: 11 }}>
          <ProfileHeading
            title="Explore business"
            subtitle="Discover what this business has to offer."
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {TABS.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: tab === item }}
                onPress={() => setTab(item)}
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 11,
                  borderRadius: 24,
                  backgroundColor:
                    tab === item
                      ? colors.emerald
                      : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    tab === item
                      ? colors.emerald
                      : colors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      tab === item
                        ? "#FFFFFF"
                        : colors.ink,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ gap: 17, paddingTop: 4 }}>
          {renderBody()}
        </View>

        {app.isAuthenticated &&
        hasBusinessRole(business, app.user.id, [
          "Owner",
          "Administrator",
          "Content Manager",
          "Viewer",
        ]) ? (
          <Button
            title="Manage this business"
            variant="outline"
            icon="settings-outline"
            onPress={() => {
              app.switchIdentity(business.id);
              router.push("/business-management");
            }}
          />
        ) : null}

        <ProfileDivider />

        <View style={{ alignItems: "center", paddingVertical: 7 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/report/[target]",
                params: {
                  target: `business:${business.id}`,
                },
              })
            }
          >
            <Text style={styles.caption}>
              Report this business · Community guidelines
            </Text>
          </Pressable>
        </View>

        {founder ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/person/[id]",
                params: { id: founder.id },
              })
            }
            style={[
              styles.card,
              {
                padding: 13,
                flexDirection: "row",
                alignItems: "center",
                gap: 11,
                borderRadius: 15,
              },
            ]}
          >
            <Avatar name={founder.name} size={42} />

            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.cardTitle}>
                Meet the founder
              </Text>
              <Text style={styles.caption}>
                {founder.name} · @{founder.username}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </Page>
  );
}
