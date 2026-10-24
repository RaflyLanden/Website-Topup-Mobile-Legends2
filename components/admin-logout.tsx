"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function AdminLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sesi belum dapat diakhiri.");
      router.replace("/admin/login");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sesi belum dapat diakhiri.");
      setLoading(false);
    }
  }
  return (
    <div>
      <button type="button" onClick={logout} disabled={loading} className="flex min-h-10 w-full items-center gap-2 rounded-md border border-[#2a3439] px-3 py-2 text-sm text-[#a0aaa7] hover:bg-[#182126] hover:text-white disabled:opacity-60">
        <LogOut className="h-4 w-4" />{loading ? "Keluar…" : "Keluar"}
      </button>
      {error ? <p role="alert" className="mt-2 text-xs text-[#ee8181]">{error}</p> : null}
    </div>
  );
}
