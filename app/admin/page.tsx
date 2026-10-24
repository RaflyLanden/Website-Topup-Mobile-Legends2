import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getRepository } from "@/lib/server/repository";
import type { Order } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function money(amount: number) { return `Rp ${amount.toLocaleString("id-ID")}`; }

export default async function AdminOverviewPage() {
  let orders: Order[] = [];
  let error = false;
  try { orders = await getRepository().listOrders(); } catch { error = true; }
  const today = dateKey(new Date());
  const paid = orders.filter((order) => order.payment_status === "PAID");
  const pending = orders.filter((order) => order.payment_status === "PENDING");
  const processing = orders.filter((order) => ["PROCESSING", "QUEUED"].includes(order.fulfillment_status));
  const failed = orders.filter((order) => order.payment_status === "FAILED" || order.fulfillment_status === "FAILED");
  const todayOrders = orders.filter((order) => order.created_at.slice(0, 10) === today);
  const todayRevenue = paid.filter((order) => order.paid_at.slice(0, 10) === today).reduce((total, order) => total + order.total_amount, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = dateKey(date);
    return { key, label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }), count: paid.filter((order) => order.paid_at.slice(0, 10) === key).length };
  });
  const maxCount = Math.max(1, ...days.map((day) => day.count));

  return (
    <AdminShell>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div><div className="eyebrow mb-1">Operasional</div><h1 className="text-2xl font-bold tracking-tight">Ringkasan pesanan</h1></div>
        <Link href="/admin/orders" className="btn-secondary min-h-9 text-sm">Lihat pesanan <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {error ? (
        <div role="alert" className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#efc271]">Data Google Sheets tidak tersedia. Periksa koneksi dan konfigurasi service account.</div>
      ) : orders.length === 0 ? (
        <div className="border border-[#2a3439] bg-[#131a1e] p-5">
          <div className="font-semibold">Belum ada transaksi</div>
          <p className="mt-1 text-sm text-[#a0aaa7]">Angka operasional akan muncul setelah pesanan pelanggan tersimpan.</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 border-y border-[#2a3439] sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Semua pesanan", orders.length.toLocaleString("id-ID")],
              ["Hari ini", todayOrders.length.toLocaleString("id-ID")],
              ["Pendapatan hari ini", money(todayRevenue)],
              ["Pending", pending.length.toLocaleString("id-ID")],
              ["Dalam proses", processing.length.toLocaleString("id-ID")],
              ["Gagal", failed.length.toLocaleString("id-ID")]
            ].map(([label, value], index) => (
              <div key={label} className={`min-w-0 border-[#2a3439] px-3 py-4 sm:px-4 ${index % 2 === 0 ? "border-r" : ""} sm:border-r lg:border-r lg:last:border-r-0`}>
                <div className="truncate text-xs text-[#77827e]">{label}</div>
                <div className={`mt-1 truncate font-bold tabular-nums ${index === 2 ? "text-[#c9f36a]" : ""}`}>{value}</div>
              </div>
            ))}
          </section>
          <section className="mt-7 border border-[#2a3439] bg-[#131a1e] p-4 sm:p-5">
            <div className="mb-5 flex items-baseline justify-between">
              <div><h2 className="font-semibold">Pembayaran sukses</h2><p className="mt-0.5 text-xs text-[#77827e]">Order paid per hari, 7 hari terakhir</p></div>
              <span className="text-xs text-[#77827e]">Berdasarkan waktu pembayaran</span>
            </div>
            <div className="flex h-40 items-end gap-2 sm:gap-4" aria-label="Grafik pembayaran sukses">
              {days.map((day) => (
                <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[11px] tabular-nums text-[#a0aaa7]">{day.count || ""}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div className="mx-auto w-full max-w-10 rounded-t-sm bg-[#c9f36a]" style={{ height: `${Math.max(3, (day.count / maxCount) * 100)}%` }} title={`${day.label}: ${day.count}`} />
                  </div>
                  <span className="text-[10px] text-[#77827e]">{day.label}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Perlu ditindaklanjuti</h2><Link href="/admin/orders" className="text-xs text-[#c9f36a]">Buka daftar</Link></div>
            <div className="divide-y divide-[#2a3439] border-y border-[#2a3439]">
              {orders.filter((order) => order.payment_status === "PAID" && ["QUEUED", "PROCESSING", "FAILED"].includes(order.fulfillment_status)).slice(0, 5).map((order) => (
                <div key={order.order_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><div className="font-medium">{order.product_name_snapshot}</div><div className="mt-0.5 font-mono text-xs text-[#77827e]">{order.order_id}</div></div>
                  <div className="text-right"><div className="text-sm font-semibold text-[#efc271]">{order.fulfillment_status}</div><div className="text-xs text-[#77827e]">{money(order.total_amount)}</div></div>
                </div>
              ))}
              {processing.length === 0 ? <div className="py-4 text-sm text-[#77827e]">Tidak ada pembayaran yang menunggu fulfillment.</div> : null}
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}
