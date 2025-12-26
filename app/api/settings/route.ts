import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { encrypt, decrypt } from "../../../lib/crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth"; // or wherever your auth helper is

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ...rest of your route
}

export const runtime = "nodejs";

export function getOpenAIKey() {
  const row = db.prepare("SELECT openai_key_enc FROM settings WHERE id=1").get() as any;
  if (!row?.openai_key_enc) return "";
  return decrypt(row.openai_key_enc);
}

export async function GET() {
  const row = db.prepare("SELECT model, temperature FROM settings WHERE id=1").get() as any;
  return NextResponse.json({
    model: row?.model ?? "gpt-4o-mini",
    temperature: row?.temperature ?? 0.2,
    hasKey: !!getOpenAIKey(),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const key = typeof body.openaiKey === "string" ? body.openaiKey.trim() : "";
  const model = typeof body.model === "string" ? body.model : "gpt-4o-mini";
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.2;

  if (!key) return NextResponse.json({ error: "Missing openaiKey" }, { status: 400 });

  db.prepare(
    "UPDATE settings SET openai_key_enc=?, model=?, temperature=? WHERE id=1"
  ).run(encrypt(key), model, temperature);

  return NextResponse.json({ ok: true });
}
