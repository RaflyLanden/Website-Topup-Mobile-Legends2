import Link from "next/link";
import { Footer, SiteHeader } from "@/components/site-header";

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell min-h-[55vh] py-10 sm:py-14">
        <div className="eyebrow mb-2">Checkout</div>
        <h1 className="text-3xl font-bold tracking-tight">Sesi checkout tidak tersedia</h1>
        <p className="mt-3 max-w-xl text-sm text-[#a0aaa7]">Untuk memastikan harga dan ketersediaan terbaru, pilih produk dan masukkan detail akun dari alur top up.</p>
        <Link href="/topup/mobile-legends" className="btn-primary mt-6">Kembali ke katalog</Link>
      </main>
      <Footer />
    </>
  );
}
