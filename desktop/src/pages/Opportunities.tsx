import { Icon } from "../components/icons";
import { CityHero, Pill } from "../components/ui";
import { opportunities as seedOpportunities, type Opportunity } from "../data";

export function Opportunities({ onDetail, onCreate }: { onDetail: (o: Opportunity) => void; onCreate: () => void }) {
  return (
    <>
      <CityHero title="Business Opportunities" description="Discover and create new opportunities to grow your business through partnerships, collaborations and more." kicker="FIND YOUR NEXT MOVE" hero="hero-business-opportunities" action="Post an opportunity" onAction={onCreate}/>
      <div className="opportunity-grid">
        {seedOpportunities.map(o => (
          <article className="opportunity-card" key={o.id}>
            <div className="opportunity-cover">
              <Pill>{o.category}</Pill>
              <span className="opportunity-symbol"><Icon name="arrow"/></span>
            </div>
            <div className="opportunity-body">
              <b>{o.title}</b>
              <span>{o.description}</span>
              <div className="tags">{o.tags.map(t => <Pill tone="slate" key={t}>{t}</Pill>)}</div>
              <div className="opp-meta"><span>{o.posted}</span><strong>{o.budget}</strong></div>
              <button className="button button-outline full" onClick={() => onDetail(o)}>View opportunity<Icon name="arrow"/></button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
