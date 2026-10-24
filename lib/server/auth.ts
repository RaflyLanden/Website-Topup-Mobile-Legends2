import { createHmac, timingSafeEqual } from "node:crypto";
import type { AdminRole } from "@/lib/domain/types";

const COOKIE_NAME = "ml_admin";
const SESSION_AGE = 60 * 60 * 8;
interface Session { email: string; role: AdminRole; exp: number }

function secret(): string {
  const value = process.env.ADMIN_AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_AUTH_SECRET wajib diisi minimal 32 karakter.");
  return value;
}
export function verifyAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword || email.toLowerCase() !== expectedEmail.toLowerCase()) return false;
  const actual = Buffer.from(password);
  const expected = Buffer.from(expectedPassword);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function createSession(email: string, role: AdminRole): string {
  const payload = Buffer.from(JSON.stringify({ email, role, exp: Math.floor(Date.now() / 1000) + SESSION_AGE })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
export function readSession(token: string | undefined): Session | null {
  if (!token) return null;
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (session.exp < Date.now() / 1000 || !["SUPER_ADMIN", "OPERATIONS"].includes(session.role)) return null;
    return session;
  } catch { return null; }
}
export const adminCookieName = COOKIE_NAME;
export const adminSessionAge = SESSION_AGE;
