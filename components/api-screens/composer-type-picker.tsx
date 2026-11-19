import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { styles } from "@/components/biz-ui";
import { colors } from "@/theme/tokens";

export type TypeChoice = {
  title: string;
  detail: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  select: () => void;
};

type Props = {
  choices: TypeChoice[];
  selectedType: string;
  noBusinesses: boolean;
  onPick: (choice: TypeChoice) => void;
};

export function ComposerTypePicker({ choices, selectedType, noBusinesses, onPick }: Props) {
  return (
    <View style={{ gap: 12, paddingTop: 8 }}>
      <Text style={{ color: colors.navy, fontSize: 21, fontWeight: "800" }}>What would you like to create?</Text>
      <Text style={styles.caption}>Choose a format. We’ll tailor the next screen to what you’re sharing.</Text>
      {choices.map((choice) => {
        const active = selectedType === choice.title;
        return (
          <Pressable
            key={choice.title}
            onPress={() => onPick(choice)}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: active ? colors.emerald : colors.border, backgroundColor: active ? colors.subtle : colors.surface }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: active ? colors.emerald : colors.subtle, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={choice.icon} size={22} color={active ? colors.white : colors.navy} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.navy, fontSize: 15, fontWeight: "800" }}>{choice.title}</Text>
              <Text style={styles.caption}>{choice.detail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.muted} />
          </Pressable>
        );
      })}
      {noBusinesses ? <Text style={styles.caption}>Product and business update posts require a business profile.</Text> : null}
    </View>
  );
}