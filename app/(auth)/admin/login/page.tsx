import Link from "next/link";
import Image from "next/image";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c1114] px-4 py-8">
      <section className="w-full max-w-md border border-[#2a3439] bg-[#131a1e] p-5 sm:p-7">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#a0aaa7] hover:text-white">← Kembali ke toko</Link>
        <div className="mt-8 flex items-center gap-3">
          <Image src="/logo-typostore.jpg" alt="" width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
          <div>
            <div className="font-extrabold">typostore</div>
            <div className="eyebrow mt-0.5">Admin sign in</div>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Masuk ke dashboard</h1>
        <p className="mt-1 text-sm text-[#a0aaa7]">Panel operasional typostore.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
