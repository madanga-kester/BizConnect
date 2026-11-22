import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import type { Status } from "../hooks/useAction";

export const Avatar = ({ initials, color = "#0a8f62", size = "md" }: { initials: string; color?: string; size?: "sm" | "md" | "lg" }) => (
  <span className={`avatar avatar-${size}`}>
    <img src="/reference-kester.png" alt={`${initials} portrait`} style={{ objectPosition: initials === "KM" ? "center" : "52% 35%" }} />
  </span>
);

export const Logo = () => (
  <div className="brand">
    <span className="brand-mark"><i/><i/><i/></span>
    <span><b>Ma</b>biz<small>Connect · Grow · Thrive</small></span>
  </div>
);

export const Pill = ({ children, tone = "mint" }: { children: ReactNode; tone?: "mint" | "slate" | "amber" | "pink" }) => (
  <span className={`pill pill-${tone}`}>{children}</span>
);

export const SectionHeading = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <div className="section-heading">
    <h2>{title}</h2>
    {action && <button className="text-button" onClick={onAction}>{action}<Icon name="arrow"/></button>}
  </div>
);

export const Banner = ({ status, onDismiss }: { status: Status | null; onDismiss?: () => void }) =>
  status ? (
    <div className={`status-banner ${status.kind}`} role="status">
      <b>{status.kind === "success" ? "Done" : status.kind === "error" ? "Check" : "Working"}</b>
      {status.message}
      {onDismiss && <button onClick={onDismiss} aria-label="Dismiss"><Icon name="close"/></button>}
    </div>
  ) : null;

export const CityHero = ({ title, description, kicker, action, onAction, hero = "hero-home" }: { title: string; description: string; kicker?: string; action?: string; onAction?: () => void; hero?: string }) => (
  <div className={`city-hero ${hero}`}>
    <div className="hero-copy">
      {kicker && <span className="hero-kicker">{kicker}</span>}
      <h1>{title}</h1>
      <p>{description}</p>
      {action && <button className="button button-light" onClick={onAction}>{action}<Icon name="arrow"/></button>}
    </div>
    <em>Find. Connect. Grow.</em>
  </div>
);

export const StatCard = ({ label, value, change, icon }: { label: string; value: string; change?: string; icon: IconName }) => (
  <div className="stat-card">
    <div className="stat-icon"><Icon name={icon}/></div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      {change && <small className="positive">{change}</small>}
    </div>
  </div>
);

export const Modal = ({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) => (
  <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true">
      <div className="modal-head">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close"><Icon name="close"/></button>
      </div>
      {children}
    </div>
  </div>
);
