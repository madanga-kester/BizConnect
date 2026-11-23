import { useState, type ReactNode } from "react";
import { I } from "./Icon";

export const img = (n: string) => `/bc/${n}.jpg`;

export function Hero({ title, accent, text, image, icon, children, height = 215 }: { title: string; accent?: string; text: ReactNode; image: string; icon?: ReactNode; children?: ReactNode; height?: number }) {
  return (
    <section className="bc-hero" style={{ minHeight: height }}>
      <div className="bc-hero-img" style={{ backgroundImage: `url(${img(image)})` }} />
      <div className="bc-hero-copy">
        {icon && <div className="bc-hero-icon">{icon}</div>}
        <div>
          <h1>{title}{accent && <> <span>{accent}</span></>}</h1>
          <p>{text}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

export function HeroSearch({ placeholder, onSearch }: { placeholder: string; onSearch?: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <form className="bc-hero-search" onSubmit={e => { e.preventDefault(); onSearch?.(q); }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} />
      <button type="submit" aria-label="Search"><I n="search" size={18} /></button>
    </form>
  );
}

export function Tabs({ items, value, onChange }: { items: { label: string; icon: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="bc-tabs">
      {items.map(t => (
        <button key={t.label} className={value === t.label ? "on" : ""} onClick={() => onChange(t.label)}>
          <I n={t.icon} size={19} /> {t.label}
        </button>
      ))}
    </div>
  );
}

export function Select({ label, options, value, onChange, tone }: { label?: string; options: string[]; value: string; onChange: (v: string) => void; tone?: "mint" }) {
  return (
    <label className={`bc-select ${tone === "mint" ? "mint" : ""}`}>
      {label && <span className="bc-sort-label">{label}</span>}
      <span className="bc-select-box">
        <select value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o}>{o}</option>)}</select>
        <I n="chevDown" size={16} />
      </span>
    </label>
  );
}

export function ViewToggle({ value, onChange }: { value: "grid" | "list"; onChange: (v: "grid" | "list") => void }) {
  return (
    <div className="bc-view">
      <button className={value === "grid" ? "on" : ""} onClick={() => onChange("grid")} aria-label="Grid view"><I n="grid" size={17} /></button>
      <button className={value === "list" ? "on" : ""} onClick={() => onChange("list")} aria-label="List view"><I n="list" size={18} /></button>
    </div>
  );
}

export function Pager({ total, per, noun, page, onPage }: { total: number; per: number; noun: string; page: number; onPage: (p: number) => void }) {
  const start = (page - 1) * per + 1;
  return (
    <div className="bc-pager">
      <div className="bc-pages">
        {[1, 2, 3, 4, 5].map(p => <button key={p} className={p === page ? "on" : ""} onClick={() => onPage(p)}>{p}</button>)}
        <button className="next" onClick={() => onPage(page < 5 ? page + 1 : 1)} aria-label="Next page"><I n="chevRight" size={16} /></button>
      </div>
      <span>Showing {start} – {start + per - 1} of {total} {noun}</span>
    </div>
  );
}

export function Heart({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button className={`bc-heart ${on ? "on" : ""}`} onClick={e => { e.stopPropagation(); setOn(!on); }} aria-label={on ? "Remove from saved" : "Save"}>
      {on && <I n="heartFill" size={26} />}
    </button>
  );
}

export function Rating({ value, count, noun = "reviews" }: { value: number; count: number; noun?: string }) {
  return <span className="bc-rating"><I n="star" size={15} /><b>{value}</b> ({count} {noun})</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bc-card ${className}`}>{children}</div>;
}

export function CardHead({ icon, title, onAll, small }: { icon: ReactNode; title: string; onAll?: () => void; small?: boolean }) {
  return (
    <div className={`bc-card-head ${small ? "small" : ""}`}>
      <span className="bc-card-title">{icon}{title}</span>
      {onAll && <button className="bc-link" onClick={onAll}>See all <I n="arrow" size={15} /></button>}
    </div>
  );
}

export function GrowCard({ title, text, cta, onClick, icon = "rocket" }: { title: string; text: string; cta: string; onClick?: () => void; icon?: string }) {
  return (
    <div className="bc-grow">
      <div className="bc-grow-copy">
        <b><I n={icon} size={20} /> {title}</b>
        <p>{text}</p>
        <button className="bc-btn solid" onClick={onClick}>{cta} <I n="arrow" size={16} /></button>
      </div>
      <img src={img("growth")} alt="" />
    </div>
  );
}

export function CatRow({ color, icon, label, count }: { color: string; icon: string; label: string; count: number }) {
  return (
    <button className="bc-cat">
      <span className="bc-cat-ico" style={{ color, background: `${color}22` }}><I n={icon} size={15} /></span>
      <span>{label}</span>
      <b>{count}</b>
    </button>
  );
}
