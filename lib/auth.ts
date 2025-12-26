// lib/auth.ts
import { NextResponse } from "next/server";

export async function requireAdmin(req: Request) {
  // TODO: replace with your real auth check
  const role = req.headers.get("x-role"); // example
  if (role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  return null;
}

export async function requireStaff(req: Request) {
  // allow staff OR admin
  const role = req.headers.get("x-role");
  if (role !== "staff" && role !== "admin") {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }
  return null;
}
