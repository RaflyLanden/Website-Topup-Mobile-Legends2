"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

export function OrderLookup() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = reference.trim();
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(clean)) {
      setError("Masukkan referensi akses pesanan yang lengkap.");
      return;
    }
    router.push(`/order/${encodeURIComponent(clean)}`);
  }
  return (
    <form onSubmit={submit} className="mt-6 max-w-xl">
      <label htmlFor="order-reference" className="mb-1.5 block text-sm font-semibold">Referensi pesanan</label>
      <div className="flex gap-2">
        <input id="order-reference" className="input min-w-0" value={reference} onChange={(event) => { setReference(event.target.value); setError(""); }} placeholder="Tempel referensi akses yang tersimpan" autoComplete="off" required />
        <button className="btn-primary shrink-0 px-3 sm:px-4" type="submit"><Search className="h-4 w-4" /><span className="hidden sm:inline">Cari order</span><ArrowRight className="h-4 w-4 sm:hidden" /></button>
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-[#ee8181]">{error}</p> : null}
      <p className="mt-2 text-xs text-[#77827e]">Referensi berfungsi sebagai kunci akses pribadi. Jangan bagikan ke orang lain.</p>
    </form>
  );
}
