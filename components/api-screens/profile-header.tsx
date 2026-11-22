import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Avatar,
  Stat,
  VerifiedBadge,
  styles,
} from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export type ProfileStat = {
  value: string | number;
  label: string;
  /** When set, the stat becomes a tappable shortcut (e.g. open followers). */
  onPress?: () => void;
};

type Props = {
  name: string;
  image?: string;
  subtitle?: string;
  bio?: string;
  /** Pass a boolean to show the verified badge next to the name. */
  verified?: boolean;
  stats: ProfileStat[];
  /** Action buttons / inline messages rendered under the stats. */
  children?: ReactNode;
};

/** Shared header for person, business and (optionally) personal profiles. */
export function ProfileHeader({
  name,
  image,
  subtitle,
  bio,
  verified,
  stats,
  children,
}: Props) {
  useThemeContext();
  return (
    <View style={localStyles.header}>
      <Avatar name={name} image={image} size={82} ring />
      <View style={localStyles.nameRow}>
        <Text style={styles.sectionHeading}>{name}</Text>
        {verified !== undefined ? <VerifiedBadge verified={verified} /> : null}
      </View>
      {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
      {bio ? <Text style={[styles.body, localStyles.bio]}>{bio}</Text> : null}

      <View style={localStyles.statsRow}>
        {stats.map((stat) => {
          const content = <Stat value={stat.value} label={stat.label} />;
          return stat.onPress ? (
            <Pressable
              key={stat.label}
              accessibilityRole="button"
              accessibilityLabel={`${stat.value} ${stat.label}`}
              hitSlop={8}
              onPress={stat.onPress}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              {content}
            </Pressable>
          ) : (
            <View
              key={stat.label}
              accessible
              accessibilityLabel={`${stat.value} ${stat.label}`}
            >
              {content}
            </View>
          );
        })}
      </View>

      {children}
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    header: {
      alignItems: "center",
      paddingTop: 8,
      paddingBottom: 22,
      paddingHorizontal: 8,
      gap: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
      marginHorizontal: -16,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    bio: { textAlign: "center", paddingHorizontal: 20, marginTop: 2 },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      paddingVertical: 10,
      marginTop: 4,
      width: "100%",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  })
);
