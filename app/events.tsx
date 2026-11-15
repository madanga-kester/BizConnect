import { router } from "expo-router";
import { useState } from "react";
import { Button, ConfirmModal, EmptyState, LocalNote, MediaImage, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";

export default function EventsScreen() {
  const app = useAppStore();
  const now = useClock();
  const [deleteId, setDeleteId] = useState<string>();
  const sorted = [...app.businessEvents].filter((event) => now === 0 || new Date(event.startsAt).getTime() > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return <Page><TopBar title="Business events" back right={<Button title="Create" icon="add-outline" small onPress={() => router.push({ pathname: "/create-listing", params: { kind: "event" } })} />} />
    <View style={{ backgroundColor: colors.navy, borderRadius: 20, padding: 17, gap: 7 }}><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>EVENTS & MEETUPS</Text><Text style={{ color: colors.white, fontSize: 22, fontWeight: "800" }}>Build the room you need.</Text><Text style={{ color: "#D9E2E9", lineHeight: 19 }}>Networking, workshops, product launches and founder gatherings.</Text></View>
    <LocalNote text="Local device events only · not public listings · registration is not transmitted" />
    <SectionTitle title={`Upcoming local events · ${sorted.length}`} />
    {!sorted.length ? <EmptyState title="No local events yet" detail="Create an event for this demo device. It will not appear to other BizConnect users." icon="calendar-outline" action="Create event" onAction={() => router.push({ pathname: "/create-listing", params: { kind: "event" } })} /> : null}
    {sorted.map((event) => <View key={event.id} style={[styles.card, { padding: 13, gap: 8 }]}>{event.cover ? <MediaImage uri={event.cover} height={160} label={event.title} /> : null}<Text style={styles.sectionHeading}>{event.title}</Text><Text style={styles.caption}>{event.category} · {new Date(event.startsAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</Text><Text style={styles.body}>{event.description}</Text><Text style={styles.caption}>{event.online ? "Online" : "In person"} · {event.location}</Text>{event.registrationInstructions ? <Text style={styles.caption}>Registration: {event.registrationInstructions}</Text> : null}<Text style={styles.caption}>Contact: {event.contact} · Created by {event.identityKind === "business" ? app.businesses.find((business) => business.id === event.identityId)?.name ?? "Business" : app.user.name}</Text><View style={styles.row}><Button title="Edit" icon="create-outline" small variant="outline" onPress={() => router.push({ pathname: "/create-listing", params: { kind: "event", eventId: event.id } })} /><Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setDeleteId(event.id)} /></View><Text style={styles.caption}>Device-only event · registration is not shared</Text></View>)}
    <ConfirmModal visible={Boolean(deleteId)} title="Delete this event?" detail="This removes the event from this device only." confirmLabel="Delete locally" destructive onCancel={() => setDeleteId(undefined)} onConfirm={() => { if (deleteId) app.removeBusinessEvent(deleteId); setDeleteId(undefined); }} />
  </Page>;
}
