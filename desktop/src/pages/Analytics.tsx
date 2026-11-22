import { useState } from "react";
import { api, apiMode } from "../api";
import { Banner, Pill, SectionHeading, StatCard } from "../components/ui";
import { useAction } from "../hooks/useAction";
import { activities } from "../data";

export function Analytics({ businessId }: { businessId: string }) {
  const [range, setRange] = useState("30d");
  const action = useAction();
  const load = async (r: string) => {
    setRange(r);
    if (apiMode === "api") await action.run(() => api.analytics(businessId, r), "Analytics refreshed");
  };
  return (
    <>
      <Banner status={action.status} onDismiss={() => action.setStatus(null)}/>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">BUSINESS PERFORMANCE</div>
          <h1>Analytics</h1>
          <p>Turn attention into momentum with a clear view of your growth.</p>
        </div>
        <div className="range-switch">
          {["7d", "30d", "90d"].map(x => <button className={range === x ? "active" : ""} onClick={() => void load(x)} key={x}>{x}</button>)}
        </div>
      </div>
      <div className="analytics-banner">
        <div>
          <Pill>Urban Coffee Co. · Owner view</Pill>
          <h2>Your business is growing steadily.</h2>
          <p>Profile visits and enquiries are both up compared with the previous period.</p>
        </div>
        <div className="analytics-spark">
          {[35, 48, 42, 66, 58, 76, 93].map(h => <span style={{ height: `${h}%` }} key={h}/>)}
        </div>
      </div>
      <div className="stats-grid analytics-stats">
        <StatCard label="Profile views" value="12,540" change="+18.4%" icon="chart"/>
        <StatCard label="Engagement" value="64.8%" change="+9.2%" icon="heart"/>
        <StatCard label="Enquiries" value="892" change="+8.7%" icon="message"/>
        <StatCard label="New followers" value="245" change="+16.1%" icon="plus"/>
      </div>
      <div className="analytics-grid">
        <section className="panel">
          <SectionHeading title={`Profile activity · ${range}`} action="Compare range" onAction={() => void load(range === "30d" ? "90d" : "30d")}/>
          <div className="chart">
            <div className="chart-grid"/>
            {[30, 44, 38, 52, 48, 72, 64, 79, 71, 88, 83, 96].map((h, i) => <span key={i} style={{ height: `${h}%` }}/>)}
          </div>
        </section>
        <section className="panel">
          <SectionHeading title="Top content"/>
          {activities.map((a, i) => (
            <div className="top-content" key={a.title}>
              <span>{i + 1}</span>
              <div>
                <b>{a.title}</b>
                <small>{["2,840 views · 128 likes", "1,920 views · 84 likes", "1,340 views · 52 likes"][i]}</small>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
