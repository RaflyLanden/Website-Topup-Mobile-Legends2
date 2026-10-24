import { Footer, SiteHeader } from "@/components/site-header";
import { OrderLookup } from "@/components/order-lookup";

export default function OrderLookupPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell min-h-[55vh] py-10 sm:py-14">
        <div className="eyebrow mb-2">Lacak transaksi</div>
        <h1 className="text-3xl font-bold tracking-tight">Cek status pesanan</h1>
        <p className="mt-2 max-w-xl text-sm text-[#a0aaa7]">Gunakan referensi akses pribadi yang didapat setelah membuat pesanan. Nomor transaksi yang mudah ditebak tidak cukup untuk membuka status.</p>
        <OrderLookup />
      </main>
      <Footer />
    </>
  );
}
