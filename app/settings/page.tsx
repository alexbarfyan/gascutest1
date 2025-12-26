"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [hasKey, setHasKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.2);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setHasKey(!!d.hasKey);
        setModel(d.model);
        setTemperature(d.temperature);
      });
  }, []);

  async function save() {
    setMsg("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openaiKey, model, temperature }),
    });
    if (!res.ok) return setMsg("Failed to save.");
    setMsg("Saved.");
    setOpenaiKey("");
    const d = await fetch("/api/settings").then((r) => r.json());
    setHasKey(!!d.hasKey);
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Settings</h1>

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <label>
          OpenAI API Key (stored encrypted)
          <input
            placeholder={hasKey ? "Key already saved (enter to replace)" : "Paste key"}
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
          />
        </label>

        <label>
          Model
          <input value={model} onChange={(e) => setModel(e.target.value)} />
        </label>

        <label>
          Temperature
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
        </label>

        <button onClick={save}>Save</button>
        {msg && <p>{msg}</p>}
      </div>

      <p style={{ marginTop: 16 }}>
        <a href="/">← Back</a>
      </p>
    </main>
  );
}
