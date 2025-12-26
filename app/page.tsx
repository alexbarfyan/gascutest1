"use client";

import { useEffect, useState } from "react";

type Role = "admin" | "staff" | "unknown";

export default function Page() {
  const [role, setRole] = useState<Role>("unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setRole((d.role as Role) ?? "unknown"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Dashboard</h1>
      <div style={{ marginBottom: 12 }}>Role: {role}</div>

      {role === "admin" && (
        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <AdminSettings />
          <AdminUpload />
          <StaffChat />
        </div>
      )}

      {role === "staff" && (
        <div style={{ maxWidth: 720 }}>
          <StaffChat />
        </div>
      )}

      {role === "unknown" && (
        <div>
          Not logged in. <a href="/login">Go to login</a>
        </div>
      )}
    </div>
  );
}

/** ADMIN: store OpenAI key (server will use it) */
function AdminSettings() {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");

  async function save() {
    setMsg("");
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openaiKey: key }),
    });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Saved." : `Error: ${d.error ?? r.status}`);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h3>Admin: OpenAI Key</h3>
      <p>Paste the OpenAI API key here (only admins can save it).</p>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-..."
        style={{ width: "100%", padding: 8 }}
      />
      <button onClick={save} style={{ marginTop: 8, padding: "8px 12px" }}>
        Save key
      </button>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}

/** ADMIN: upload/replace the knowledge document */
function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  async function upload() {
    if (!file) return;
    setMsg("Uploading...");
    const fd = new FormData();
    fd.append("file", file);

    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Uploaded & indexed." : `Error: ${d.error ?? r.status}`);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h3>Admin: Upload policy document</h3>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button
  onClick={upload}
  style={{ marginTop: 8, padding: 8 }}
>
  Upload
</button>

