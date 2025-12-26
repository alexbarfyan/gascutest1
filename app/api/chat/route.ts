import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { chunkText } from "@/lib/text";

export async function POST(req: Request) {
  // staff OR admin can chat (adjust if you want staff only)
  await requireStaff(req);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY in environment" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const { message } = await req.json();

  // get most recent uploaded doc
  const doc = db.prepare("SELECT * FROM docs ORDER BY id DESC LIMIT 1").get() as
    | { content: string }
    | undefined;

  const docText = doc?.content ?? "";

  // simple chunking (no fancy vector search yet)
  const chunks = chunkText(docText, 800, 100).slice(0, 8);
  const context = chunks.join("\n\n---\n\n");

  const system = `You are Eric, the internal assistant for GASCU.
Answer using the uploaded policy document when possible.
If the document doesn't contain the answer, say you don't know.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Context:\n${context}\n\nQuestion:\n${message}` },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? "No response.";

  return NextResponse.json({ reply });
}
