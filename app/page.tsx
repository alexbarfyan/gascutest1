"use client";

import { useState } from "react";

const [role, setRole] = useState<"admin" | "staff" | "unknown">("unknown");

useEffect(() => {
  fetch("/api/me").then(r => r.json()).then(d => setRole(d.role ?? "unknown"));
}, []);

{role === "admin" ? (
  <section>...upload UI...</section>
) : (
  <section style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
    <h2>Upload Document</h2>
    <p>Only the admin can upload/replace the shared document.</p>
  </section>
)}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return;
    setUploadMsg("Uploading...");
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) return setUploadMsg(data.error || "Upload failed.");
    setUploadMsg(`Uploaded. Indexed ${data.chunks} chunks.`);
  }

  async function send() {
    if (!message.trim()) return;
    const text = message.trim();
    setMessage("");
    setChat((c) => [...c, { role: "user", text }]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    setLoading(false);

    setChat((c) => [...c, { role: "assistant", text: data.reply || data.error || "No reply" }]);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main style={{ maxWidth: 900, margin: "30px auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Internal Assistant</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/settings">Settings</a>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>Upload Document</h2>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={upload} style={{ marginLeft: 10 }}>Upload</button>
        {uploadMsg && <p style={{ marginTop: 8 }}>{uploadMsg}</p>}
        <p style={{ opacity: 0.7, fontSize: 12 }}>
          Supports PDF, DOCX, TXT. Replaces previous document (keeps it simple and cheap).
        </p>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>Chat</h2>
        <div style={{ height: 360, overflow: "auto", border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
          {chat.length === 0 && <p style={{ opacity: 0.7 }}>Ask a question about the uploaded doc…</p>}
          {chat.map((m, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <b>{m.role === "user" ? "You" : "Assistant"}:</b> {m.text}
            </div>
          ))}
          {loading && <p>Thinking…</p>}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            style={{ flex: 1 }}
            placeholder="Type your question…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send}>Send</button>
        </div>
      </section>
    </main>
  );
}
