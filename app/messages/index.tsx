import { Redirect } from "expo-router";

export default function MessagesScreen() {
  return <Redirect href={{ pathname: "/menu/activity/notifications", params: { tab: "messages" } }} />;
}