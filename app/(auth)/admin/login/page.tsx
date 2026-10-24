import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c1114] px-4 py-8">
      <section className="w-full max-w-md border border-[#2a3439] bg-[#131a1e] p-5 sm:p-7">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#a0aaa7] hover:text-white">← Kembali ke toko</Link>
        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#c9f36a] text-[#12180b]"><Gamepad2 className="h-5 w-5" /></div>
          <div>
            <div className="font-extrabold">TOPUP<span className="text-[#c9f36a]">ML2</span></div>
            <div className="eyebrow mt-0.5">Admin sign in</div>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Masuk ke dashboard</h1>
        <p className="mt-1 text-sm text-[#a0aaa7]">Panel operasional TopupML2.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
