import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  const { user, pass } = await req.json();

  const ok =
    user === process.env.ADMIN_USER &&
    pass === process.env.ADMIN_PASS &&
    (process.env.APP_SECRET || "").length >= 40;

  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  const secret = new TextEncoder().encode(process.env.APP_SECRET || "");
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
