import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, apiMode } from "./api";
import { businesses as seedBusinesses, products as seedProducts, type Business, type Opportunity, type PageKey, type Product } from "./data";
import { Banner, Modal } from "./components/ui";
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
import { I as BcI } from "./bc/Icon";


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

  const bcNav: { key: PageKey; label: string; icon: string; badge?: number }[] = [
    { key: "home", label: "Home", icon: "home" }, { key: "discover", label: "Discover", icon: "search" },
    { key: "businesses", label: "Businesses", icon: "building" }, { key: "catalog", label: "Products & Services", icon: "box" },
    { key: "opportunities", label: "Opportunities", icon: "briefcase" }, { key: "messages", label: "Messages", icon: "message", badge: 3 },
    { key: "notifications", label: "Notifications", icon: "bell", badge: 5 }, { key: "analytics", label: "Analytics", icon: "chart" },
    { key: "settings", label: "Settings", icon: "gear" },
  ];
  const logout = () => { setMenu(null); if (apiMode === "api") void api.logout(); setAuthenticated(false); window.history.pushState({}, "", "/auth/login"); };
  const bcPage = ["home", "discover", "businesses", "catalog", "opportunities", "messages"].includes(page);
  return (
    <div className="bc-shell">
      <aside className={`bc-side ${mobileNav ? "open" : ""}`}>
        <button className="bc-brand" onClick={() => navigate("home")}>
          <img src="/bc/logo.jpg" alt="" />
          <span><b>Biz<em>Connect</em></b><small>Connect • Grow • Thrive</small></span>
        </button>
        <nav className="bc-nav">
          {bcNav.map(i => (
            <button key={i.key} className={page === i.key ? "on" : ""} onClick={() => { navigate(i.key); setMobileNav(false); }}>
              <BcI n={i.icon} size={22} /><span>{i.label}</span>{i.badge && <em>{i.badge}</em>}
            </button>
          ))}
        </nav>
        <div className="bc-pro">
          <img src="/bc/crown.jpg" alt="" />
          <b>Pro Business Tools</b>
          <span>Unlock advanced tools to grow your business faster.</span>
          <button className="bc-btn solid" onClick={() => setShellStatus({ kind: "success", message: "Upgrade checkout is not configured for this demo." })}>Upgrade Plan</button>
        </div>
        <button className="bc-user" onClick={() => navigate("settings")}>
          <img src="/bc/kester.jpg" alt="" />
          <span><b>{profileName}</b><small>Business Owner</small></span>
          <BcI n="chevRight" size={18} />
        </button>
        <button className="bc-side-link" onClick={() => navigate("businesses")}><BcI n="users" size={20} /> Switch Business <BcI n="chevRight" size={16} /></button>
        <button className="bc-side-link" onClick={logout}><BcI n="logout" size={20} /> Log Out</button>
      </aside>
      <div className="bc-body">
        <header className="bc-top">
          <button className="bc-burger" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu"><BcI n="list" size={22} /></button>
          <label className="bc-top-search">
            <BcI n="search" size={21} />
            <input placeholder="Search businesses, products, services, opportunities..." onKeyDown={e => {
              if (e.key === "Enter") { const q = e.currentTarget.value.trim(); window.history.pushState({}, "", q ? `/discover?q=${encodeURIComponent(q)}` : "/discover"); setPage("discover"); setMenu(null); }
            }} />
          </label>
          <div className="bc-top-actions">
            <div className="popover-anchor">
              <button className="bc-create" onClick={() => setMenu(menu === "create" ? null : "create")}><BcI n="plus" size={20} /> Create</button>
              {menu === "create" && <CreateMenu onClose={() => setMenu(null)} onBusiness={() => { setMenu(null); openCreateBusiness(); }} onOpportunity={() => { setMenu(null); createOpportunity(); }} onProduct={() => { setMenu(null); openProduct(seedProducts[0]); }} onPost={() => { setMenu(null); createPost(); }} />}
            </div>
            <div className="popover-anchor">
              <button className="bc-top-ico" onClick={() => setMenu(menu === "notifications" ? null : "notifications")} aria-label="Notifications"><BcI n="bell" size={25} /><em>5</em></button>
              {menu === "notifications" && <NotificationsPopover onOpen={() => { setMenu(null); navigate("notifications"); }} />}
            </div>
            <button className="bc-top-ico" onClick={() => navigate("messages")} aria-label="Messages"><BcI n="message" size={25} /><em>3</em></button>
            <div className="popover-anchor">
              <button className="bc-acct" onClick={() => setMenu(menu === "account" ? null : "account")} aria-label="Account"><img src="/bc/kester.jpg" alt="" /><BcI n="chevDown" size={18} /></button>
              {menu === "account" && <AccountMenu onSettings={() => { setMenu(null); navigate("settings"); }} onSwitch={() => { setMenu(null); navigate("businesses"); }} onLogout={logout} />}
            </div>
          </div>
        </header>
        <main className={bcPage ? "bc-content" : "page-content"}>
          <Banner status={shellStatus} onDismiss={() => setShellStatus(null)} />
          {content}
        </main>
      </div>
      {surface}
    </div>
  );
}
