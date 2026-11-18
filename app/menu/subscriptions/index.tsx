import { Text, View } from "react-native";
import { Button, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";

const plans = [
  { name: "Free", detail: "Personal profile, posts and messaging", current: true },
  { name: "Creator", detail: "Advanced insights and creator tools", current: false },
  { name: "Mabiz Pro", detail: "Business verification and growth tools", current: false },
];

export default function SubscriptionsScreen() {
  return (
    <Page>
      <TopBar title="Subscriptions" back />
      <LocalNote text="Paid plans are not available yet." />
      <SectionTitle title="Plans" />
      {plans.map((plan) => (
        <View key={plan.name} style={styles.actionTile}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{plan.name}</Text>
            <Text style={styles.caption}>{plan.detail}</Text>
          </View>
          {plan.current ? <Text style={styles.caption}>Current</Text> : <Button title="Soon" small variant="outline" disabled onPress={() => undefined} />}
        </View>
      ))}
    </Page>
  );
}
