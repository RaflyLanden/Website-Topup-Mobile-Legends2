import { AdminShell } from "@/components/admin-shell";
import { getRepository } from "@/lib/server/repository";
import type { Order } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  let orders: Order[] = [];
  let error = false;
  try { orders = (await getRepository().listOrders()).sort((a, b) => b.created_at.localeCompare(a.created_at)); } catch { error = true; }
  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div><div className="eyebrow mb-1">Rekonsiliasi</div><h1 className="text-2xl font-bold tracking-tight">Pembayaran</h1></div>
        <span className="text-sm text-[#77827e]">{error ? "Data tidak tersedia" : `${orders.length} transaksi`}</span>
      </div>
      <p className="mb-5 max-w-2xl text-sm text-[#a0aaa7]">Status dibaca dari catatan pesanan. Konfirmasi pembayaran harus berasal dari provider terverifikasi; halaman ini tidak menyediakan tindakan manual untuk mengubah pembayaran menjadi sukses.</p>
      {error ? <div role="alert" className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#efc271]">Pembayaran tidak dapat dimuat dari Google Sheets.</div> : orders.length === 0 ? (
        <div className="border border-[#2a3439] bg-[#131a1e] p-5"><div className="font-semibold">Belum ada pembayaran</div><p className="mt-1 text-sm text-[#a0aaa7]">Transaksi yang tercatat akan muncul di sini.</p></div>
      ) : (
        <div className="overflow-x-auto border-y border-[#2a3439]">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#77827e]"><tr><th className="px-3 py-3 font-semibold">Waktu order</th><th className="px-3 py-3 font-semibold">Referensi</th><th className="px-3 py-3 font-semibold">Metode</th><th className="px-3 py-3 text-right font-semibold">Nominal</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Provider ref</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id} className="border-t border-[#2a3439]">
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-[#a0aaa7]">{new Date(order.created_at).toLocaleString("id-ID")}</td>
                  <td className="px-3 py-3 font-mono text-xs">{order.public_order_reference}</td>
                  <td className="px-3 py-3 capitalize">{order.payment_method.replaceAll("_", " ")}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">Rp {order.total_amount.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-3"><span className={`badge ${order.payment_status === "PAID" ? "border-[#365743] text-[#85d2a3]" : order.payment_status === "FAILED" || order.payment_status === "EXPIRED" ? "border-[#593b3b] text-[#ee8181]" : "border-[#665537] text-[#efc271]"}`}>{order.payment_status}</span></td>
                  <td className="px-3 py-3 font-mono text-xs text-[#77827e]">{order.payment_reference || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
