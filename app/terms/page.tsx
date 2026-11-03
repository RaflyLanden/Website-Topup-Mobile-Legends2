import { Footer, SiteHeader } from "@/components/site-header";

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell py-12">
        <div className="card p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Syarat Layanan</div>
          <h1 className="mt-2 text-4xl font-black">Ketentuan penggunaan</h1>
          <div className="mt-5 space-y-4 text-sm text-slate-400">
            <p>typostore menyediakan layanan top-up digital yang dibuat untuk operasi bisnis dan memerlukan validasi order secara server-side.</p>
            <p>Pelanggan bertanggung jawab atas keakuratan User ID dan Zone ID. Harga dan status yang muncul di website harus dianggap sebagai data yang diterbitkan oleh server resmi.</p>
            <p>Metode login akun atau gift memiliki aturan yang berbeda dan tidak otomatis berlaku untuk semua produk. Penjualan tidak dianggap selesai sebelum status pembayaran dan fulfillment diverifikasi.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
