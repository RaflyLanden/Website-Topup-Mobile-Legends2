import { cookies } from "next/headers";
import type { AdminRole } from "@/lib/domain/types";
import { adminCookieName, readSession } from "@/lib/server/auth";

export async function requireAdmin(roles: AdminRole[] = ["SUPER_ADMIN", "OPERATIONS"]) {
  const token = (await cookies()).get(adminCookieName)?.value;
  const session = readSession(token);
  if (!session || !roles.includes(session.role)) return null;
  return session;
}
