import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";
import type { Business } from "@/types/domain";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// SAMPLE DATA: no API fields exist yet for these sections. Replace with real data.
const SAMPLE = {
  owner: "Business owner",
  serves: "Countrywide",
  team: [
    { name: "Team member one", role: "Founder and CEO", since: 2014 },
    { name: "Team member two", role: "CTO", since: 2016 },
    { name: "Team member three", role: "Operations Lead", since: 2018 },
  ],
  opportunities: [
    {
      kind: "Supplier",
      title: "Supplier Opportunity",
      tag: "Electronics",
      detail: "Seeking trusted suppliers of quality products.",
      place: "Nairobi, Kenya",
      expires: "Expires Dec 20, 2026",
    },
    {
      kind: "Investment",
      title: "Investment Interest",
      tag: "Startup",
      detail: "Seeking angel investors for our solution.",
      place: "Nairobi, Kenya",
      expires: "Expires Dec 18, 2026",
    },
  ],
  contact: {
    phone: "+254 700 000 000",
    email: "info@example.com",
    website: "www.example.com",
  },
  story: {
    intro: "Our business started small and grew through word of mouth.",
    timeline: [
      { year: "2014", title: "Started", detail: "Our first client and our first team." },
      { year: "2017", title: "First office", detail: "Moved into our own space." },
      { year: "2020", title: "Growth", detail: "Expanded our services." },
    ],
  },
  faqs: [
    { q: "Do you offer support contracts?", a: "Yes, monthly plans are available." },
    { q: "Do you work outside Nairobi?", a: "Yes, remote support countrywide." },
  ],
};

function Header({
  icon,
  title,
  action,
  onAction,
}: {
  icon: IoniconName;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  useThemeContext();
  return (
    <View style={localStyles.headerRow}>
      <Ionicons name={icon} size={22} color={colors.emerald} />
      <Text style={localStyles.headerTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={localStyles.headerAction}>{action} {">"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function GlanceCell({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  useThemeContext();
  return (
    <View style={localStyles.glanceCell}>
      <View style={localStyles.glanceIcon}>
        <Ionicons name={icon} size={20} color={colors.emerald} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.caption}>{label}</Text>
        <Text style={localStyles.glanceValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ContactCell({
  icon,
  label,
  value,
  link,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  value: string;
  link?: boolean;
  onPress: () => void;
}) {
  useThemeContext();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={localStyles.contactCell}>
      <View style={localStyles.contactLabelRow}>
        <Ionicons name={icon} size={18} color={colors.emerald} />
        <Text style={styles.caption}>{label}</Text>
      </View>
      <Text
        numberOfLines={2}
        style={[localStyles.contactValue, link && { color: colors.navySoft }]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

export function OverviewSection({
  business,
  onSeeTeam,
  onSeeOffers,
}: {
  business: Business;
  onSeeTeam: () => void;
  onSeeOffers: () => void;
}) {
  useThemeContext();
  const joined = new Date(business.joinedAt).getFullYear();
  const teamSize = business.team ? business.team.length : 0;
  const offers = [
    ...business.services.map((item) => item.name),
    ...business.products.map((item) => item.name),
  ];
  const shownOffers = offers.slice(0, 3);
  const extraOffers = offers.length - shownOffers.length;
  const c = SAMPLE.contact;

  return (
    <>
      {business.description ? (
        <View style={localStyles.aboutCard}>
          <View style={localStyles.aboutHeader}>
            <Ionicons name="information-circle" size={24} color={colors.emerald} />
            <Text style={localStyles.headerTitle}>About</Text>
          </View>
          <Text style={styles.body}>{business.description}</Text>
        </View>
      ) : null}

      <View style={localStyles.section}>
        <Header icon="sparkles-outline" title="At a glance" />
        <View style={localStyles.glanceGrid}>
          {Number.isFinite(joined) ? (
            <GlanceCell icon="calendar-outline" label="Joined" value={String(joined)} />
          ) : null}
          <GlanceCell icon="people-outline" label="Team size" value={String(teamSize)} />
          <GlanceCell icon="person-outline" label="Owner" value={SAMPLE.owner} />
          <GlanceCell icon="location-outline" label="Serves" value={SAMPLE.serves} />
        </View>
      </View>

      {offers.length ? (
        <View style={localStyles.section}>
          <Header icon="diamond-outline" title="What we offer" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[localStyles.tagWrap, { flex: 1 }]}>
            {shownOffers.map((item, index) => (
              <View key={`${item}-${index}`} style={localStyles.tag}>
                <Text style={localStyles.tagText}>{item}</Text>
              </View>
            ))}
            {extraOffers > 0 ? (
              <View style={localStyles.tag}>
                <Text style={localStyles.tagText}>+{extraOffers}</Text>
              </View>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all offers"
            onPress={onSeeOffers}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
          </View>
        </View>
      ) : null}

      <View style={localStyles.section}>
        <Header icon="people" title="Our team" action="See all" onAction={onSeeTeam} />
        <View style={localStyles.teamPreviewRow}>
          {SAMPLE.team.map((member) => (
            <View key={member.name} style={localStyles.teamPreviewCell}>
              <Avatar name={member.name} size={74} />
              <Text style={localStyles.teamName} numberOfLines={1}>
                {member.name}
              </Text>
              <Text style={styles.caption} numberOfLines={1}>
                {member.role}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={localStyles.section}>
        <Header icon="call" title="Contact us" />
        <View style={localStyles.contactRow}>
          <ContactCell
            icon="call-outline"
            label="Call"
            value={c.phone}
            onPress={() => void Linking.openURL(`tel:${c.phone.replace(/\s/g, "")}`)}
          />
          <ContactCell
            icon="mail"
            label="Email"
            value={c.email}
            link
            onPress={() => void Linking.openURL(`mailto:${c.email}`)}
          />
          <ContactCell
            icon="globe-outline"
            label="Website"
            value={c.website}
            link
            onPress={() => void Linking.openURL(`https://${c.website}`)}
          />
        </View>
      </View>
    </>
  );
}

export function TeamSection() {
  useThemeContext();
  return (
    <View style={localStyles.section}>
      <Header icon="people" title="Our team" />
      {SAMPLE.team.map((member) => (
        <View key={member.name} style={localStyles.teamRow}>
          <Avatar name={member.name} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.cardTitle}>{member.name}</Text>
            <Text style={styles.caption}>{member.role}</Text>
            <Text style={styles.caption}>On the team since {member.since}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function OpportunitiesSection() {
  useThemeContext();
  return (
    <View style={localStyles.section}>
      <Header icon="briefcase-outline" title="Opportunities" />
      {SAMPLE.opportunities.map((item) => (
        <View key={item.title} style={localStyles.opportunity}>
          <View style={localStyles.tag}>
            <Text style={localStyles.tagText}>{item.kind}</Text>
          </View>
          <Text style={styles.cardTitle}>
            {item.title} - {item.tag}
          </Text>
          <Text style={styles.body}>{item.detail}</Text>
          <Text style={styles.caption}>{item.place}</Text>
          <Text style={styles.caption}>{item.expires}</Text>
          <View style={localStyles.outlineButton}>
            <Text style={localStyles.outlineButtonText}>View details</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function FaqSection() {
  useThemeContext();
  return (
    <View style={localStyles.section}>
      <Header icon="help-circle-outline" title="Good to know" />
      {SAMPLE.faqs.map((item) => (
        <View key={item.q} style={localStyles.faqItem}>
          <Text style={styles.cardTitle}>{item.q}</Text>
          <Text style={styles.body}>{item.a}</Text>
        </View>
      ))}
    </View>
  );
}

export function ServicesSection({ business }: { business: Business }) {
  useThemeContext();
  return (
    <View style={localStyles.section}>
      <Header icon="grid-outline" title="Products and services" />
      {business.services.map((service, index) => (
        <View key={`service-${index}`} style={localStyles.itemRow}>
          <View style={localStyles.itemIcon}>
            <Ionicons name="briefcase-outline" size={20} color={colors.emerald} />
          </View>
          <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>
            {service.name}
          </Text>
        </View>
      ))}
      {business.products.map((product) => (
        <View key={product.id} style={localStyles.itemRow}>
          <View style={localStyles.itemIcon}>
            <Ionicons name="cube-outline" size={20} color={colors.emerald} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.caption} numberOfLines={2}>
              {product.description}
            </Text>
          </View>
        </View>
      ))}
      {!business.services.length && !business.products.length ? (
        <Text style={styles.caption}>No products or services listed yet.</Text>
      ) : null}
    </View>
  );
}

export function StorySection() {
  useThemeContext();
  return (
    <View style={localStyles.section}>
      <Header icon="book-outline" title="Our story" />
      <Text style={styles.body}>{SAMPLE.story.intro}</Text>
      {SAMPLE.story.timeline.map((step) => (
        <View key={step.year} style={localStyles.timelineRow}>
          <View style={localStyles.timelineDot} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={localStyles.timelineYear}>{step.year}</Text>
            <Text style={styles.cardTitle}>{step.title}</Text>
            <Text style={styles.caption}>{step.detail}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    section: {
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: colors.ink },
    headerAction: { fontSize: 14, fontWeight: "700", color: colors.emerald },
    aboutCard: {
      gap: 10,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.emeraldTint,
    },
    aboutHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    glanceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    glanceCell: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.subtle,
    },
    glanceIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.emeraldTint,
    },
    glanceValue: { fontSize: 15, fontWeight: "800", color: colors.ink },
    tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.emeraldTint,
    },
    tagText: { fontSize: 13, fontWeight: "700", color: colors.emeraldDark },
    teamPreviewRow: { flexDirection: "row", justifyContent: "space-between" },
    teamPreviewCell: { flex: 1, alignItems: "center", gap: 3, paddingHorizontal: 4 },
    teamName: { fontSize: 13, fontWeight: "800", color: colors.ink, marginTop: 4 },
    teamRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    contactRow: { flexDirection: "row", gap: 10 },
    contactCell: { flex: 1, gap: 4 },
    contactLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    contactValue: { fontSize: 12, fontWeight: "600", color: colors.ink },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    itemIcon: {
      width: 44,
      height: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.emeraldTint,
    },
    opportunity: {
      gap: 6,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.subtle,
    },
    outlineButton: {
      alignSelf: "flex-start",
      marginTop: 4,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.emerald,
    },
    outlineButtonText: { fontSize: 13, fontWeight: "700", color: colors.emerald },
    faqItem: { gap: 2 },
    timelineRow: { flexDirection: "row", gap: 12 },
    timelineDot: {
      width: 10,
      height: 10,
      marginTop: 6,
      borderRadius: 5,
      backgroundColor: colors.emerald,
    },
    timelineYear: { fontSize: 12, fontWeight: "800", color: colors.emerald },
  })
);