import { useState } from "react";
import { api, apiMode } from "../api";
import { Icon } from "../components/icons";
import { Banner } from "../components/ui";
import { useAction } from "../hooks/useAction";

export function Notifications() {
  const [read, setRead] = useState(false);
  const [items, setItems] = useState(["Urban Coffee Co. replied to your review", "You have a new opportunity match", "GreenLeaf Organics followed your business", "Your milestone was added"]);
  const action = useAction();
  const markAll = async () => {
    if (apiMode === "api") {
      const r = await api.readAllNotifications();
      if (!r.ok) {
        action.setStatus({ kind: "error", message: r.message });
        return;
      }
    }
    setRead(true);
    action.setStatus({ kind: "success", message: apiMode === "api" ? "Notifications marked read on the server." : "Notifications marked read locally." });
  };
  const dismiss = async (index: number) => {
    if (apiMode === "api") {
      const r = await api.notificationAction(String(index + 1), "dismiss");
      if (!r.ok) {
        action.setStatus({ kind: "error", message: r.message });
        return;
      }
    }
    setItems(current => current.filter((_, i) => i !== index));
    action.setStatus({ kind: "success", message: apiMode === "api" ? "Notification dismissed." : "Notification dismissed locally." });
  };
  return (
    <>
      <Banner status={action.status} onDismiss={() => action.setStatus(null)}/>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">KEEP UP WITH YOUR COMMUNITY</div>
          <h1>Notifications</h1>
          <p>See what’s happening across your people and businesses.</p>
        </div>
        <button className="text-button" onClick={() => void markAll()}>{read ? "All caught up" : "Mark all as read"}</button>
      </div>
      <div className="notification-list">
        {items.map((x, i) => (
          <div className={`notification ${read ? "read" : ""}`} key={x}>
            <span className="notification-icon"><Icon name={i % 2 ? "spark" : "bell"}/></span>
            <div>
              <b>{x}</b>
              <span>Build your local network one connection at a time.</span>
              <small>{i + 1} hour{i ? "s" : ""} ago</small>
            </div>
            <button onClick={() => void dismiss(i)}>Dismiss</button>
          </div>
        ))}
      </div>
    </>
  );
}
