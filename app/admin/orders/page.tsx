import { getRepository } from "@/lib/server/repository";
import { AdminShell } from "@/components/admin-shell";
import type { Order } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

function amount(value: number) { return `Rp ${value.toLocaleString("id-ID")}`; }

export default async function AdminOrdersPage() {
  let orders: Order[] = [];
  let error = false;
  try { orders = (await getRepository().listOrders()).sort((a, b) => b.created_at.localeCompare(a.created_at)); } catch { error = true; }
  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div><div className="eyebrow mb-1">Operasional</div><h1 className="text-2xl font-bold tracking-tight">Pesanan</h1></div>
        <span className="text-sm text-[#77827e]">{error ? "Data tidak tersedia" : `${orders.length} order`}</span>
      </div>
      {error ? <div role="alert" className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#efc271]">Pesanan tidak dapat dimuat dari Google Sheets.</div> : orders.length === 0 ? (
        <div className="border border-[#2a3439] bg-[#131a1e] p-5"><div className="font-semibold">Belum ada pesanan</div><p className="mt-1 text-sm text-[#a0aaa7]">Transaksi baru akan tercatat di sini setelah disimpan.</p></div>
      ) : (
        <div className="overflow-x-auto border-y border-[#2a3439]">
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#77827e]">
              <tr><th className="px-3 py-3 font-semibold">Order / waktu</th><th className="px-3 py-3 font-semibold">Produk / ID game</th><th className="px-3 py-3 text-right font-semibold">Total</th><th className="px-3 py-3 font-semibold">Pembayaran</th><th className="px-3 py-3 font-semibold">Fulfillment</th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id} className="border-t border-[#2a3439]">
                  <td className="px-3 py-3"><div className="font-mono text-xs">{order.public_order_reference}</div><div className="mt-1 text-xs text-[#77827e]">{new Date(order.created_at).toLocaleString("id-ID")}</div></td>
                  <td className="px-3 py-3"><div className="font-semibold">{order.product_name_snapshot}</div><div className="mt-0.5 text-xs text-[#77827e]">{order.user_id} ({order.zone_id})</div></td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{amount(order.total_amount)}</td>
                  <td className="px-3 py-3"><span className={`badge ${order.payment_status === "PAID" ? "border-[#365743] text-[#85d2a3]" : order.payment_status === "FAILED" || order.payment_status === "EXPIRED" ? "border-[#593b3b] text-[#ee8181]" : "border-[#665537] text-[#efc271]"}`}>{order.payment_status}</span></td>
                  <td className="px-3 py-3 text-xs text-[#c4ccc8]">{order.fulfillment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
