"use client";

import { useState } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass }),
    });
    if (!res.ok) {
      setErr("Invalid login.");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui" }}>
      <h1>Internal Assistant Login</h1>
      <form onSubmit={onLogin} style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} />
        <input placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        <button type="submit">Login</button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
      <p style={{ marginTop: 16, opacity: 0.7, fontSize: 12 }}>
        Uses ADMIN_USER / ADMIN_PASS from .env.local
      </p>
    </main>
  );
}
