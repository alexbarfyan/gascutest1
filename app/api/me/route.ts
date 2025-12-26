import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  const token = match?.[1];

  if (!token) return NextResponse.json({ loggedIn: false }, { status: 401 });

  try {
    const secret = new TextEncoder().encode(process.env.APP_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({
      loggedIn: true,
      user: payload.user,
      role: payload.role,
    });
  } catch {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}
