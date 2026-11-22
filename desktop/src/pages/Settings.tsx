import { useState } from "react";
import { Avatar, Banner, SectionHeading } from "../components/ui";
import { useAction } from "../hooks/useAction";

export function Settings({ onLogout, profileName, onSave, theme, setTheme, reducedMotion, setReducedMotion }: { onLogout: () => void; profileName: string; onSave: (name: string) => Promise<void>; theme: "light" | "dark"; setTheme: (v: "light" | "dark") => void; reducedMotion: boolean; setReducedMotion: (v: boolean) => void }) {
  const [name, setName] = useState(profileName);
  const action = useAction();
  return (
    <>
      <Banner status={action.status} onDismiss={() => action.setStatus(null)}/>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">MAKE Mabiz YOURS</div>
          <h1>Settings</h1>
          <p>Manage your account, appearance and notifications.</p>
        </div>
        <button className="button button-primary" onClick={() => void onSave(name).then(() => action.setStatus({ kind: "success", message: "Settings saved." }))}>Save changes</button>
      </div>
      <div className="settings-layout">
        <aside className="settings-menu">
          <button className="active">Account</button>
          <button>Profile & business</button>
          <button>Notifications</button>
          <button>Privacy & safety</button>
          <button>Appearance</button>
        </aside>
        <main className="settings-content">
          <section className="panel settings-section">
            <SectionHeading title="Account information"/>
            <div className="profile-row">
              <Avatar initials="KM" color="#d17a49" size="lg"/>
              <div>
                <h3>{name}</h3>
                <p className="muted">kester@example.com</p>
              </div>
            </div>
            <label>Full name<input value={name} onChange={e => setName(e.target.value)}/></label>
            <label>Email address<input defaultValue="kester@example.com" type="email"/></label>
          </section>
          <section className="panel settings-section">
            <SectionHeading title="Appearance"/>
            <div className="preference-row">
              <div><b>Theme</b><span>Choose light or dark surfaces</span></div>
              <select value={theme} onChange={e => setTheme(e.target.value as "light" | "dark")}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="preference-row">
              <div><b>Reduced motion</b><span>Minimise transitions and floating accents</span></div>
              <input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)}/>
            </div>
            <div className="preference-row">
              <div><b>Notifications</b><span>Messages, follows and opportunity matches</span></div>
              <input type="checkbox" defaultChecked onChange={() => action.setStatus({ kind: "success", message: "Notification preference changed locally." })}/>
            </div>
          </section>
          <section className="panel settings-section danger">
            <SectionHeading title="Session"/>
            <p className="muted">Sign out of this browser session. Your data remains safe in your Mabiz account.</p>
            <button className="button button-danger" onClick={onLogout}>Log out</button>
          </section>
        </main>
      </div>
    </>
  );
}
