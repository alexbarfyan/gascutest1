import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth"; // must exist in your project
import { db } from "@/lib/db";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // ✅ admin-only
  await requireAdmin(req);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let text = "";

  if (name.endsWith(".pdf")) {
    const out = await pdf(buf);
    text = out.text || "";
  } else if (name.endsWith(".docx")) {
    const out = await mammoth.extractRawText({ buffer: buf });
    text = out.value || "";
  } else {
    // .txt or fallback
    text = buf.toString("utf8");
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "Could not extract text from file." }, { status: 400 });
  }

  // ✅ store permanently (DB) as “current doc”
  await db.setting.upsert({
    where: { key: "CURRENT_DOC_TEXT" },
    update: { value: text },
    create: { key: "CURRENT_DOC_TEXT", value: text },
  });

  await db.setting.upsert({
    where: { key: "CURRENT_DOC_NAME" },
    update: { value: file.name },
    create: { key: "CURRENT_DOC_NAME", value: file.name },
  });

  return NextResponse.json({ ok: true, name: file.name });
}
