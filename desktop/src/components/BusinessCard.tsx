import { Icon } from "./icons";
import { Avatar } from "./ui";
import type { Business } from "../data";

export function BusinessCard({ business, followed, onFollow, onOpen }: { business: Business; followed: boolean; onFollow: () => void; onOpen: () => void }) {
  return (
    <article className="business-card">
      <div className="business-cover" style={{ background: `linear-gradient(135deg,${business.color},#164f4b)` }}>
        <span className="cover-lines"/>
        <Avatar initials={business.initials} color={business.color} size="lg"/>
      </div>
      <div className="business-body">
        <div className="business-title">
          <b>{business.name}</b>
          {business.verified && <span className="verified"><Icon name="check"/></span>}
        </div>
        <span className="muted">{business.category}</span>
        <span className="muted">{business.location}</span>
        <div className="rating"><Icon name="star"/> {business.rating} <span>({business.reviews})</span></div>
        <div className="card-actions">
          <button className="button button-outline" onClick={onOpen}>View profile</button>
          <button className="button button-soft" onClick={onFollow}>{followed ? "Following" : "Follow"}</button>
        </div>
      </div>
    </article>
  );
}
