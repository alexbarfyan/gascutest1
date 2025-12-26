import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = file.name.toLowerCase();

    let text = "";

    if (filename.endsWith(".pdf")) {
      const parsed = await pdf(bytes);
      text = parsed.text || "";
    } else if (filename.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: bytes });
      text = result.value || "";
    } else if (filename.endsWith(".txt")) {
      text = bytes.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Supported: PDF, DOCX, TXT" },
        { status: 400 }
      );
    }

    // store “the” current document as row id=1 conceptually (we just keep newest row)
    db.prepare(
      `INSERT INTO documents (name, content, updated_at) VALUES (?, ?, ?)`
    ).run(file.name, text, new Date().toISOString());

    return NextResponse.json({ ok: true, name: file.name, length: text.length });
  } catch (e: any) {
    if (e?.message === "FORBIDDEN_ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
