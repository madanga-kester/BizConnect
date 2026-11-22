import { useState } from "react";
import { Icon } from "../components/icons";
import { BusinessCard } from "../components/BusinessCard";
import { Avatar, CityHero, Pill, SectionHeading } from "../components/ui";
import type { Business, PageKey } from "../data";

export function Discover({ setPage, allBusinesses, followed, toggleFollow, onOpen }: { setPage: (p: PageKey) => void; allBusinesses: Business[]; followed: Set<string>; toggleFollow: (id: string) => void; onOpen: (b: Business) => void }) {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const matches = allBusinesses.filter(b => `${b.name} ${b.category} ${b.location}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <CityHero title="Discover" description="Explore businesses, products, services and opportunities in your community." kicker="FIND WHAT MOVES YOU" hero="hero-discover"/>
      <div className="search-panel">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for businesses, products or services..."/>
        <button className="button button-primary" onClick={() => setPage("businesses")}><Icon name="search"/> Search</button>
      </div>
      <div className="discover-tabs">
        <button className="active">Businesses ({matches.length})</button>
        <button onClick={() => setPage("catalog")}>Products & Services</button>
        <button onClick={() => setPage("opportunities")}>Opportunities</button>
      </div>
      <div className="content-with-aside">
        <section>
          <div className="filter-row">
            <Pill>Local matches</Pill>
            <span className="result-count">{matches.length} businesses</span>
          </div>
          <div className="business-grid">
            {matches.map(b => <BusinessCard key={b.id} business={b} followed={followed.has(b.id)} onFollow={() => toggleFollow(b.id)} onOpen={() => onOpen(b)}/>)}
          </div>
        </section>
        <aside className="side-panel">
          <SectionHeading title="Trending businesses"/>
          {allBusinesses.slice(1, 4).map(b => (
            <button className="trend-row link-row" key={b.id} onClick={() => onOpen(b)}>
              <Avatar initials={b.initials} color={b.color} size="sm"/>
              <span><b>{b.name}</b><small>{b.followers} followers</small></span>
              <Icon name="arrow"/>
            </button>
          ))}
        </aside>
      </div>
    </>
  );
}
