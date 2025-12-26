import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chunkText, f32ToBlob } from "@/lib/text";
import { getOpenAIKey } from "@/app/api/settings/route";
import OpenAI from "openai";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

async function requireAdmin(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  const token = match?.[1];
  if (!token) throw new Error("Not authenticated");

  const secret = new TextEncoder().encode(process.env.APP_SECRET || "");
  const { payload } = await jwtVerify(token, secret);
  if (payload.role !== "admin") throw new Error("Forbidden");
}

async function fileToText(file: File) {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    const parsed = await pdf(buf);
    return parsed.text || "";
  }
  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value || "";
  }
  return buf.toString("utf8");
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Forbidden" }, { status: 403 });
  }

  const key = getOpenAIKey();
  if (!key) return NextResponse.json({ error: "Set OpenAI key in Settings first." }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const text = await fileToText(file);
  if (!text || text.trim().length < 50) {
    return NextResponse.json({ error: "File unreadable or too short." }, { status: 400 });
  }

  // NEW: do NOT delete old documents/chunks. We add a new doc and mark it active.
  const doc = db.prepare("INSERT INTO documents (name, created_at) VALUES (?, ?)").run(
    file.name,
    new Date().toISOString()
  );
  const docId = Number(doc.lastInsertRowid);

  const openai = new OpenAI({ apiKey: key });
  const chunks = chunkText(text, 900, 150).slice(0, 200);

  const insert = db.prepare("INSERT INTO chunks (doc_id, content, embedding) VALUES (?, ?, ?)");

  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });

    for (let j = 0; j < batch.length; j++) {
      insert.run(docId, batch[j], f32ToBlob(emb.data[j].embedding));
    }
  }

  // Mark this doc as the shared active doc
  db.prepare("UPDATE settings SET active_doc_id=? WHERE id=1").run(docId);

  return NextResponse.json({ ok: true, docId, chunks: chunks.length });
}
