import { NextRequest } from "next/server";

export function getRole(req: NextRequest): "admin" | "staff" | null {
  // Super simple role read: cookie named "role"
  const role = req.cookies.get("role")?.value;
  if (role === "admin" || role === "staff") return role;
  return null;
}

export function requireAdmin(req: NextRequest) {
  const role = getRole(req);
  if (role !== "admin") {
    throw new Error("FORBIDDEN_ADMIN");
  }
}
