"use client";

import { useEffect, useState } from "react";

type Role = "admin" | "staff" | "unknown";

export default function Page() {
  const [role, setRole] = useState<Role>("unknown");
  const [status, setStatus] = useState<string>("");

  // Upload (admin)
  const [file, setFile] = useState<File | null>(null);

  // Chat (staff)
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ who: "you" | "bot"; text: string }[]>([]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setRole((d?.role as Role) ?? "unknown"))
      .catch(() => setRole("unknown"));
  }, []);

  async function logout() {
    setStatus("");
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function upload() {
    setStatus("");
    if (!file) {
      setStatus("Pick a file first.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus(data?.error || "Upload failed.");
      return;
    }
    setStatus("✅ Document uploaded. Staff can now chat with it.");
    setFile(null);
  }

  async function send() {
    setStatus("");
    const text = input.trim();
    if (!text) return;

    setInput("");
    setMessages((m) => [...m, { who: "you", text }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessages((m) => [...m, { who: "bot", text: `❌ ${data?.error || "Chat failed."}` }]);
      return;
    }

    setMessages((m) => [...m, { who: "bot", text: data?.answer || "(no answer returned)" }]);
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ fontSize: 34, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 6 }}>Role: <b>{role}</b></div>
        <button onClick={logout} style={{ padding: 8, cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {status ? (
        <div style={{ marginBottom: 16, padding: 10, border: "1px solid #ddd" }}>{status}</div>
      ) : null}

      {role === "admin" ? (
        <section style={{ border: "1px solid #ddd", padding: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Admin: Upload policy document</h2>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ marginTop: 10 }}>
            <button onClick={upload} style={{ padding: 8, cursor: "pointer" }}>
              Upload
            </button>
          </div>
          <p style={{ marginTop: 10, color: "#555" }}>
            Upload replaces the current document. Staff will chat against the latest uploaded doc.
          </p>
        </section>
      ) : null}

      {role === "staff" ? (
        <section style={{ border: "1px solid #ddd", padding: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Staff: Chat with the policy</h2>

          <div style={{ height: 280, overflow: "auto", border: "1px solid #eee", padding: 10, marginBottom: 10 }}>
            {messages.length === 0 ? (
              <div style={{ color: "#777" }}>Ask a question about the policy…</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <b>{m.who === "you" ? "You" : "Bot"}:</b> {m.text}
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type your question…"
              style={{ flex: 1, padding: 8 }}
            />
            <button onClick={send} style={{ padding: 8, cursor: "pointer" }}>
              Send
            </button>
          </div>
        </section>
      ) : null}

      {role === "unknown" ? (
        <div style={{ marginTop: 16, color: "#777" }}>
          If you just logged in and this stays “unknown”, refresh once. If it still happens, your `/api/me` route isn’t returning a role.
        </div>
      ) : null}
    </main>
  );
}
