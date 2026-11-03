import Link from "next/link";
import Image from "next/image";
import { Boxes, LayoutDashboard, Package2, Settings, ShoppingCart, WalletCards } from "lucide-react";
import { AdminLogout } from "@/components/admin-logout";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package2 },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/admin/payments", label: "Pembayaran", icon: WalletCards },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  { href: "/admin/audit-logs", label: "Audit Log", icon: Boxes }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0c1114] text-[#f0f3ee]">
      <aside className="hidden w-60 shrink-0 border-r border-[#2a3439] bg-[#0a0e10] p-4 md:block">
        <div className="mb-8 flex items-center gap-2.5">
          <Image src="/logo-typostore.jpg" alt="" width={36} height={36} className="h-9 w-9 rounded-md object-cover" />
          <div>
            <div className="font-extrabold">typostore</div>
            <div className="text-xs text-[#77827e]">Operations</div>
          </div>
        </div>
        <div className="eyebrow mb-2 px-3">Workspace</div>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#a0aaa7] transition-colors hover:bg-[#182126] hover:text-white">
              <Icon className="h-4 w-4 shrink-0 text-[#77827e]" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8"><AdminLogout /></div>
      </aside>
      <div className="min-w-0 flex-1">
        <nav aria-label="Navigasi admin" className="flex gap-1 overflow-x-auto border-b border-[#2a3439] bg-[#0a0e10] px-3 py-2 md:hidden">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-1.5 rounded px-2.5 py-2 text-xs text-[#a0aaa7] hover:bg-[#182126] hover:text-white">
              <Icon className="h-3.5 w-3.5" />{label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
