import { Linking } from "react-native";
import { ActionTile, LocalNote, Page, SectionTitle, TopBar } from "@/components/biz-ui";

export default function DevicePermissionsScreen() {
  const openSettings = () => void Linking.openSettings();
  return (
    <Page>
      <TopBar title="Device permissions" back />
      <LocalNote text="Permissions are controlled by your phone. Tap an item to open Mabiz settings." />
      <SectionTitle title="Access" />
      <ActionTile title="Camera" detail="Take photos and videos for posts" icon="camera-outline" onPress={openSettings} />
      <ActionTile title="Photos and media" detail="Choose images and videos from your gallery" icon="images-outline" onPress={openSettings} />
      <ActionTile title="Location" detail="Show nearby businesses and tag locations" icon="location-outline" onPress={openSettings} />
      <ActionTile title="Notifications" detail="Alerts and activity updates" icon="notifications-outline" onPress={openSettings} />
    </Page>
  );
}
