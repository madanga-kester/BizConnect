import { useState } from "react";
import { products as seed, type PageKey, type Product } from "../data";
import { bcProducts } from "../bc/data";
import { I } from "../bc/Icon";
import { Card, CardHead, CatRow, GrowCard, Heart, Hero, HeroSearch, img, Pager, Select, Tabs, ViewToggle } from "../bc/ui";

export function Catalog({ setPage, onDetail }: { setPage: (p: PageKey) => void; onDetail: (p: Product) => void }) {
  const [tab, setTab] = useState("All Items");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All Categories");
  const [loc, setLoc] = useState("All Locations");
  const [sort, setSort] = useState("Most Popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setP] = useState(1);
  const [cart, setCart] = useState<Set<string>>(new Set());
  let list = bcProducts.filter(p => (tab === "Products" ? p.kind === "Product" : tab === "Services" ? p.kind === "Service" : true) && p.name.toLowerCase().includes(q.toLowerCase()));
  if (tab === "Top Rated" || sort === "Top Rated") list = [...list].sort((a, b) => b.rating - a.rating);
  const detail = (id: string) => onDetail(seed[Number(id) - 1]!);
  return (
    <div className="bc-page">
      <Hero title="Products &" accent="Services" text={<>Discover and shop quality products and services<br />from trusted businesses in your community.</>} image="hero-prod" height={178}>
        <HeroSearch placeholder="Search for products or services..." onSearch={setQ} />
      </Hero>
      <div className="bc-cols">
        <div className="bc-main">
          <Tabs value={tab} onChange={setTab} items={[{ label: "All Items", icon: "grid" }, { label: "Products", icon: "bag" }, { label: "Services", icon: "wrench" }, { label: "Featured", icon: "star" }, { label: "Top Rated", icon: "trophy" }, { label: "My Listings", icon: "tag" }]} />
          <div className="bc-filters">
            <Select tone="mint" value={cat} onChange={setCat} options={["All Categories", "Electronics", "Fashion & Clothing", "Home & Living", "Business Services", "Health & Beauty"]} />
            <Select value={loc} onChange={setLoc} options={["All Locations", "Nairobi, Kenya", "Mombasa, Kenya"]} />
            <span className="bc-grow-space" />
            <Select label="Sort by:" value={sort} onChange={setSort} options={["Most Popular", "Top Rated", "Lowest Price"]} />
            <ViewToggle value={view} onChange={setView} />
          </div>
          <div className={`bc-grid four ${view}`}>
            {list.map(p => (
              <article key={p.id} className="bc-prod-card">
                <div className="bc-photo prod" style={{ backgroundImage: `url(${img("prod-" + p.id)})` }}><Heart /></div>
                <div className="bc-opp-body">
                  <h3>{p.name}</h3>
                  <div className="bc-meta tight"><span className="bc-rating"><I n="star" size={14} /><b>{p.rating}</b> ({p.reviews} reviews)</span><span><I n="users" size={13} /> {p.stat}</span></div>
                  <div className="bc-loc"><I n="pin" size={13} /> Nairobi, Kenya</div>
                  <strong className="bc-price">{p.price}</strong>
                  <div className="bc-actions">
                    {p.kind === "Product"
                      ? <button className="bc-btn dark xs" onClick={() => setCart(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}><I n="cart" size={14} /> {cart.has(p.id) ? "In Cart" : "Add to Cart"}</button>
                      : <button className="bc-btn solid xs" onClick={() => detail(p.id)}>Book Service</button>}
                    <button className="bc-btn outline xs" onClick={() => detail(p.id)}>View Details</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {list.length === 0 && <p className="bc-empty">No items match.</p>}
          <Pager total={42} per={8} noun="items" page={page} onPage={setP} />
        </div>
        <aside className="bc-aside">
          <Card>
            <CardHead icon={<I n="star" size={20} />} title="Featured Products & Services" onAll={() => setTab("Featured")} small />
            {[["Wireless Earbuds", 4.8, "KSh 4,500"], ["Web Development Services", 4.7, "KSh 15,000"], ["Organic Skincare Set", 4.9, "KSh 3,200"]].map(([n, r, pr], i) => (
              <button key={n as string} className="bc-feat big" onClick={() => detail(String(i + 1))}>
                <img src={img("feat-prod-" + (i + 1))} alt="" />
                <span><b>{n}</b><small><I n="star" size={14} style={{ color: "#f5a623" }} /> <strong className="gold">{r}</strong> • {pr}</small></span>
              </button>
            ))}
          </Card>
          <Card>
            <CardHead icon={<I n="bag" size={19} />} title="Popular Categories" onAll={() => setCat("All Categories")} small />
            <CatRow color="#11a06a" icon="box" label="Electronics" count={842} />
            <CatRow color="#e33a3a" icon="bag" label="Fashion & Clothing" count={721} />
            <CatRow color="#4a3fd0" icon="home" label="Home & Living" count={603} />
            <CatRow color="#2c63d6" icon="briefcase" label="Business Services" count={548} />
            <CatRow color="#ef6c1a" icon="heartFill" label="Health & Beauty" count={496} />
          </Card>
          <GrowCard title="Grow Your Business" text="List your products and services, reach more customers." cta="Get Started" icon="trend" onClick={() => setPage("businesses")} />
        </aside>
      </div>
    </div>
  );
}
