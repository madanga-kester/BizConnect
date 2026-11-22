import { useState } from "react";
import { api, apiMode } from "../api";
import { Icon } from "../components/icons";
import { Logo, Pill } from "../components/ui";

export function Auth({ initialMode, onLogin }: { initialMode: "login" | "register"; onLogin: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    setError("");
    if (!email.trim() || password.length < 12) {
      setError("Email/identifier and a password of at least 12 characters are required.");
      return;
    }
    if (apiMode === "api") {
      const r = mode === "login" ? await api.login(email.trim(), password) : await api.register({ name, username, email: email.trim(), password, county: "Nairobi", town: "Nairobi" });
      if (!r.ok) {
        setError(r.message);
        return;
      }
    }
    onLogin();
  };
  return (
    <div className="auth-page">
      <div className="auth-art">
        <Logo/>
        <div>
          <span className="hero-kicker">KENYA'S BUSINESS COMMUNITY</span>
          <h1>Find. Connect.<br/><em>Grow together.</em></h1>
          <p>Discover local businesses, meet the people behind them and turn meaningful connections into momentum.</p>
        </div>
      </div>
      <main className="auth-card">
        <Pill tone="amber">{apiMode === "api" ? "API mode · server-backed" : "Demo mode · local examples"}</Pill>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button>
        </div>
        <h2>{mode === "login" ? "Welcome back" : "Join Mabiz"}</h2>
        {error && <div className="form-error">{error}</div>}
        {mode === "register" && (
          <>
            <label>Your name<input value={name} onChange={e => setName(e.target.value)}/></label>
            <label>Username<input value={username} onChange={e => setUsername(e.target.value)}/></label>
          </>
        )}
        <label>Email or username<input value={email} onChange={e => setEmail(e.target.value)}/></label>
        <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password"/></label>
        <button className="button button-primary full" onClick={() => void submit()}>{mode === "login" ? "Log in" : "Create account"}<Icon name="arrow"/></button>
      </main>
    </div>
  );
}
