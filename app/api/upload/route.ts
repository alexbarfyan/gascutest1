import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chunkText, f32ToBlob } from "@/lib/text";
import { getOpenAIKey } from "@/app/api/settings/route";
import OpenAI from "openai";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

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
  const key = getOpenAIKey();
  if (!key) return NextResponse.json({ error: "Set OpenAI key in Settings first." }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const text = await fileToText(file);
  if (!text || text.trim().length < 50) {
    return NextResponse.json({ error: "File unreadable or too short." }, { status: 400 });
  }

  // single-doc simplicity: wipe previous
  db.exec("DELETE FROM chunks; DELETE FROM documents;");

  const doc = db.prepare("INSERT INTO documents (name, created_at) VALUES (?, ?)").run(
    file.name,
    new Date().toISOString()
  );
  const docId = Number(doc.lastInsertRowid);

  const openai = new OpenAI({ apiKey: key });

  const chunks = chunkText(text, 900, 150).slice(0, 200); // cap cost
  const insert = db.prepare("INSERT INTO chunks (doc_id, content, embedding) VALUES (?, ?, ?)");

  // Embed in batches
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

  return NextResponse.json({ ok: true, chunks: chunks.length });
}
