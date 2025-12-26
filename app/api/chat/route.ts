import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blobToF32, cosine } from "@/lib/text";
import { getOpenAIKey } from "@/app/api/settings/route";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = getOpenAIKey();
  if (!key) return NextResponse.json({ error: "Set OpenAI key in Settings first." }, { status: 400 });

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const settings = db.prepare("SELECT model, temperature, active_doc_id FROM settings WHERE id=1").get() as any;
  const model = settings?.model ?? "gpt-4o-mini";
  const temperature = settings?.temperature ?? 0.2;
  const activeDocId = settings?.active_doc_id ?? null;

  if (!activeDocId) {
    return NextResponse.json({ reply: "No shared document uploaded yet. Ask the admin to upload one." });
  }

  const openai = new OpenAI({ apiKey: key });

  const q = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });
  const qVec = new Float32Array(q.data[0].embedding);

  const rows = db.prepare("SELECT content, embedding FROM chunks WHERE doc_id=?").all(activeDocId) as any[];
  if (!rows.length) {
    return NextResponse.json({ reply: "Active document has no indexed chunks. Ask admin to re-upload." });
  }

  const scored = rows
    .map((r) => {
      const v = blobToF32(r.embedding as Buffer);
      return { content: r.content as string, score: cosine(qVec, v) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const context = scored.map((s, idx) => `Chunk ${idx + 1}:\n${s.content}`).join("\n\n");

  const completion = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      {
        role: "system",
        content:
          "You are an internal assistant. Answer using ONLY the provided document context. If the answer is not in the context, say you don't know and ask for the relevant section to be added.",
      },
      { role: "user", content: `DOCUMENT CONTEXT:\n\n${context}\n\nQUESTION:\n${message}` },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? "(No response)";
  return NextResponse.json({ reply });
}
