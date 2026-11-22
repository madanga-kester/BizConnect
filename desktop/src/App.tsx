import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, apiMode } from "./api";
import { businesses as seedBusinesses, products as seedProducts, type Business, type Opportunity, type PageKey, type Product } from "./data";
import { Icon, type IconName } from "./components/icons";
import { Avatar, Banner, Logo, Modal } from "./components/ui";
import { BusinessProfileView, OpportunityDetailView, ProductDetailView } from "./components/details";
import { AccountMenu, CreateMenu, NotificationsPopover } from "./components/menus";
import type { Status } from "./hooks/useAction";
import { Analytics } from "./pages/Analytics";
import { Auth } from "./pages/Auth";
import { Businesses } from "./pages/Businesses";
import { Catalog } from "./pages/Catalog";
import { Discover } from "./pages/Discover";
import { Home } from "./pages/Home";
import { Messages } from "./pages/Messages";
import { Notifications } from "./pages/Notifications";
import { Opportunities } from "./pages/Opportunities";
import { Settings } from "./pages/Settings";

const nav: { key: PageKey; label: string; icon: IconName }[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "discover", label: "Discover", icon: "search" },
  { key: "businesses", label: "Businesses", icon: "briefcase" },
  { key: "catalog", label: "Products & Services", icon: "box" },
  { key: "opportunities", label: "Opportunities", icon: "spark" },
  { key: "messages", label: "Messages", icon: "message" },
  { key: "notifications", label: "Notifications", icon: "bell" },
  { key: "analytics", label: "Analytics", icon: "chart" },
  { key: "settings", label: "Settings", icon: "gear" }
];

export default function App() {
  const pathToPage = (path: string): PageKey => (({ "/": "home", "/discover": "discover", "/businesses": "businesses", "/products-services": "catalog", "/opportunities": "opportunities", "/messages": "messages", "/notifications": "notifications", "/analytics": "analytics", "/settings": "settings" } as Record<string, PageKey>)[path] ?? "home");
  const pageToPath: Record<PageKey, string> = { home: "/", discover: "/discover", businesses: "/businesses", catalog: "/products-services", opportunities: "/opportunities", messages: "/messages", notifications: "/notifications", analytics: "/analytics", settings: "/settings" };
  const authPath = window.location.pathname === "/auth/register" ? "register" : window.location.pathname === "/auth/login" ? "login" : null;
  const [page, setPage] = useState<PageKey>(() => pathToPage(window.location.pathname));
  const [authenticated, setAuthenticated] = useState(apiMode === "demo" && !authPath);
  const [mobileNav, setMobileNav] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [allBusinesses, setAllBusinesses] = useState(seedBusinesses);
  const [profileName, setProfileName] = useState("Kester Madanga");
  const [surface, setSurface] = useState<ReactNode>(null);
  const [shellStatus, setShellStatus] = useState<Status | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(() => typeof window !== "undefined" && window.localStorage?.getItem("Mabiz-theme") === "dark" ? "dark" : "light");
  const [reducedMotion, setReducedMotionState] = useState(() => typeof window !== "undefined" && window.localStorage?.getItem("Mabiz-reduced-motion") === "true");
  const [menu, setMenu] = useState<"create" | "notifications" | "account" | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("Mabiz-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
    localStorage.setItem("Mabiz-reduced-motion", String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    const onPop = () => setPage(pathToPage(window.location.pathname));
    window.addEventListener("popstate", onPop);
    if (apiMode === "api") void api.csrf().then(() => api.profile().then(r => r.ok && setAuthenticated(true)));
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (next: PageKey) => {
    window.history.pushState({}, "", pageToPath[next]);
    setPage(next);
    setMobileNav(false);
    setMenu(null);
  };

  const toggleFollow = async (id: string) => {
    const next = !followed.has(id);
    if (apiMode === "api") {
      const r = await api.followBusiness(id, next);
      if (!r.ok) {
        setShellStatus({ kind: "error", message: r.message });
        return;
      }
    }
    setFollowed(s => {
      const n = new Set(s);
      next ? n.add(id) : n.delete(id);
      return n;
    });
  };

  const openBusiness = (b: Business = allBusinesses[0]) => setSurface(
    <BusinessProfileView
      business={b}
      onClose={() => setSurface(null)}
      followed={followed.has(b.id)}
      onFollow={() => void toggleFollow(b.id)}
      onMessage={() => { setSurface(null); navigate("messages"); }}
      onProduct={() => { setSurface(null); navigate("catalog"); }}
    />
  );

  const openProduct = (p: Product) => setSurface(
    <ProductDetailView
      product={p}
      onClose={() => setSurface(null)}
      onMessage={() => { setSurface(null); navigate("messages"); }}
      onAction={() => setShellStatus({ kind: "success", message: `${p.kind === "Product" ? "Cart item" : "Service request"} saved locally; no API success was fabricated.` })}
    />
  );

  const openOpportunity = (o: Opportunity) => setSurface(
    <OpportunityDetailView
      item={o}
      onClose={() => setSurface(null)}
      onEnquire={async () => {
        if (apiMode === "api") {
          const r = await api.enquiry(o.id);
          if (!r.ok) {
            setShellStatus({ kind: "error", message: r.message });
            return;
          }
        }
        setSurface(null);
        setShellStatus({ kind: "success", message: apiMode === "api" ? "Enquiry started by the API." : "Enquiry saved in local demo state." });
      }}
    />
  );

  const openCreateBusiness = () => {
    let name = "";
    setSurface(
      <Modal title="Create a business" onClose={() => setSurface(null)}>
        <div className="dialog-form">
          <label>Business name<input onChange={e => name = e.target.value}/></label>
          <button className="button button-primary" onClick={async () => {
            if (name.trim().length < 2) {
              setShellStatus({ kind: "error", message: "Business name must be at least 2 characters." });
              return;
            }
            if (apiMode === "api") {
              const r = await api.createBusiness({ name: name.trim(), businessType: "hybrid", category: "General", subcategory: "Local business", description: `${name.trim()} on Mabiz`, about: `${name.trim()} on Mabiz`, founder: profileName, originStory: "Created from Mabiz desktop", county: "Nairobi", town: "Nairobi", visibility: "public", priceRange: "KSh KSh" });
              if (!r.ok) {
                setShellStatus({ kind: "error", message: r.message });
                return;
              }
            }
            setAllBusinesses(list => [...list, { id: `local-${list.length}`, name: name.trim(), category: "General", location: "Nairobi", rating: 0, reviews: 0, color: "#0a8f62", initials: name.slice(0, 2).toUpperCase(), followers: "0" }]);
            setSurface(null);
            setShellStatus({ kind: "success", message: apiMode === "api" ? "Business created by the API." : "Business saved in local demo state." });
          }}>Save business</button>
        </div>
      </Modal>
    );
  };

  const createOpportunity = () => {
    let title = "";
    let description = "";
    setSurface(
      <Modal title="Create opportunity" onClose={() => setSurface(null)}>
        <div className="dialog-form">
          <label>Title<input onChange={e => title = e.target.value}/></label>
          <label>Description<textarea onChange={e => description = e.target.value}/></label>
          <button className="button button-primary" onClick={async () => {
            if (title.trim().length < 3 || description.trim().length < 10) {
              setShellStatus({ kind: "error", message: "Add a title and at least 10 characters." });
              return;
            }
            if (apiMode === "api") {
              const r = await api.createOpportunity("urban", { title: title.trim(), description: description.trim(), category: "Partnership", currency: "KES", expiresAt: new Date(Date.now() + 28 * 86400000).toISOString() });
              if (!r.ok) {
                setShellStatus({ kind: "error", message: r.message });
                return;
              }
            }
            setSurface(null);
            setShellStatus({ kind: "success", message: apiMode === "api" ? "Opportunity created by the API." : "Opportunity saved in local demo state." });
          }}>Create opportunity</button>
        </div>
      </Modal>
    );
  };

  const createPost = () => {
    setSurface(
      <Modal title="Post an update" onClose={() => setSurface(null)}>
        <div className="dialog-form">
          <label>What do you want to share?<textarea autoFocus/></label>
          <button className="button button-primary" onClick={() => {
            setSurface(null);
            setShellStatus({ kind: "success", message: "Post draft is ready on Home." });
            navigate("home");
          }}>Continue to composer</button>
        </div>
      </Modal>
    );
  };

  const content = useMemo(() => {
    switch (page) {
      case "home":
        return <Home setPage={navigate} onPost={async text => {
          if (apiMode === "api") {
            const r = await api.createPost({ kind: "text", text, audience: "public", discoverable: true, allowComments: true });
            if (!r.ok) throw new Error(r.message);
          }
        }} onBusiness={() => openBusiness()} onProduct={() => openProduct(seedProducts[0])} onOpportunity={createOpportunity}/>;
      case "discover":
        return <Discover setPage={navigate} allBusinesses={allBusinesses} followed={followed} toggleFollow={id => void toggleFollow(id)} onOpen={openBusiness}/>;
      case "businesses":
        return <Businesses setPage={navigate} allBusinesses={allBusinesses} followed={followed} toggleFollow={id => void toggleFollow(id)} onCreate={openCreateBusiness} onOpen={openBusiness}/>;
      case "catalog":
        return <Catalog setPage={navigate} onDetail={openProduct}/>;
      case "opportunities":
        return <Opportunities onDetail={openOpportunity} onCreate={createOpportunity}/>;
      case "messages":
        return <Messages onOpenBusiness={() => openBusiness()}/>;
      case "notifications":
        return <Notifications/>;
      case "analytics":
        return <Analytics businessId="urban"/>;
      case "settings":
        return <Settings profileName={profileName} onSave={async name => {
          if (name.trim().length < 2) throw new Error("Name must be at least 2 characters.");
          setProfileName(name.trim());
        }} onLogout={() => {
          if (apiMode === "api") void api.logout();
          setAuthenticated(false);
          window.history.pushState({}, "", "/auth/login");
        }} theme={theme} setTheme={setThemeState} reducedMotion={reducedMotion} setReducedMotion={setReducedMotionState}/>;
    }
  }, [page, allBusinesses, followed, profileName, theme, reducedMotion]);

  if (!authenticated) return <Auth initialMode={authPath ?? "login"} onLogin={() => { setAuthenticated(true); navigate("home"); }}/>;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo/>
          <button className="mobile-close" onClick={() => setMobileNav(false)}><Icon name="close"/></button>
        </div>
        <nav>
          {nav.map(i => (
            <button key={i.key} className={page === i.key ? "active" : ""} onClick={() => navigate(i.key)}>
              <Icon name={i.icon}/>
              <span>{i.label}</span>
              {i.key === "messages" && <i className="nav-badge">3</i>}
              {i.key === "notifications" && <i className="nav-badge">5</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-promo">
          <span className="promo-star"><Icon name="spark"/></span>
          <b>Pro Business Tools</b>
          <span>Grow your business with powerful tools.</span>
          <button className="button button-primary" onClick={() => setShellStatus({ kind: "success", message: "Upgrade checkout is not configured for this demo." })}>Upgrade Plan</button>
        </div>
        <div className="sidebar-user">
          <Avatar initials="KM" color="#d17a49" size="sm"/>
          <div><b>{profileName}</b><span>Business Owner</span></div>
          <button onClick={() => navigate("settings")}><Icon name="chevron"/></button>
        </div>
        <button className="business-switch" onClick={() => navigate("businesses")}><span className="switch-dot"/> Urban Coffee Co. <Icon name="chevron"/></button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><Icon name="list"/></button>
          <div className="global-search">
            <Icon name="search"/>
            <input placeholder="Search businesses, products, or opportunities..." onKeyDown={e => {
              if (e.key === "Enter") {
                const q = e.currentTarget.value.trim();
                window.history.pushState({}, "", q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
                setPage("discover");
                setMenu(null);
              }
            }}/>
          </div>
          <div className="top-actions">
            <div className="popover-anchor">
              <button className="create-button" onClick={() => setMenu(menu === "create" ? null : "create")}><Icon name="plus"/> Create</button>
              {menu === "create" && <CreateMenu onClose={() => setMenu(null)} onBusiness={() => { setMenu(null); openCreateBusiness(); }} onOpportunity={() => { setMenu(null); createOpportunity(); }} onProduct={() => { setMenu(null); openProduct(seedProducts[0]); }} onPost={() => { setMenu(null); createPost(); }}/>}
            </div>
            <div className="popover-anchor">
              <button className="top-icon" onClick={() => setMenu(menu === "notifications" ? null : "notifications")} aria-label="Notifications"><Icon name="bell"/><i/></button>
              {menu === "notifications" && <NotificationsPopover onOpen={() => { setMenu(null); navigate("notifications"); }}/>}
            </div>
            <button className="top-icon" onClick={() => navigate("messages")} aria-label="Messages"><Icon name="message"/></button>
            <div className="popover-anchor">
              <button onClick={() => setMenu(menu === "account" ? null : "account")} aria-label="Account"><Avatar initials="KM" color="#d17a49" size="sm"/></button>
              {menu === "account" && <AccountMenu onSettings={() => { setMenu(null); navigate("settings"); }} onSwitch={() => { setMenu(null); navigate("businesses"); }} onLogout={() => { setMenu(null); setAuthenticated(false); window.history.pushState({}, "", "/auth/login"); }}/>}
            </div>
            <button className="theme-button" onClick={() => setThemeState(theme === "light" ? "dark" : "light")} aria-label="Toggle theme"><Icon name={theme === "light" ? "moon" : "sun"}/></button>
          </div>
        </header>
        <main className="page-content">
          <div className="page-context">
            <span>Home / {nav.find(i => i.key === page)?.label ?? "Home"}</span>
            <span className={`mode-note ${apiMode}`}>{apiMode === "api" ? "Connected to Mabiz API" : "Demo mode · local examples"}</span>
          </div>
          <Banner status={shellStatus} onDismiss={() => setShellStatus(null)}/>
          {content}
        </main>
      </div>
      {surface}
    </div>
  );
}
