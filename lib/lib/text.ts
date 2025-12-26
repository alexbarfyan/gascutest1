export function chunkText(text: string, chunkSize = 900, overlap = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    chunks.push(clean.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks.filter(Boolean);
}

export function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

export function f32ToBlob(v: number[]) {
  return Buffer.from(new Float32Array(v).buffer);
}
export function blobToF32(buf: Buffer) {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
