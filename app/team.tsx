import { router } from "expo-router";
import { Alert, Platform, Text, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { Avatar, Button, ConfirmModal, EmptyState, Field, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServices, useBizConnectServiceMode } from "@/lib/services/service-provider";
import type { BusinessActivityRecord, BusinessInvitation, OwnershipTransfer } from "@/lib/api/feature-contracts";
import type { BusinessTeamMember, TeamRole } from "@/types/domain";
import { newLocalId } from "@/utils/ids";

function feedback(title: string, message: string) { if (Platform.OS === "web") window.alert(`${title}\n\n${message}`); else Alert.alert(title, message); }
const ROLES: TeamRole[] = ["Administrator", "Content Manager", "Viewer"];
const ADMIN_ASSIGNABLE_ROLES: TeamRole[] = ["Content Manager", "Viewer"];
const PAGE = { limit: 100 };

export default function TeamScreen() {
  const app = useAppStore();
  const services = useBizConnectServices();
  const apiMode = useBizConnectServiceMode() === "api";
  const business = app.businesses.find((item) => item.id === app.activeBusinessId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Content Manager");
  const [members, setMembers] = useState<BusinessTeamMember[]>(business?.team ?? []);
  const [myInvitations, setMyInvitations] = useState<BusinessInvitation[]>([]);
  const [businessInvitations, setBusinessInvitations] = useState<BusinessInvitation[]>([]);
  const [transfers, setTransfers] = useState<OwnershipTransfer[]>([]);
  const [activity, setActivity] = useState<BusinessActivityRecord[]>([]);
  const [transferEmail, setTransferEmail] = useState("");
  const [removeId, setRemoveId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const myRole = business?.currentUserRole ?? members.find((member) => member.userId === app.user.id)?.role;
  const canManage = myRole === "Owner" || myRole === "Administrator";
  const assignableRoles = !apiMode || myRole === "Owner" ? ROLES : myRole === "Administrator" ? ADMIN_ASSIGNABLE_ROLES : [];

  const refresh = useCallback(async () => {
    if (!apiMode || !app.isAuthenticated) return;
    setLoading(true); setError("");
    const requests = await Promise.all([
      services.memberships.listMyInvitations(PAGE),
      services.memberships.listMyOwnershipTransfers(),
      business && myRole ? services.memberships.list(business.id, PAGE) : Promise.resolve(null),
      business && canManage ? services.memberships.listInvitations(business.id, PAGE) : Promise.resolve(null),
      business && canManage ? services.memberships.listActivity(business.id, PAGE) : Promise.resolve(null),
    ]);
    const failures: string[] = [];
    const [mine, transfersResult, membersResult, invitationsResult, activityResult] = requests;
    if (mine.ok) setMyInvitations(mine.data.items.filter((item) => item.status === "pending")); else failures.push(mine.error.message);
    if (transfersResult.ok) setTransfers(transfersResult.data.filter((item) => item.status === "pending")); else failures.push(transfersResult.error.message);
    if (membersResult) { if (membersResult.ok) setMembers(membersResult.data.items); else failures.push(membersResult.error.message); }
    else if (!business || !myRole) setMembers([]);
    if (invitationsResult) { if (invitationsResult.ok) setBusinessInvitations(invitationsResult.data.items.filter((item) => item.status === "pending")); else failures.push(invitationsResult.error.message); }
    else setBusinessInvitations([]);
    if (activityResult) { if (activityResult.ok) setActivity(activityResult.data.items); else failures.push(activityResult.error.message); }
    else setActivity([]);
    setError(failures.join(" · ")); setLoading(false);
  }, [apiMode, app.isAuthenticated, business, myRole, canManage, services]);

  useEffect(() => { setMembers(business?.team ?? []); void refresh(); }, [business?.id, refresh]);

  if (!app.isAuthenticated) return <Page><TopBar title="Business team" back /><EmptyState title="Sign in to manage a team" detail="Team invitations and role management require an authenticated account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (!business) return <Page><TopBar title="Business team" back /><Text style={styles.caption}>Select a business first in your profile.</Text></Page>;

  const run = async (action: () => Promise<{ ok: boolean; error?: { message: string } }>, success?: string) => {
    setBusy(true); setError("");
    try {
      const result = await action();
      if (!result.ok) { const message = result.error?.message ?? "The server rejected the operation."; setError(message); feedback("Team action failed", message); }
      else {
        if (success) feedback("BizConnect", success);
        await refresh();
        if (apiMode) {
          const managed = await services.businesses.list(PAGE);
          if (managed.ok) app.replaceApiBusinesses(managed.data.items);
          else setError(managed.error.message);
        }
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The API request could not be completed.";
      setError(message); feedback("Team action failed", message);
    } finally { setBusy(false); }
  };

  const invite = () => {
    if (!canManage) return feedback("Permission denied", "Only an Owner or Administrator can invite team members.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return feedback("Check the email", "Enter a valid email address for a registered BizConnect user.");
    if (apiMode) {
      void run(() => services.memberships.invite(business.id, { email: email.trim(), role }), "Invitation created by the BizConnect API. No email delivery is implied.");
    } else {
      if (business.team.some((member) => member.email.toLowerCase() === email.trim().toLowerCase())) return feedback("Already on the team", "This person already appears in the local team.");
      app.updateBusiness(business.id, { team: [...business.team, { userId: newLocalId("invite"), role, joinedAt: new Date().toISOString(), displayName: email.trim(), email: email.trim() }] });
      feedback("Local demo", "Invitation placeholder saved on this device only; no email was sent.");
    }
    setEmail("");
  };
  const remove = () => {
    if (!removeId) return;
    const target = removeId; setRemoveId(undefined);
    if (apiMode) void run(() => services.memberships.remove(business.id, target), "Member access was revoked by the server.");
    else { app.updateBusiness(business.id, { team: business.team.filter((member) => member.userId !== target) }); setMembers((current) => current.filter((member) => member.userId !== target)); }
  };
  const respondInvitation = (invitation: BusinessInvitation, accept: boolean) => void run(
    () => accept ? services.memberships.acceptInvitation(invitation.businessId, invitation.id) : services.memberships.declineInvitation(invitation.businessId, invitation.id),
    accept ? `You joined ${invitation.businessName}.` : `Invitation to ${invitation.businessName} declined.`,
  );
  const manageInvitation = (invitation: BusinessInvitation, cancel: boolean) => void run(
    () => services.memberships.cancelInvitation(invitation.businessId, invitation.id),
    cancel ? "Pending invitation cancelled." : undefined,
  );
  const respondTransfer = (transfer: OwnershipTransfer, action: "accept" | "decline" | "cancel") => void run(() => {
    if (action === "accept") return services.memberships.acceptOwnershipTransfer(transfer.businessId, transfer.id);
    if (action === "decline") return services.memberships.declineOwnershipTransfer(transfer.businessId, transfer.id);
    return services.memberships.cancelOwnershipTransfer(transfer.businessId, transfer.id);
  }, action === "accept" ? `Ownership of ${transfer.businessName} is now transferred.` : action === "decline" ? "Ownership transfer declined." : "Ownership transfer request cancelled.");
  const requestTransfer = () => {
    if (myRole !== "Owner") return feedback("Permission denied", "Only the current Owner can request an ownership transfer.");
    if (!/^\S+@\S+\.\S+$/.test(transferEmail.trim())) return feedback("Check the email", "Enter the email of the registered recipient.");
    void run(() => services.memberships.requestOwnershipTransfer(business.id, transferEmail.trim()), "Transfer request sent. The current owner remains in control until the recipient accepts.");
    setTransferEmail("");
  };
  const changeRole = (member: BusinessTeamMember, nextRole: TeamRole) => {
    if (apiMode) void run(() => services.memberships.updateRole(business.id, member.userId, nextRole), `Role updated to ${nextRole}.`);
    else { app.updateBusiness(business.id, { team: business.team.map((item) => item.userId === member.userId ? { ...item, role: nextRole } : item) }); setMembers((current) => current.map((item) => item.userId === member.userId ? { ...item, role: nextRole } : item)); }
  };

  return <Page>
    <TopBar title="Business team" back />
    <LocalNote text={apiMode ? `API mode · server-enforced access for ${business.name} · your role: ${myRole ?? "no access"}.` : `Local demo · ${business.name} · role: ${myRole ?? "no access"}. Changes stay on this device.`} />
    {loading ? <Text style={styles.caption}>Loading team access from BizConnect…</Text> : null}
    {error ? <View style={[styles.card, { padding: 12 }]}><Text style={styles.body}>{error}</Text><Button title="Retry" variant="outline" small onPress={() => void refresh()} /></View> : null}
    <View style={[styles.card, { padding: 15, gap: 9 }]}><SectionTitle title="Roles & permissions" /><Text style={styles.body}>Owner: full control, transfer and archive. Admin: profile and team operations within role boundaries. Editor: edit permitted business information. Viewer: read-only access. API mode enforces every permission on the server.</Text></View>

    {apiMode ? <>
      <SectionTitle title={`Your invitations (${myInvitations.length})`} />
      {myInvitations.length ? myInvitations.map((invitation) => <View key={invitation.id} style={[styles.actionTile, { flexWrap: "wrap" }]}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{invitation.businessName}</Text><Text style={styles.caption}>{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</Text></View><Button title="Accept" small disabled={busy} onPress={() => respondInvitation(invitation, true)} /><Button title="Decline" variant="outline" small disabled={busy} onPress={() => respondInvitation(invitation, false)} /></View>) : <Text style={styles.caption}>No pending invitations for this account.</Text>}

      {canManage ? <>
        <SectionTitle title={`Pending invitations · ${business.name}`} />
        {businessInvitations.length ? businessInvitations.map((invitation) => <View key={invitation.id} style={styles.actionTile}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{invitation.invitedEmail}</Text><Text style={styles.caption}>{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</Text></View><Button title="Cancel" variant="outline" small disabled={busy} onPress={() => manageInvitation(invitation, true)} /></View>) : <Text style={styles.caption}>No pending invitations for this business.</Text>}
      </> : null}
    </> : null}

    <SectionTitle title={`Team members (${members.length})`} />
    {members.length ? members.map((member) => <View key={member.userId} style={[styles.actionTile, { flexWrap: "wrap" }]}><Avatar name={member.displayName} size={38} /><View style={{ flex: 1, minWidth: 120 }}><Text style={styles.cardTitle}>{member.displayName}</Text><Text style={styles.caption}>{member.email} · {member.role}</Text></View>{member.role === "Owner" ? <Text style={styles.caption}>OWNER</Text> : canManage && member.userId !== app.user.id ? <Button title="Remove" variant="danger" small disabled={busy} onPress={() => setRemoveId(member.userId)} /> : null}{apiMode && canManage && member.role !== "Owner" && member.userId !== app.user.id ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>{assignableRoles.filter((candidate) => candidate !== member.role).map((candidate) => <Button key={candidate} title={candidate} variant="outline" small disabled={busy} onPress={() => changeRole(member, candidate)} />)}</View> : null}</View>) : <Text style={styles.caption}>{apiMode ? "No members were returned for this business." : "The local business team is empty."}</Text>}

    {canManage ? <View style={[styles.card, { padding: 15, gap: 11 }]}><Text style={styles.sectionHeading}>Invite a team member</Text><Field label="Registered user email" value={email} onChangeText={setEmail} placeholder="person@example.com" keyboardType="email-address" autoCapitalize="none" /><Text style={styles.label}>Role</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{assignableRoles.map((item) => <Button key={item} title={item} variant={role === item ? "soft" : "outline"} small onPress={() => setRole(item)} />)}</View><Button title={busy ? "Working…" : "Invite member"} icon="person-add-outline" disabled={busy} onPress={invite} /></View> : <Text style={styles.caption}>Only the business Owner or an Administrator can invite or remove members.</Text>}

    {apiMode && myRole === "Owner" ? <View style={[styles.card, { padding: 15, gap: 10 }]}><Text style={styles.sectionHeading}>Transfer ownership</Text><Text style={styles.caption}>The recipient must be a registered BizConnect user and explicitly accept. You remain the owner until then.</Text><Field label="Recipient account email" value={transferEmail} onChangeText={setTransferEmail} placeholder="recipient@example.com" keyboardType="email-address" autoCapitalize="none" /><Button title="Request transfer" variant="outline" disabled={busy} onPress={requestTransfer} /></View> : null}

    {apiMode && transfers.filter((transfer) => transfer.businessId === business.id).length ? <>
      <SectionTitle title="Ownership transfers" />
      {transfers.filter((transfer) => transfer.businessId === business.id).map((transfer) => {
        const incoming = transfer.toUserId === app.user.id;
        const outgoing = transfer.fromUserId === app.user.id;
        return <View key={transfer.id} style={[styles.actionTile, { flexWrap: "wrap" }]}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{transfer.businessName}</Text><Text style={styles.caption}>{incoming ? `Transfer from ${transfer.fromName}` : outgoing ? `Requested for ${transfer.toEmail}` : "Pending"} · expires {new Date(transfer.expiresAt).toLocaleDateString()}</Text></View>{incoming ? <><Button title="Accept" disabled={busy} small onPress={() => respondTransfer(transfer, "accept")} /><Button title="Decline" disabled={busy} variant="outline" small onPress={() => respondTransfer(transfer, "decline")} /></> : outgoing ? <Button title="Cancel" disabled={busy} variant="outline" small onPress={() => respondTransfer(transfer, "cancel")} /> : null}</View>;
      })}
    </> : null}

    {apiMode && canManage ? <><SectionTitle title="Business activity & audit" />{activity.length ? activity.map((record) => <View key={record.id} style={[styles.card, { padding: 12, gap: 4 }]}><Text style={styles.cardTitle}>{record.summary}</Text><Text style={styles.caption}>{record.actorName} · {record.eventType} · {new Date(record.createdAt).toLocaleString()}</Text></View>) : <Text style={styles.caption}>No activity records returned yet.</Text>}</> : null}

    {myRole && myRole !== "Owner" ? <Button title="Leave this business" variant="outline" disabled={busy} onPress={() => void run(() => services.memberships.leave(business.id), "You left this business and your access was revoked.")} /> : null}
    <ConfirmModal visible={Boolean(removeId)} title="Remove this team member?" detail="Their server-side business access will be revoked immediately." confirmLabel="Remove" destructive onCancel={() => setRemoveId(undefined)} onConfirm={remove} />
  </Page>;
}
