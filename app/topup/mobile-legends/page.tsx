import { Footer, SiteHeader } from "@/components/site-header";
import { CustomerTopup } from "@/components/customer-topup";

export default function TopupPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell pb-8 pt-7 sm:pt-10">
        <div className="mb-7 border-b border-[#2a3439] pb-5">
          <div className="eyebrow mb-2">Game / Mobile Legends: Bang Bang</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Top up MLBB</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#a0aaa7]">Isi detail akun, pilih paket, lalu periksa ringkasan sebelum membuat pesanan.</p>
        </div>
        <CustomerTopup />
      </main>
      <Footer />
    </>
  );
}
