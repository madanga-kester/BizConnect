import { Icon } from "../components/icons";
import { BusinessCard } from "../components/BusinessCard";
import { CityHero, Pill, SectionHeading } from "../components/ui";
import type { Business, PageKey } from "../data";

export function Businesses({ setPage, allBusinesses, followed, toggleFollow, onCreate, onOpen }: { setPage: (p: PageKey) => void; allBusinesses: Business[]; followed: Set<string>; toggleFollow: (id: string) => void; onCreate: () => void; onOpen: (b: Business) => void }) {
  return (
    <>
      <CityHero title="Businesses" description="Discover and connect with amazing businesses in your community." kicker="YOUR LOCAL NETWORK" hero="hero-businesses" action="Create a business" onAction={onCreate}/>
      <div className="filter-row large">
        <Pill>All businesses</Pill>
        <span className="result-count">{allBusinesses.length} local examples</span>
      </div>
      <div className="content-with-aside">
        <div className="business-grid">
          {allBusinesses.map(b => <BusinessCard key={b.id} business={b} followed={followed.has(b.id)} onFollow={() => toggleFollow(b.id)} onOpen={() => onOpen(b)}/>)}
        </div>
        <aside className="side-panel">
          <SectionHeading title="Manage your presence"/>
          <p className="muted">Keep your business profile fresh and easy to trust.</p>
          <button className="button button-primary full" onClick={onCreate}>Add business<Icon name="plus"/></button>
          <button className="button button-outline full" onClick={() => setPage("analytics")}>View analytics<Icon name="chart"/></button>
        </aside>
      </div>
    </>
  );
}
