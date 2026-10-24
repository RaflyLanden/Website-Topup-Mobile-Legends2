import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/rate-limit", () => ({ allowAttempt: () => true }));

import { POST } from "@/app/api/auth/login/route";

function request(ip: string) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email: "admin@example.com", password: "plain-password" })
  });
}

describe("admin login route", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD = "plain-password";
    process.env.ADMIN_AUTH_SECRET = "short";
  });

  it("returns a helpful JSON configuration error for a short session secret", async () => {
    const response = await POST(request("192.0.2.11") as never);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining("ADMIN_AUTH_SECRET minimal 32 karakter")
    });
  });

  it("sets an HTTP-only session cookie when credentials and secret are configured", async () => {
    process.env.ADMIN_AUTH_SECRET = "this-is-a-long-secret-for-admin-session";
    const response = await POST(request("192.0.2.12") as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(await response.json()).toEqual({ ok: true });
  });
});
