import { useState } from "react";
import type { Business, PageKey } from "../data";
import { bcBusinesses } from "../bc/data";
import { I } from "../bc/Icon";
import { Card, CardHead, GrowCard, Heart, Hero, HeroSearch, img, Pager, Select, Tabs, ViewToggle } from "../bc/ui";

export function Discover({ setPage, allBusinesses, followed, toggleFollow, onOpen }: { setPage: (p: PageKey) => void; allBusinesses: Business[]; followed: Set<string>; toggleFollow: (id: string) => void; onOpen: (b: Business) => void }) {
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const [cat, setCat] = useState("All Categories");
  const [loc, setLoc] = useState("All Locations");
  const [sort, setSort] = useState("Most Relevant");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setP] = useState(1);
  const find = (id: string) => allBusinesses.find(b => b.id === id) ?? allBusinesses[0];
  const list = bcBusinesses.filter(b => (b.name + b.category).toLowerCase().includes(q.toLowerCase()) && (cat === "All Categories" || b.category === cat));
  const tab = (t: string) => { if (t === "Products & Services") setPage("catalog"); else if (t === "Opportunities") setPage("opportunities"); else if (t === "Communities") setPage("messages"); };
  return (
    <div className="bc-page">
      <Hero title="Discover" text={<>Explore businesses, products, services and opportunities<br />in your community.</>} image="hero-disc" height={195}>
        <HeroSearch placeholder="Search for businesses, products or services..." onSearch={setQ} />
      </Hero>
      <div className="bc-cols">
        <div className="bc-main">
          <Tabs value="Businesses" onChange={tab} items={[{ label: "Businesses", icon: "briefcase" }, { label: "Products & Services", icon: "box" }, { label: "Opportunities", icon: "handshake" }, { label: "People", icon: "users" }, { label: "Communities", icon: "users" }]} />
          <div className="bc-filters">
            <Select tone="mint" value={cat} onChange={setCat} options={["All Categories", ...bcBusinesses.map(b => b.category)]} />
            <Select value={loc} onChange={setLoc} options={["All Locations", "Nairobi, Kenya", "Mombasa, Kenya"]} />
            <span className="bc-grow-space" />
            <Select label="Sort by:" value={sort} onChange={setSort} options={["Most Relevant", "Top Rated", "Newest"]} />
            <ViewToggle value={view} onChange={setView} />
          </div>
          <div className={`bc-grid three ${view}`}>
            {list.map(b => (
              <article key={b.id} className="bc-biz-card">
                <div className="bc-photo tall" style={{ backgroundImage: `url(${img("biz-" + b.id)})` }}><Heart /></div>
                <div className="bc-biz-id">
                  <img className="bc-logo" src={img("logo-" + b.id)} alt="" />
                  <div><h3>{b.name} <I n="verified" size={16} className="bc-verified" /></h3><span>{b.category}</span></div>
                </div>
                <div className="bc-meta"><span className="bc-rating"><I n="star" size={15} /><b>{b.rating}</b> ({b.reviews} reviews)</span><span><I n="users" size={14} /> <b>{b.followers}</b> followers</span></div>
                <div className="bc-actions">
                  <button className="bc-btn solid" onClick={() => onOpen(find(b.id))}>View Profile</button>
                  <button className={`bc-btn outline ${followed.has(b.id) ? "on" : ""}`} onClick={() => toggleFollow(b.id)}>{followed.has(b.id) ? "Following" : "Follow"}</button>
                </div>
              </article>
            ))}
          </div>
          {list.length === 0 && <p className="bc-empty">No results for “{q}”.</p>}
          <Pager total={24} per={6} noun="results" page={page} onPage={setP} />
        </div>
        <aside className="bc-aside">
          <Card>
            <CardHead icon={<I n="trend" size={22} />} title="Trending Businesses" onAll={() => setPage("businesses")} />
            {[["tech", "12.5K"], ["urban", "11.8K"], ["greenleaf", "10.3K"]].map(([id, f], i) => { const b = bcBusinesses.find(x => x.id === id)!; return (
              <div key={id} className="bc-rank">
                <em>{i + 1}</em><img className="bc-logo md" src={img("logo-" + id)} alt="" />
                <span onClick={() => onOpen(find(id!))}><b>{b.name}</b><small>{f} followers</small></span>
                <button className={`bc-btn outline sm ${followed.has(id!) ? "on" : ""}`} onClick={() => toggleFollow(id!)}>{followed.has(id!) ? "Following" : "Follow"}</button>
              </div>); })}
          </Card>
          <Card>
            <CardHead icon={<I n="trophy" size={21} />} title="Popular Opportunities" onAll={() => setPage("opportunities")} />
            {[["handshake", "#2f6fd6", "Business Partnership", "Tech & Innovation", "Partnership"], ["box", "#c98a3b", "Supplier Opportunity", "Retail Supplies", "Supplier"], ["megaphone", "#2f6fd6", "Collaboration Request", "Marketing & Media", "Collaboration"]].map(([ic, c, t, s, tag]) => (
              <button key={t} className="bc-pop" onClick={() => setPage("opportunities")}>
                <span className="bc-pop-ico" style={{ color: c }}><I n={ic!} size={22} /></span>
                <span><b>{t}</b><small>{s}</small></span>
                <em className="bc-chip green">{tag}</em>
              </button>
            ))}
          </Card>
          <GrowCard title="Grow Your Business" text="Get discovered, connect with clients and expand your network." cta="Explore Growth Tools" onClick={() => setPage("analytics")} />
        </aside>
      </div>
    </div>
  );
}
