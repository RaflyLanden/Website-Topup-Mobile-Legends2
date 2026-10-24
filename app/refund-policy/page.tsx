import { Footer, SiteHeader } from "@/components/site-header";

export default function RefundPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell py-12">
        <div className="card p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Refund Policy</div>
          <h1 className="mt-2 text-4xl font-black">Kebijakan refund</h1>
          <div className="mt-5 space-y-4 text-sm text-slate-400">
            <p>Refund mengikuti hasil verifikasi provider dan status fulfillment yang dapat dibuktikan. Pesanan yang sudah dibayar dan diproses biasanya tidak dapat dikembalikan kecuali terdapat alasan teknis atau bisnis yang valid.</p>
            <p>Dalam situasi gagal atau expired, proses rekonsiliasi harus diaudit bila status pembayaran tidak jelas.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
