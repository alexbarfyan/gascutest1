import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  const { user, pass } = await req.json();

  const adminOk =
    user === process.env.ADMIN_USER &&
    pass === process.env.ADMIN_PASS &&
    (process.env.APP_SECRET || "").length >= 40;

  const staffOk =
    user === process.env.STAFF_USER &&
    pass === process.env.STAFF_PASS &&
    (process.env.APP_SECRET || "").length >= 40;

  if (!adminOk && !staffOk) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const role = adminOk ? "admin" : "staff";

  const secret = new TextEncoder().encode(process.env.APP_SECRET || "");
  const token = await new SignJWT({ user, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
