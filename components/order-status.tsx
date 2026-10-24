"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CircleHelp, Clock3, LoaderCircle } from "lucide-react";

interface PublicOrder {
  reference: string;
  productName: string;
  category: string;
  quantity: number;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  failureReason: string;
}

const paymentLabel: Record<string, string> = {
  PENDING: "Menunggu pembayaran",
  PAID: "Pembayaran diterima",
  FAILED: "Pembayaran gagal",
  EXPIRED: "Kedaluwarsa",
  REFUNDED: "Dikembalikan"
};
const fulfillmentLabel: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu pembayaran",
  QUEUED: "Dalam antrean",
  PROCESSING: "Sedang diproses",
  COMPLETED: "Selesai",
  FAILED: "Pengiriman gagal",
  REFUND_PENDING: "Refund ditinjau",
  REFUNDED: "Refund selesai"
};

export function OrderStatus({ reference }: { reference: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(reference)}`, { cache: "no-store" });
        const result = await response.json() as { order?: PublicOrder; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error || "Referensi pesanan tidak ditemukan.");
        if (active) {
          setOrder(result.order);
          setError("");
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Status pesanan belum dapat dimuat.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [reference]);

  if (loading) return <div className="flex items-center gap-2 py-12 text-sm text-[#a0aaa7]"><LoaderCircle className="h-4 w-4 animate-spin" /> Memuat status…</div>;
  if (error || !order) return <div role="alert" className="flex items-start gap-3 border border-[#593b3b] bg-[#211819] p-4 text-sm text-[#f2b0b0]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error || "Referensi pesanan tidak ditemukan."}</span></div>;

  const isComplete = order.fulfillmentStatus === "COMPLETED";
  const isFailed = ["FAILED", "REFUNDED"].includes(order.paymentStatus) || order.fulfillmentStatus === "FAILED";
  const tone = isComplete ? "text-[#85d2a3]" : isFailed ? "text-[#ee8181]" : "text-[#efc271]";
  return (
    <div className="border border-[#2a3439] bg-[#131a1e]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2a3439] p-4 sm:p-5">
        <div className="min-w-0">
          <div className="eyebrow">Referensi pesanan</div>
          <div className="mt-1 break-all font-mono text-sm">{order.reference}</div>
        </div>
        <span className={`flex items-center gap-1.5 text-sm font-semibold ${tone}`}>
          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          {fulfillmentLabel[order.fulfillmentStatus] ?? order.fulfillmentStatus}
        </span>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <div className="eyebrow">Produk</div>
          <div className="mt-1 font-semibold">{order.productName}</div>
          <div className="mt-1 text-sm text-[#a0aaa7]">{order.category} · Qty {order.quantity}</div>
        </div>
        <div>
          <div className="eyebrow">Total</div>
          <div className="mt-1 font-bold tabular-nums">Rp {order.totalAmount.toLocaleString("id-ID")}</div>
          <div className="mt-1 text-sm text-[#a0aaa7]">{order.paymentMethod.replaceAll("_", " ")}</div>
        </div>
        <div className="border-t border-[#2a3439] pt-4">
          <div className="eyebrow">Pembayaran</div>
          <div className={`mt-1 text-sm font-semibold ${order.paymentStatus === "PAID" ? "text-[#85d2a3]" : "text-[#efc271]"}`}>{paymentLabel[order.paymentStatus] ?? order.paymentStatus}</div>
        </div>
        <div className="border-t border-[#2a3439] pt-4">
          <div className="eyebrow">Diperbarui</div>
          <div className="mt-1 text-sm text-[#c4ccc8]">{new Date(order.updatedAt).toLocaleString("id-ID")}</div>
        </div>
      </div>
      {order.failureReason ? <div className="border-t border-[#593b3b] bg-[#211819] p-4 text-sm text-[#f2b0b0]">{order.failureReason}</div> : null}
      <div className="flex items-start gap-2 border-t border-[#2a3439] p-4 text-xs text-[#a0aaa7]">
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#c9f36a]" /> Status diperbarui otomatis setiap 15 detik. Jika ada kendala, siapkan referensi ini saat menghubungi bantuan.
      </div>
    </div>
  );
}
