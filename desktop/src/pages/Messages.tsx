import { useState } from "react";
import { api, apiMode } from "../api";
import { Icon } from "../components/icons";
import { Avatar, Banner, CityHero, SectionHeading } from "../components/ui";
import { useAction } from "../hooks/useAction";
import { conversations as seedConversations, type Conversation } from "../data";

export function Messages({ onOpenBusiness }: { onOpenBusiness: () => void }) {
  const [items, setItems] = useState<Conversation[]>(seedConversations);
  const [selected, setSelected] = useState(items[0]);
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const action = useAction();
  const send = async () => {
    if (!text.trim()) {
      action.setStatus({ kind: "error", message: "Type a message first." });
      return;
    }
    if (apiMode === "api") {
      const r = await action.run(() => api.sendMessage(selected.id, text.trim()), "Message sent");
      if (!r.ok) return;
    }
    setSent([...sent, text.trim()]);
    setText("");
  };
  return (
    <>
      <Banner status={action.status} onDismiss={() => action.setStatus(null)}/>
      <CityHero title="Messages" description="Chat, collaborate and grow your business community." hero="hero-messages"/>
      <div className="message-layout">
        <aside className="inbox">
          <div className="message-tabs">
            <button className="active">All chats</button>
            <button>Unread</button>
          </div>
          {items.map(i => (
            <button className={`conversation ${selected.id === i.id ? "active" : ""}`} key={i.id} onClick={() => setSelected(i)}>
              <Avatar initials={i.name.split(" ").map(x => x[0]).join("").slice(0, 2)} color={i.color} size="sm"/>
              <span><b>{i.name}</b><small>{i.preview}</small></span>
              <em>{i.time}</em>
            </button>
          ))}
        </aside>
        <main className="chat">
          <div className="chat-head">
            <Avatar initials={selected.name.slice(0, 2)} color={selected.color}/>
            <div><b>{selected.name}</b><span><i className="online"/> {selected.company}</span></div>
            <button className="button button-soft" onClick={onOpenBusiness}>View profile</button>
          </div>
          <div className="chat-body">
            <div className="date-divider">Today</div>
            <div className="message incoming">Hello Kester! Thanks for reaching out about the collaboration.<small>10:21 AM</small></div>
            <div className="message outgoing">That's great! We would love to partner on the upcoming Business Expo.</div>
            {sent.map((s, i) => <div className="message outgoing" key={`${s}-${i}`}>{s}<small>now</small></div>)}
          </div>
          <div className="chat-compose">
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && void send()} placeholder="Type a message..."/>
            <button onClick={() => void send()} className="send"><Icon name="arrow"/></button>
          </div>
        </main>
        <aside className="chat-context">
          <div className="context-cover" style={{ background: selected.color }}>
            <Avatar initials={selected.name.slice(0, 2)} color={selected.color} size="lg"/>
          </div>
          <h3>{selected.name}</h3>
          <span className="muted">{selected.company}</span>
          <button className="button button-outline full" onClick={onOpenBusiness}>View business profile</button>
          <SectionHeading title="Quick actions"/>
          <button className="quick-action" onClick={onOpenBusiness}><Icon name="briefcase"/> View business</button>
          <button className="quick-action" onClick={() => setText("I would like to learn more about your products.")}><Icon name="box"/> Enquire about products</button>
        </aside>
      </div>
    </>
  );
}
