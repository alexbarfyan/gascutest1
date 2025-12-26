import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptText, decryptText } from "@/lib/crypto";

export async function GET() {
  const row = db.prepare("SELECT openai_key_enc, model, temperature FROM settings WHERE id=1").get() as any;
  return NextResponse.json({
    hasKey: !!row?.openai_key_enc,
    model: row?.model ?? "gpt-4o-mini",
    temperature: row?.temperature ?? 0.2,
  });
}

export async function POST(req: Request) {
  const { openaiKey, model, temperature } = await req.json();

  const current = db.prepare("SELECT openai_key_enc FROM settings WHERE id=1").get() as any;

  const keyEnc =
    openaiKey && openaiKey.trim().length > 0
      ? encryptText(openaiKey.trim())
      : current?.openai_key_enc ?? null;

  db.prepare("UPDATE settings SET openai_key_enc=?, model=?, temperature=? WHERE id=1")
    .run(keyEnc, model ?? "gpt-4o-mini", typeof temperature === "number" ? temperature : 0.2);

  return NextResponse.json({ ok: true });
}

export function getOpenAIKey(): string | null {
  const row = db.prepare("SELECT openai_key_enc FROM settings WHERE id=1").get() as any;
  if (!row?.openai_key_enc) return null;
  return decryptText(row.openai_key_enc);
}
