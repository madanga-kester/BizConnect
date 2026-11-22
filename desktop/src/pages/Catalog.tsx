import { useState } from "react";
import { Icon } from "../components/icons";
import { CityHero, Pill } from "../components/ui";
import { products as seedProducts, type PageKey, type Product } from "../data";

export function Catalog({ setPage, onDetail }: { setPage: (p: PageKey) => void; onDetail: (p: Product) => void }) {
  const [kind, setKind] = useState("All items");
  const list = seedProducts.filter(p => kind === "All items" || p.kind === kind.slice(0, -1));
  return (
    <>
      <CityHero title="Products & Services" description="Discover and shop quality products and services from trusted businesses in your community." kicker="SHOP LOCAL · SUPPORT BUSINESS" hero="hero-products-services" action="List an item" onAction={() => setPage("businesses")}/>
      <div className="discover-tabs">
        {["All items", "Products", "Services"].map(x => <button key={x} className={kind === x ? "active" : ""} onClick={() => setKind(x)}>{x}</button>)}
      </div>
      <div className="product-grid">
        {list.map(p => (
          <article className="product-card" key={p.id}>
            <div className="product-art" style={{ background: p.accent }}>
              <span className={`art-shape art-${p.image}`}/>
              <button className="heart" onClick={() => onDetail(p)} aria-label={`View ${p.name}`}><Icon name="star"/></button>
              <Pill>{p.kind}</Pill>
            </div>
            <div className="product-body">
              <span className="muted">{p.business}</span>
              <b>{p.name}</b>
              <strong>{p.price}</strong>
              <button className="button button-outline" onClick={() => onDetail(p)}>View details<Icon name="arrow"/></button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
