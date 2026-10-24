import { Footer, SiteHeader } from "@/components/site-header";
import { OrderStatus } from "@/components/order-status";

export default async function OrderStatusPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <>
      <SiteHeader />
      <main className="section-shell min-h-[55vh] py-8 sm:py-12">
        <div className="mb-6">
          <div className="eyebrow mb-2">Lacak transaksi</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Status pesanan</h1>
          <p className="mt-2 text-sm text-[#a0aaa7]">Informasi pembayaran dan pengiriman ditampilkan terpisah.</p>
        </div>
        <OrderStatus reference={reference} />
      </main>
      <Footer />
    </>
  );
}
