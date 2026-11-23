import { useState } from "react";
import { opportunities as seed, type Opportunity } from "../data";
import { bcOpps } from "../bc/data";
import { I } from "../bc/Icon";
import { Card, CardHead, CatRow, GrowCard, Heart, Hero, img, Pager, Select, Tabs, ViewToggle } from "../bc/ui";

export function Opportunities({ onDetail, onCreate }: { onDetail: (o: Opportunity) => void; onCreate: () => void }) {
  const [tab, setTab] = useState("All Opportunities");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All Categories");
  const [loc, setLoc] = useState("All Locations");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const map: Record<string, string> = { Partnerships: "Partnerships", Collaboration: "Collaboration", Supplier: "Supplier", Distribution: "Distribution", Mentorship: "Mentorship", Networking: "Networking" };
  const list = bcOpps.filter(o => (tab === "All Opportunities" || o.type === map[tab]) && (cat === "All Categories" || o.type === cat) && (o.title + o.text).toLowerCase().includes(q.toLowerCase()));
  const open = (o: typeof bcOpps[number]) => onDetail({ ...(seed[(Number(o.id) - 1) % seed.length]!), id: "o" + o.id, title: o.title, description: o.text, category: o.type });
  return (
    <div className="bc-page">
      <Hero title="Business" accent="Opportunities" text={<>Discover and create new opportunities to grow your business<br />through partnerships, collaborations and more.</>} image="hero-opp" height={136} />
      <div className="bc-cols">
        <div className="bc-main">
          <Tabs value={tab} onChange={setTab} items={[{ label: "All Opportunities", icon: "briefcase" }, { label: "Partnerships", icon: "users" }, { label: "Collaboration", icon: "handshake" }, { label: "Supplier", icon: "box" }, { label: "Distribution", icon: "truck" }, { label: "Mentorship", icon: "cap" }, { label: "Networking", icon: "users" }]} />
          <div className="bc-filters">
            <label className="bc-search"><I n="search" size={20} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search opportunities..." /></label>
            <Select value={cat} onChange={setCat} options={["All Categories", "Partnerships", "Collaboration", "Supplier", "Distribution", "Mentorship", "Networking"]} />
            <Select value={loc} onChange={setLoc} options={["All Locations", "Nairobi, Kenya", "Mombasa, Kenya"]} />
            <button className="bc-btn solid filter" onClick={() => { setQ(""); setCat("All Categories"); setTab("All Opportunities"); }}><I n="filter" size={16} /> Filter</button>
            <ViewToggle value={view} onChange={setView} />
          </div>
          <div className={`bc-grid four ${view}`}>
            {list.map(o => (
              <article key={o.id} className="bc-opp-card">
                <div className="bc-photo opp" style={{ backgroundImage: `url(${img("opp-" + o.id)})` }}><Heart /></div>
                <div className="bc-opp-body">
                  <h3>{o.title.replace(" – ", "\n– ")}</h3>
                  <p>{o.text}</p>
                  <div className="bc-loc"><I n="pin" size={14} /> Nairobi, Kenya</div>
                  <div className="bc-loc"><I n="calendar" size={13} /> Expires: {o.expires}</div>
                  <div className="bc-opp-foot"><span className="bc-rating"><I n="star" size={15} /><b>{o.rating}</b> ({o.enquiries} enquiries)</span><button className="bc-btn outline xs" onClick={() => open(o)}>View Details <I n="arrow" size={13} /></button></div>
                </div>
              </article>
            ))}
          </div>
          {list.length === 0 && <p className="bc-empty">No opportunities match.</p>}
          <Pager total={42} per={8} noun="opportunities" page={page} onPage={setPage} />
        </div>
        <aside className="bc-aside narrow">
          <Card className="mintish">
            <CardHead icon={<I n="star" size={19} />} title="Featured Opportunities" onAll={() => setTab("All Opportunities")} small />
            {[[bcOpps[0]!, "Dec 30, 2026"], [bcOpps[1]!, "Dec 20, 2026"], [bcOpps[2]!, "Dec 28, 2026"]].map(([o, d], i) => (
              <button key={i} className="bc-feat" onClick={() => open(o as typeof bcOpps[number])}>
                <em>{i + 1}</em><img src={img("feat-opp-" + (i + 1))} alt="" />
                <span><b>{(o as typeof bcOpps[number]).title}</b><small>Expires: {d as string}</small></span>
              </button>
            ))}
          </Card>
          <Card>
            <CardHead icon={<I n="tag" size={19} />} title="Popular Categories" onAll={() => setCat("All Categories")} small />
            <CatRow color="#11a06a" icon="handshake" label="Partnerships" count={142} />
            <CatRow color="#4a3fd0" icon="users" label="Collaboration" count={118} />
            <CatRow color="#e33a3a" icon="box" label="Supplier" count={97} />
            <CatRow color="#2c63d6" icon="truck" label="Distribution" count={85} />
            <CatRow color="#d18a1c" icon="cap" label="Mentorship" count={71} />
          </Card>
          <GrowCard title="Post an Opportunity" text="Share your business opportunity with the BizConnect community." cta="Create Opportunity" onClick={onCreate} />
        </aside>
      </div>
    </div>
  );
}
