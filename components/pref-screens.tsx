import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";

export function useLocalPref<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(`pref:${key}`)
      .then((raw) => {
        if (alive && raw != null) setValue(JSON.parse(raw) as T);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);
  const set = (next: T) => {
    setValue(next);
    AsyncStorage.setItem(`pref:${key}`, JSON.stringify(next)).catch(() => {});
  };
  return [value, set] as const;
}

type ToggleItem = { key: string; title: string; detail?: string; defaultValue: boolean };

export function ToggleScreen({ title, heading, prefKey, items }: {
  title: string;
  heading?: string;
  prefKey: string;
  items: ToggleItem[];
}) {
  const defaults: Record<string, boolean> = {};
  items.forEach((i) => { defaults[i.key] = i.defaultValue; });
  const [stored, setStored] = useLocalPref<Record<string, boolean>>(prefKey, {});
  const valueOf = (i: ToggleItem) => stored[i.key] ?? i.defaultValue;

  return (
    <Page>
      <TopBar title={title} back />
      {heading ? <SectionTitle title={heading} /> : null}
      {items.map((i) => (
        <View key={i.key} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{i.title}</Text>
            {i.detail ? <Text style={styles.caption}>{i.detail}</Text> : null}
          </View>
          <Switch
            value={valueOf(i)}
            onValueChange={(v) => setStored({ ...defaults, ...stored, [i.key]: v })}
          />
        </View>
      ))}
    </Page>
  );
}

type ChoiceOption = { value: string; title: string; detail?: string };

export function ChoiceScreen({ title, heading, prefKey, defaultValue, options }: {
  title: string;
  heading?: string;
  prefKey: string;
  defaultValue: string;
  options: ChoiceOption[];
}) {
  const [value, setValue] = useLocalPref<string>(prefKey, defaultValue);

  return (
    <Page>
      <TopBar title={title} back />
      {heading ? <SectionTitle title={heading} /> : null}
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === o.value }}
          onPress={() => setValue(o.value)}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{o.title}</Text>
            {o.detail ? <Text style={styles.caption}>{o.detail}</Text> : null}
          </View>
          <Ionicons name={value === o.value ? "radio-button-on" : "radio-button-off"} size={22} />
        </Pressable>
      ))}
    </Page>
  );
}
