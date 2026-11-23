import { useEffect, useRef, useState } from "react";
import { I } from "../bc/Icon";
import { GrowCard, Hero, img } from "../bc/ui";

type Msg = { id: number; me: boolean; text?: string; file?: { name: string; size: string }; time: string };
const chats = [
  { id: "urban", name: "Urban Coffee Co.", pic: "logo-urban", preview: "Perfect! We'll get back to you...", time: "10:24 AM", unread: 1, verified: true, group: false, biz: true },
  { id: "tech", name: "TechSolutions Ltd", pic: "logo-tech", preview: "Thanks for your interest...", time: "09:50 AM", unread: 1, verified: false, group: false, biz: true },
  { id: "greenleaf", name: "GreenLeaf Organics", pic: "logo-greenleaf", preview: "Great. Looking forward to...", time: "Yesterday", unread: 1, verified: false, group: false, biz: true },
  { id: "mary", name: "Mary Wanjiru", pic: "mary", preview: "Can you share more details...", time: "Mon, 10 Nov", unread: 0, verified: false, group: false, biz: false },
  { id: "community", name: "BizConnect Community", pic: "community", preview: "Welcome to our business...", time: "Sun, 9 Nov", unread: 0, verified: false, group: true, biz: false },
  { id: "david", name: "David Ochieng", pic: "david", preview: "Let's discuss the partnership...", time: "Sat, 8 Nov", unread: 0, verified: false, group: false, biz: false },
];
const seed: Msg[] = [
  { id: 1, me: false, text: "Hello Kester! Thanks for reaching out. We are always open to collaboration.", time: "09:12 AM" },
  { id: 2, me: true, text: "That's great! We would love to partner on the upcoming Business Expo.", time: "09:20 AM" },
  { id: 3, me: false, text: "Perfect! We'll get back to you with more details and our proposal shortly.", time: "10:24 AM" },
  { id: 4, me: true, text: "Thank you. Looking forward to it.", time: "10:26 AM" },
  { id: 5, me: false, file: { name: "BizExpo-Proposal.docx", size: "245 KB" }, time: "10:28 AM" },
];

export function Messages({ onOpenBusiness }: { onOpenBusiness: () => void }) {
  const [tab, setTab] = useState("All Chats (3)");
  const [q, setQ] = useState("");
  const [active, setActive] = useState("urban");
  const [read, setRead] = useState<Set<string>>(new Set());
  const [thread, setThread] = useState<Record<string, Msg[]>>({ urban: seed });
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [thread, active]);
  const c = chats.find(x => x.id === active)!;
  const msgs = thread[active] ?? [{ id: 0, me: false, text: c.preview.replace("...", "."), time: c.time }];
  const shown = chats.filter(x => x.name.toLowerCase().includes(q.toLowerCase()) && (tab.startsWith("Unread") ? x.unread && !read.has(x.id) : tab.startsWith("Groups") ? x.group : tab === "Business" ? x.biz : true));
  const send = () => {
    if (!draft.trim()) return;
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setThread(s => ({ ...s, [active]: [...msgs, { id: Date.now(), me: true, text: draft.trim(), time: t }] }));
    setDraft("");
  };
  return (
    <div className="bc-page">
      <Hero title="Messages" text="Chat, collaborate and grow your business community." image="hero-msg" height={134} icon={<I n="message" size={40} />} />
      <div className="bc-msg">
        <div className="bc-msg-list">
          <div className="bc-msg-tabs">
            {["All Chats (3)", "Unread (3)", "Groups (1)", "Business"].map(t => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
          </div>
          <label className="bc-search"><I n="search" size={20} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search conversations..." /><I n="sliders" size={20} /></label>
          <div className="bc-convs">
            {shown.map(x => (
              <button key={x.id} className={`bc-conv ${active === x.id ? "on" : ""}`} onClick={() => { setActive(x.id); setRead(r => new Set(r).add(x.id)); }}>
                <img src={img(x.pic)} alt="" />
                <span className="bc-conv-txt"><b>{x.name} {x.verified && <I n="verified" size={16} className="bc-verified" />}</b><small>{x.preview}</small></span>
                <span className="bc-conv-meta"><small>{x.time}</small>{x.unread > 0 && !read.has(x.id) && <em>{x.unread}</em>}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bc-chat">
          <div className="bc-chat-head">
            <img src={img(c.pic)} alt="" />
            <div><b>{c.name} {c.verified && <I n="verified" size={20} className="bc-verified" />}</b><small><i className="dot green" /> Active now</small></div>
            <span className="bc-grow-space" />
            <button aria-label="Call"><I n="phone" size={22} /></button>
            <button aria-label="Video call"><I n="video" size={24} /></button>
            <button aria-label="More"><I n="more" size={22} /></button>
          </div>
          <div className="bc-chat-body">
            {msgs.map(m => m.file ? (
              <div key={m.id} className="bc-file"><span className="bc-word">W</span><span><b>{m.file.name}</b><small>{m.file.size}</small></span><I n="download" size={20} /><time>{m.time}</time></div>
            ) : (
              <div key={m.id} className={`bc-bubble-row ${m.me ? "me" : ""}`}>
                {!m.me && <img src={img(c.pic)} alt="" />}
                <div className="bc-bubble"><p>{m.text}</p><time>{m.time} {m.me && <I n="checks" size={15} />}</time></div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="bc-chat-input">
            <div className="bc-chat-field">
              <I n="smile" size={22} />
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." />
              <I n="clip" size={20} /><I n="image" size={20} />
            </div>
            <button className="bc-send" onClick={send} aria-label="Send"><I n="send" size={20} /></button>
          </div>
        </div>
        <aside className="bc-msg-side">
          <div className="bc-card">
            <img className="bc-side-photo" src={img("msg-coffee")} alt="" />
            <h3>Urban Coffee Co. <I n="verified" size={18} className="bc-verified" /></h3>
            <span className="bc-muted">Cafes & Restaurants</span>
            <span className="bc-rating big"><I n="star" size={18} /><b>4.8</b> (245 reviews)</span>
            <button className="bc-btn outline full" onClick={onOpenBusiness}>View Business Profile <I n="arrow" size={15} /></button>
            <h4>Quick Actions</h4>
            {[["share", "Share Business"], ["calendar", "Schedule Meeting"], ["bag", "View Products"], ["message", "Send Enquiry"]].map(([ic, l]) => (
              <button key={l} className="bc-qa" onClick={l === "View Products" ? onOpenBusiness : undefined}><span><I n={ic!} size={17} /></span>{l}</button>
            ))}
          </div>
          <GrowCard title="Grow Your Network" text="Connect with more businesses and unlock new opportunities." cta="Explore Opportunities" icon="trend" />
        </aside>
      </div>
    </div>
  );
}
