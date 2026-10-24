import Link from "next/link";
import { ArrowRight, ArrowUpRight, CircleHelp, Clock3, Gamepad2 } from "lucide-react";
import { Footer, SiteHeader } from "@/components/site-header";
import { getRepository } from "@/lib/server/repository";
import type { Product } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products: Product[] = [];
  let catalogAvailable = true;
  try {
    products = (await getRepository().listProducts()).filter((product) => product.is_active);
  } catch {
    catalogAvailable = false;
  }
  const featured = products.filter((product) => product.is_featured).slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main className="section-shell">
        <section className="grid gap-7 border-b border-[#2a3439] py-9 sm:py-12 lg:grid-cols-[1fr_330px] lg:items-end">
          <div>
            <div className="eyebrow mb-3 flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-[#c9f36a]" /> Mobile Legends: Bang Bang</div>
            <h1 className="max-w-2xl text-[2rem] font-bold leading-tight tracking-tight sm:text-5xl">Diamond dan item MLBB, <span className="text-[#c9f36a]">tanpa bertele-tele.</span></h1>
            <p className="mt-4 max-w-xl text-[15px] text-[#a0aaa7]">Pilih paket, masukkan User ID, lalu tinjau pembayaran sebelum lanjut. Harga tampil dari katalog server.</p>
            <Link href="/topup/mobile-legends" className="btn-primary mt-6">Pilih produk <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="border-l-2 border-[#c9f36a] pl-4">
            <div className="eyebrow mb-3">Sebelum memesan</div>
            <ul className="space-y-2.5 text-sm text-[#c4ccc8]">
              <li className="flex gap-2"><span className="text-[#c9f36a]">01</span> Siapkan User ID dan Zone ID.</li>
              <li className="flex gap-2"><span className="text-[#c9f36a]">02</span> Periksa metode kirim tiap paket.</li>
              <li className="flex gap-2"><span className="text-[#c9f36a]">03</span> Simpan referensi untuk cek status.</li>
            </ul>
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow mb-1">Katalog</div>
              <h2 className="text-xl font-bold tracking-tight">Paket pilihan</h2>
            </div>
            <Link href="/topup/mobile-legends" className="inline-flex items-center gap-1 text-sm font-semibold text-[#c9f36a]">Semua produk <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          {!catalogAvailable ? (
            <div className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#a0aaa7]">
              Katalog belum dapat dimuat. Sambungkan Google Sheets untuk menampilkan produk yang tersedia.
            </div>
          ) : featured.length === 0 ? (
            <div className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#a0aaa7]">
              Produk unggulan belum diatur. Lihat katalog untuk memeriksa ketersediaan produk.
            </div>
          ) : (
            <div className="divide-y divide-[#2a3439] border-y border-[#2a3439]">
              {featured.map((product) => (
                <Link key={product.product_id} href="/topup/mobile-legends" className="group flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-[#131a1e] sm:px-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#77827e]">{product.category_name} · {product.delivery_method}</div>
                    <div className="mt-1 font-semibold">{product.product_name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-[#77827e]">Harga</div>
                      <div className="font-bold tabular-nums">Rp {product.price.toLocaleString("id-ID")}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#77827e] transition group-hover:text-[#c9f36a]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 border-t border-[#2a3439] py-8 sm:grid-cols-3">
          <div className="flex gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9f36a]" />
            <div><h3 className="text-sm font-semibold">Estimasi per produk</h3><p className="mt-1 text-sm text-[#a0aaa7]">Waktu proses mengikuti metode yang ditampilkan pada produk.</p></div>
          </div>
          <div className="flex gap-3">
            <Gamepad2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9f36a]" />
            <div><h3 className="text-sm font-semibold">ID dicek formatnya</h3><p className="mt-1 text-sm text-[#a0aaa7]">Kami tidak mengklaim nama akun terverifikasi tanpa integrasi resmi.</p></div>
          </div>
          <div className="flex gap-3">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#c9f36a]" />
            <div><h3 className="text-sm font-semibold">Bantuan transaksi</h3><p className="mt-1 text-sm text-[#a0aaa7]"><Link className="underline decoration-[#77827e] underline-offset-4" href="/help">Baca panduan pembayaran dan status order.</Link></p></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
