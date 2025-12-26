"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [role, setRole] = useState<"admin" | "staff" | "unknown">("unknown");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setRole(d.role ?? "unknown"))
      .catch(() => setRole("unknown"));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Role: {role}</p>
    </main>
  );
}
