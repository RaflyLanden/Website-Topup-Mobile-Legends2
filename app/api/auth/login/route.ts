import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookieName, adminSessionAge, createSession, verifyAdminCredentials } from "@/lib/server/auth";
import { allowAttempt } from "@/lib/server/rate-limit";

const schema = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowAttempt(`login:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Login dibatasi sementara. Coba lagi nanti." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 401 });
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_AUTH_SECRET.length < 32) {
    return NextResponse.json({
      error: "Konfigurasi admin belum lengkap. Atur ADMIN_EMAIL, ADMIN_PASSWORD, dan ADMIN_AUTH_SECRET minimal 32 karakter di environment server."
    }, { status: 503 });
  }
  if (!verifyAdminCredentials(parsed.data.email, parsed.data.password)) {
    return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 401 });
  }
  try {
    const token = createSession(parsed.data.email, "SUPER_ADMIN");
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: adminSessionAge });
    return response;
  } catch (error) {
    console.error("Admin session creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Sesi admin belum dapat dibuat. Periksa ADMIN_AUTH_SECRET." }, { status: 503 });
  }
}
