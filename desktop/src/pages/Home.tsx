import { useState } from "react";
import type { PageKey } from "../data";
import { I } from "../bc/Icon";
import { Card, CardHead, Hero, img, Select } from "../bc/ui";

type Post = { id: number; text: string; mine: boolean };

export function Home({ setPage, onPost, onBusiness, onOpportunity }: { setPage: (p: PageKey) => void; onPost: (text: string) => Promise<void>; onBusiness: () => void; onProduct: () => void; onOpportunity: () => void }) {
  const [tab, setTab] = useState("For You");
  const [sort, setSort] = useState("Latest");
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState(false);
  const [follow, setFollow] = useState<Set<string>>(new Set());
  const [err, setErr] = useState("");
  const post = async () => {
    if (!draft.trim()) return;
    try { await onPost(draft.trim()); setPosts(p => [{ id: Date.now(), text: draft.trim(), mine: true }, ...p]); setDraft(""); setErr(""); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not post."); }
  };
  const tog = (n: string) => setFollow(s => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; });
  return (
    <div className="bc-page">
      <Hero title="Welcome back," accent="Kester!" text={<>Connect with businesses, grow your network<br />and discover new opportunities.</>} image="hero-home" height={216}>
        <button className="bc-btn white" onClick={() => setPage("discover")}>Explore BizConnect <I n="arrow" size={16} /></button>
        <div className="bc-impact">
          <div className="bc-impact-head"><I n="trend" size={30} /> <b>Your Business Impact</b><span className="bc-impact-up"><I n="up" size={14} /></span></div>
          <div className="bc-impact-row"><div><strong>1.2K</strong><span>Profile Views</span></div><div><strong>245</strong><span>Followers</span></div><div><strong>68</strong><span>Enquiries</span></div></div>
        </div>
      </Hero>
      <div className="bc-cols home">
        <div className="bc-main">
          <div className="bc-tabs boxed">
            {[["For You", "star"], ["Following", "users"], ["Businesses", "building"], ["Opportunities", "briefcase"], ["Community", "users"]].map(([l, ic]) => (
              <button key={l} className={tab === l ? "on" : ""} onClick={() => { setTab(l!); if (l === "Businesses") setPage("businesses"); if (l === "Opportunities") setPage("opportunities"); }}><I n={ic!} size={19} /> {l}</button>
            ))}
            <span className="bc-grow-space" />
            <Select label="Sort by:" value={sort} onChange={setSort} options={["Latest", "Popular"]} />
          </div>
          <div className="bc-home-grid">
            <div className="bc-home-left">
              <Card>
                <CardHead icon={<I n="chart" size={20} style={{ color: "#0b8f4d" }} />} title="Quick Stats" />
                <button className="bc-link abs" onClick={() => setPage("analytics")}>View Details <I n="arrow" size={15} /></button>
                <div className="bc-stats">
                  <div className="s1"><I n="eye" size={26} /><strong>12.5K</strong><span>Profile Views</span></div>
                  <div className="s2"><I n="users" size={24} /><strong>2.4K</strong><span>Followers</span></div>
                  <div className="s3"><I n="message" size={24} /><strong>892</strong><span>Enquiries</span></div>
                  <div className="s4"><I n="heartFill" size={24} /><strong>1.8K</strong><span>Engagement</span></div>
                </div>
              </Card>
              <Card>
                <CardHead icon={<I n="flame" size={20} style={{ color: "#f0531c" }} />} title="Trending Businesses" onAll={() => setPage("businesses")} />
                {[["urban", "Urban Coffee Co.", "24.5K"], ["tech", "TechSolutions Ltd", "18.7K"], ["buildpro", "BuildPro Services", "15.2K"]].map(([id, n, f]) => (
                  <div key={id} className="bc-rank compact">
                    <img className="bc-logo md" src={img("logo-" + id)} alt="" />
                    <span onClick={onBusiness}><b>{n}</b><small>{f} followers</small></span>
                    <button className={`bc-btn mint sm ${follow.has(n!) ? "on" : ""}`} onClick={() => tog(n!)}>{follow.has(n!) ? "Following" : "Follow"}</button>
                  </div>
                ))}
              </Card>
            </div>
            <div className="bc-home-feed">
              <Card className="bc-composer">
                <div className="bc-composer-row">
                  <img className="bc-avatar" src={img("kester")} alt="" />
                  <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && void post()} placeholder="Share something with your community..." />
                </div>
                <div className="bc-composer-row actions">
                  <button className="bc-chip-btn" onClick={() => setDraft(d => d + " 📷")}><I n="photo" size={18} style={{ color: "#0b8f4d" }} /> Photo</button>
                  <button className="bc-chip-btn" onClick={() => setDraft(d => d + " 🎥")}><I n="videoFill" size={18} style={{ color: "#0b8f4d" }} /> Video</button>
                  <button className="bc-chip-btn" onClick={onOpportunity}><I n="calendar" size={17} style={{ color: "#0b8f4d" }} /> Event</button>
                  <button className="bc-btn dark post" onClick={() => void post()}><I n="send" size={17} /> Post</button>
                </div>
                {err && <p className="bc-err">{err}</p>}
              </Card>
              {posts.map(p => (
                <Card key={p.id} className="bc-post">
                  <div className="bc-post-head"><img className="bc-avatar" src={img("kester")} alt="" /><div><b>Kester Madanga</b><small>Just now • Business Owner</small></div></div>
                  <p>{p.text}</p>
                </Card>
              ))}
              <Card className="bc-post">
                <div className="bc-post-head">
                  <img className="bc-logo md" src={img("logo-tech")} alt="" />
                  <div><b onClick={onBusiness}>TechSolutions Ltd <I n="verified" size={16} className="bc-verified" /></b><small>2 hours ago • Business</small></div>
                  <button className="bc-more-o" aria-label="More"><span /></button>
                </div>
                <p>Excited to announce our new cloud solutions designed to help Kenyan businesses grow faster and work smarter. <a>#Innovation</a> <a>#BusinessGrowth</a></p>
                <img className="bc-post-img" src={img("post")} alt="TechSolutions building" />
                <div className="bc-post-actions">
                  <button className={liked ? "liked" : ""} onClick={() => setLiked(!liked)}><I n="thumb" size={19} /> {liked ? 125 : 124}</button>
                  <button><I n="comment" size={19} /> 24</button>
                  <button><I n="share" size={19} /> Share</button>
                  <button><I n="moreH" size={20} /></button>
                  <button className="end"><I n="moreH" size={20} /></button>
                </div>
              </Card>
            </div>
          </div>
          <div className="bc-banner-grow">
            <I n="trend" size={40} />
            <div><b>Grow Your Business with BizConnect</b><span>Get more visibility, build your brand and find new opportunities.</span></div>
            <button className="bc-btn dark" onClick={() => setPage("analytics")}>Explore Growth Tools <I n="arrow" size={15} /></button>
          </div>
        </div>
        <aside className="bc-aside home">
          <Card>
            <CardHead icon={<I n="briefcase" size={22} style={{ color: "#0b8f4d" }} />} title="Top Opportunities" onAll={() => setPage("opportunities")} />
            {[["Partnership Opportunity", "Collaborate on digital marketing projects", "Partnership", "green", "2 days ago"], ["Supplier Opportunity", "Looking for reliable suppliers in Kenya", "Supplier", "blue", "3 days ago"], ["Mentorship Opportunity", "Mentor young entrepreneurs", "Mentorship", "purple", "5 days ago"]].map(([t, d, tag, c, ago], i) => (
              <button key={t} className="bc-topopp" onClick={() => setPage("opportunities")}>
                <img src={img("home-opp-" + (i + 1))} alt="" />
                <span><b>{t}</b><small>{d}</small><span className="bc-topopp-meta"><em className={`bc-chip ${c}`}>{tag}</em> {ago}</span></span>
              </button>
            ))}
          </Card>
          <Card>
            <CardHead icon={<I n="bolt" size={20} style={{ color: "#0b8f4d" }} />} title="Recent Activity" onAll={() => setPage("notifications")} />
            <div className="bc-act"><img className="bc-avatar sm" src={img("amina")} alt="" /><i className="dot red" /><span><b>Amina Wanjiru</b> liked your post<small>1 min ago</small></span><I n="heartFill" size={15} style={{ color: "#e5304a" }} /></div>
            <div className="bc-act"><img className="bc-logo sm" src={img("logo-tech")} alt="" /><i className="dot green" /><span><b>TechSolutions Ltd</b> posted a new product<small>5 mins ago</small></span><I n="bag" size={15} style={{ color: "#18a957" }} /></div>
            <div className="bc-act"><img className="bc-avatar sm" src={img("james")} alt="" /><i className="dot green" /><span><b>James Otieno</b> started following you<small>10 mins ago</small></span><I n="users" size={17} style={{ color: "#18a957" }} /></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
