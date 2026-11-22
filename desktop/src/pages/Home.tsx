import { useState } from "react";
import { Icon } from "../components/icons";
import { Avatar, Banner, CityHero, Pill, SectionHeading, StatCard } from "../components/ui";
import { useAction } from "../hooks/useAction";
import { activities, opportunities as seedOpportunities, type PageKey } from "../data";

export function Home({ setPage, onPost, onBusiness, onProduct, onOpportunity }: { setPage: (p: PageKey) => void; onPost: (text: string) => Promise<void>; onBusiness: () => void; onProduct: () => void; onOpportunity: () => void }) {
  const [text, setText] = useState("");
  const action = useAction();
  const post = async () => {
    if (!text.trim()) {
      action.setStatus({ kind: "error", message: "Write something before posting." });
      return;
    }
    try {
      await onPost(text.trim());
      setText("");
      action.setStatus({ kind: "success", message: "Post created in local demo state." });
    } catch (e) {
      action.setStatus({ kind: "error", message: e instanceof Error ? e.message : "Post failed." });
    }
  };
  return (
    <>
      <Banner status={action.status} onDismiss={() => action.setStatus(null)}/>
      <CityHero title="Welcome back, Kester!" description="Connect with businesses, grow your network and discover new opportunities." hero="hero-home"/>
      <div className="subnav">
        <button className="active">For You</button>
        <button onClick={() => setPage("discover")}>Following</button>
        <button onClick={() => setPage("businesses")}>Businesses</button>
        <button onClick={() => setPage("opportunities")}>Opportunities</button>
        <button onClick={() => setPage("messages")}>Community</button>
      </div>
      <div className="home-grid">
        <main>
          <SectionHeading title="Quick Stats" action="View Details" onAction={() => setPage("analytics")}/>
          <div className="stats-grid">
            <StatCard label="Profile Views" value="12.5K" icon="chart"/>
            <StatCard label="Followers" value="2.4K" icon="users"/>
            <StatCard label="Enquiries" value="892" icon="message"/>
            <StatCard label="Engagement" value="1.8K" icon="heart"/>
          </div>
          <div className="composer">
            <Avatar initials="KM" color="#d17a49"/>
            <div className="composer-input">
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share something with your community..." aria-label="Post text"/>
              <div className="composer-actions">
                <button onClick={onProduct}>Photo</button>
                <button onClick={onProduct}>Video</button>
                <button onClick={onOpportunity}>Event</button>
                <button className="button button-primary" onClick={() => void post()}>Post<Icon name="arrow"/></button>
              </div>
            </div>
          </div>
          <article className="feed-card">
            <div className="feed-head">
              <Avatar initials="TS" color="#277cb4"/>
              <div><b>TechSolutions Ltd</b><span>2 hours ago · Business</span></div>
              <button className="more" aria-label="More post actions"><Icon name="sliders"/></button>
            </div>
            <p>Excited to announce our new cloud solutions designed to help Kenyan businesses grow faster and smarter. <b>#Innovation #BusinessGrowth</b></p>
            <div className="feed-image tech-image"><span>TechSolutions<small>Empowering businesses through technology</small></span></div>
            <div className="feed-actions">
              <button><Icon name="heart"/> 124</button>
              <button><Icon name="message"/> 24</button>
              <button><Icon name="users"/> Share</button>
              <button><Icon name="sliders"/></button>
            </div>
          </article>
        </main>
        <aside className="right-rail">
          <SectionHeading title="Top Opportunities" action="See all" onAction={() => setPage("opportunities")}/>
          {seedOpportunities.slice(0, 3).map(o => (
            <button className="recent-row" key={o.id} onClick={onOpportunity}>
              <span className="tiny-art opportunity-thumb"/>
              <span><b>{o.title}</b><small>{o.description}</small><small><Pill tone="mint">{o.category}</Pill> {o.posted}</small></span>
            </button>
          ))}
          <SectionHeading title="Recent Activity" action="See all" onAction={() => setPage("notifications")}/>
          {activities.map(a => (
            <div className="activity" key={a.title}>
              <span className="activity-dot" style={{ background: a.color }}/>
              <div><b>{a.title}</b><span>{a.time}</span></div>
            </div>
          ))}
          <div className="grow-banner">
            <strong>Grow Your Business with Mabiz</strong>
            <span>Get more visibility, build your brand and find new opportunities.</span>
            <button className="button button-primary" onClick={() => setPage("analytics")}>Explore Growth Tools<Icon name="arrow"/></button>
          </div>
        </aside>
      </div>
    </>
  );
}
