"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, LoaderCircle } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const body = await response.text();
      let result: { error?: string };
      try {
        result = body ? JSON.parse(body) as { error?: string } : {};
      } catch {
        throw new Error(`Server mengembalikan respons yang tidak valid (HTTP ${response.status}). Periksa terminal server.`);
      }
      if (!response.ok) throw new Error(result.error || "Login gagal.");
      router.replace("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login gagal. Coba kembali.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <div>
        <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium">Email admin</label>
        <input id="admin-email" className="input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium">Kata sandi</label>
        <input id="admin-password" className="input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      {error ? <p role="alert" className="text-sm text-[#ee8181]">{error}</p> : null}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Memverifikasi…</> : "Masuk"}
      </button>
      <p className="text-xs text-[#77827e]">Akses menggunakan akun admin yang telah dikonfigurasi operator.</p>
    </form>
  );
}
