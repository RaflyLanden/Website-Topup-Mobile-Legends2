import { afterEach, describe, expect, it } from "vitest";
import { verifyAdminCredentials } from "@/lib/server/auth";

const originalEmail = process.env.ADMIN_EMAIL;
const originalPassword = process.env.ADMIN_PASSWORD;

afterEach(() => {
  if (originalEmail === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = originalEmail;
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalPassword;
});

describe("admin credentials", () => {
  it("compares the configured plain server-side password", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD = "a-long-local-admin-password";
    expect(verifyAdminCredentials("ADMIN@example.com", "a-long-local-admin-password")).toBe(true);
    expect(verifyAdminCredentials("admin@example.com", "wrong-password")).toBe(false);
  });

  it("rejects login when credentials are not configured", () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    expect(verifyAdminCredentials("admin@example.com", "anything")).toBe(false);
  });
});
