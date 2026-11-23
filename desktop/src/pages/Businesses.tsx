import { useState } from "react";
import type { Business, PageKey } from "../data";
import { bcBusinesses } from "../bc/data";
import { I } from "../bc/Icon";
import { Card, CardHead, CatRow, GrowCard, Heart, Hero, img, Pager, Select, Tabs, ViewToggle } from "../bc/ui";

export function Businesses({ allBusinesses, followed, toggleFollow, onCreate, onOpen }: { setPage: (p: PageKey) => void; allBusinesses: Business[]; followed: Set<string>; toggleFollow: (id: string) => void; onCreate: () => void; onOpen: (b: Business) => void }) {
  const [tab, setTab] = useState("All Businesses");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All Categories");
  const [loc, setLoc] = useState("All Locations");
  const [sort, setSort] = useState("Most Relevant");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const find = (id: string) => allBusinesses.find(b => b.id === id) ?? allBusinesses[0];
  let list = bcBusinesses.filter(b => b.name.toLowerCase().includes(q.toLowerCase()) && (cat === "All Categories" || b.category === cat));
  if (tab === "Following") list = list.filter(b => followed.has(b.id));
  if (sort === "Top Rated") list = [...list].sort((a, b) => b.rating - a.rating);
  return (
    <div className="bc-page">
      <Hero title="Businesses" text={<>Discover and connect with amazing businesses<br />in your community.</>} image="hero-biz" height={148} />
      <div className="bc-cols">
        <div className="bc-main">
          <Tabs value={tab} onChange={setTab} items={[{ label: "All Businesses", icon: "building" }, { label: "Verified Businesses", icon: "shield" }, { label: "Featured", icon: "star" }, { label: "My Businesses", icon: "user" }, { label: "Following", icon: "users" }]} />
          <div className="bc-filters">
            <label className="bc-search"><I n="search" size={20} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search businesses..." /></label>
            <Select value={cat} onChange={setCat} options={["All Categories", ...bcBusinesses.map(b => b.category)]} />
            <Select value={loc} onChange={setLoc} options={["All Locations", "Nairobi, Kenya", "Mombasa, Kenya", "Kisumu, Kenya"]} />
            <button className="bc-btn solid filter" onClick={onCreate}><I n="filter" size={16} /> Filter</button>
            <ViewToggle value={view} onChange={setView} />
          </div>
          <div className={`bc-grid three ${view}`}>
            {list.map(b => (
              <article key={b.id} className="bc-biz-card plain">
                <div className="bc-photo" style={{ backgroundImage: `url(${img("biz-" + b.id)})` }}><Heart /></div>
                <div className="bc-biz-id">
                  <img className="bc-logo" src={img("logo-" + b.id)} alt="" />
                  <div><h3>{b.name}</h3><span>{b.category}</span></div>
                </div>
                <div className="bc-meta"><span className="bc-rating"><I n="star" size={15} /><b>{b.rating}</b> ({b.reviews} reviews)</span><i>|</i><span><I n="users" size={14} /> <b>{b.followers}</b> followers</span></div>
                <div className="bc-loc"><I n="pin" size={14} /> Nairobi, Kenya</div>
                <div className="bc-actions">
                  <button className={`bc-btn outline ${followed.has(b.id) ? "on" : ""}`} onClick={() => toggleFollow(b.id)}>{followed.has(b.id) ? "Following" : "Follow"}</button>
                  <button className="bc-btn outline" onClick={() => onOpen(find(b.id))}>View Profile <I n="arrow" size={14} /></button>
                </div>
              </article>
            ))}
          </div>
          {list.length === 0 && <p className="bc-empty">No businesses match your search.</p>}
          <Pager total={48} per={6} noun="businesses" page={page} onPage={setPage} />
        </div>
        <aside className="bc-aside">
          <div className="bc-sort-top"><Select label="Sort by:" value={sort} onChange={setSort} options={["Most Relevant", "Top Rated", "Newest"]} /></div>
          <Card>
            <CardHead icon={<I n="trophy" size={20} style={{ color: "#0b8f4d" }} />} title="Top Rated Businesses" onAll={() => setSort("Top Rated")} small />
            {["urban", "tech", "greenleaf"].map((id, i) => { const b = bcBusinesses.find(x => x.id === id)!; return (
              <button key={id} className="bc-rank" onClick={() => onOpen(find(id))}>
                <em>{i + 1}</em><img className="bc-logo md" src={img("logo-" + id)} alt="" />
                <span><b>{b.name}</b><small><I n="star" size={14} style={{ color: "#f5a623" }} /> <strong className="gold">{b.rating}</strong> | {b.followers} followers</small></span>
              </button>); })}
          </Card>
          <Card>
            <CardHead icon={<I n="briefcase" size={19} />} title="Business Categories" onAll={() => setCat("All Categories")} small />
            <CatRow color="#2b3fa8" icon="bag" label="Retail & Shopping" count={245} />
            <CatRow color="#e8851a" icon="flame" label="Food & Beverages" count={210} />
            <CatRow color="#2c63d6" icon="shield" label="Technology" count={187} />
            <CatRow color="#e0364f" icon="heartFill" label="Health & Wellness" count={143} />
            <CatRow color="#f08c12" icon="building" label="Construction" count={120} />
          </Card>
          <GrowCard title="Grow Your Business" text="Showcase your business, reach more customers and unlock new opportunities." cta="Get Started" onClick={onCreate} />
        </aside>
      </div>
    </div>
  );
}
