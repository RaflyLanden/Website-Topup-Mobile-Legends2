import Link from "next/link";
import { CircleHelp, Gamepad2, Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2a3439] bg-[#0c1114]">
      <div className="section-shell flex min-h-[68px] items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="TopupML2 beranda">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#c9f36a] text-[#12180b]">
            <Gamepad2 className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight">TOPUP<span className="text-[#c9f36a]">ML2</span></div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#77827e]">Game commerce</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#a0aaa7] md:flex">
          <Link href="/topup/mobile-legends" className="transition hover:text-white">Top Up</Link>
          <Link href="/order" className="transition hover:text-white">Cek pesanan</Link>
          <Link href="/help" className="transition hover:text-white">Bantuan</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/help" aria-label="Bantuan" className="btn-secondary min-h-10 px-2.5 md:hidden"><CircleHelp className="h-4 w-4" /></Link>
          <Link href="/order" className="btn-secondary hidden min-h-10 sm:inline-flex"><Search className="h-4 w-4" /> Cari order</Link>
          <Link href="/topup/mobile-legends" className="btn-primary min-h-10 px-3">Isi ulang</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#2a3439] bg-[#0a0e10]">
      <div className="section-shell grid gap-8 py-9 sm:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#c9f36a] text-[#12180b]">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div className="font-extrabold tracking-tight">TOPUP<span className="text-[#c9f36a]">ML2</span></div>
          </div>
          <p className="max-w-xs text-sm text-[#a0aaa7]">Top up Mobile Legends dengan rincian biaya dan status pesanan yang jelas.</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Jelajahi</h4>
          <ul className="space-y-2 text-sm text-[#a0aaa7]">
            <li><Link href="/topup/mobile-legends">Top Up</Link></li>
            <li><Link href="/order">Cek pesanan</Link></li>
            <li><Link href="/help">Bantuan</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Informasi</h4>
          <ul className="space-y-2 text-sm text-[#a0aaa7]">
            <li><Link href="/terms">Syarat Layanan</Link></li>
            <li><Link href="/privacy">Kebijakan Privasi</Link></li>
            <li><Link href="/refund-policy">Kebijakan refund</Link></li>
          </ul>
        </div>
      </div>
      <div className="section-shell border-t border-[#20292d] py-4 text-xs text-[#77827e]">© {new Date().getFullYear()} TopupML2. Bukan situs resmi Mobile Legends: Bang Bang.</div>
    </footer>
  );
}
