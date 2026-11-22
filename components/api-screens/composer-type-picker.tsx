import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export type TypeChoice = {
  title: string;
  detail: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  select: () => void;
  /** Set true for formats that need a business profile (product, update...). */
  requiresBusiness?: boolean;
};

type Props = {
  choices: TypeChoice[];
  selectedType: string;
  noBusinesses: boolean;
  onPick: (choice: TypeChoice) => void;
};

export function ComposerTypePicker({
  choices,
  selectedType,
  noBusinesses,
  onPick,
}: Props) {
  useThemeContext();
  return (
    <View style={localStyles.root}>
      <View style={localStyles.headerBand}>
        <Text style={localStyles.heading}>What would you like to create?</Text>
        <Text style={styles.caption}>
          Choose a format. We’ll tailor the next screen to what you’re sharing.
        </Text>
      </View>

      <View style={localStyles.listBand}>
        {choices.map((choice, index) => {
          const active = selectedType === choice.title;
          const isLast = index === choices.length - 1;
          const locked = noBusinesses && Boolean(choice.requiresBusiness);
          return (
            <Pressable
              key={choice.title}
              accessibilityRole="button"
              accessibilityState={{ disabled: locked }}
              disabled={locked}
              onPress={() => onPick(choice)}
              style={({ pressed }) => [
                localStyles.choiceRow,
                isLast && localStyles.choiceRowLast,
                locked && { opacity: 0.45 },
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={localStyles.iconSlot}>
                <Ionicons
                  name={choice.icon}
                  size={23}
                  color={active ? colors.emeraldDark : colors.ink}
                />
              </View>
              <View style={localStyles.choiceText}>
                <Text
                  style={[
                    localStyles.choiceTitle,
                    active && localStyles.choiceTitleActive,
                  ]}
                >
                  {choice.title}
                </Text>
                <Text style={styles.caption}>
                  {locked
                    ? "Needs a business profile. Create one to use this."
                    : choice.detail}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.muted}
              />
            </Pressable>
          );
        })}
      </View>

      {noBusinesses && !choices.some((c) => c.requiresBusiness) ? (
        <View style={localStyles.noteBand}>
          <Text style={styles.caption}>
            Product and business update posts require a business profile.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.surface,
    },
    headerBand: {
      gap: 4,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    heading: {
      color: colors.ink,
      fontSize: 21,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    listBand: {
      marginHorizontal: -16,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    choiceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 18,
      paddingVertical: 15,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    choiceRowLast: {
      borderBottomWidth: 0,
    },
    iconSlot: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    choiceText: {
      flex: 1,
      gap: 2,
    },
    choiceTitle: {
      color: colors.ink,
      fontSize: 15,
      fontWeight: "700",
    },
    choiceTitleActive: {
      color: colors.emeraldDark,
    },
    noteBand: {
      marginHorizontal: -16,
      paddingHorizontal: 18,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
  })
);