import { createHash } from "node:crypto";
import type { Order } from "@/lib/domain/types";

export type PaymentMethod = "gopay" | "dana" | "shopeepay" | "bank_transfer";
const channelMap: Record<PaymentMethod, string> = {
  gopay: "gopay", dana: "dana", shopeepay: "shopeepay", bank_transfer: "bank_transfer"
};

export async function createProviderPayment(order: Order): Promise<{ reference: string; redirectUrl: string } | null> {
  if (process.env.PAYMENT_PROVIDER !== "midtrans" || !process.env.PAYMENT_SERVER_KEY) return null;
  const base = process.env.MIDTRANS_ENVIRONMENT === "production"
    ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
  const response = await fetch(`${base}/v2/charge`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.PAYMENT_SERVER_KEY}:`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      payment_type: channelMap[order.payment_method as PaymentMethod],
      transaction_details: { order_id: order.order_id, gross_amount: order.total_amount },
      ...(order.payment_method === "bank_transfer" ? { bank_transfer: { bank: process.env.MIDTRANS_BANK ?? "bca" } } : {}),
      ...(order.payment_method === "gopay" ? { gopay: { enable_callback: true, callback_url: process.env.NEXT_PUBLIC_APP_URL } } : {}),
      ...(order.payment_method === "dana" ? { dana: { callback_url: process.env.NEXT_PUBLIC_APP_URL } } : {}),
      ...(order.payment_method === "shopeepay" ? { shopeepay: { callback_url: process.env.NEXT_PUBLIC_APP_URL } } : {})
    })
  });
  const data = await response.json() as { transaction_id?: string; actions?: { name?: string; url?: string }[]; redirect_url?: string; status_message?: string };
  if (!response.ok) throw new Error(data.status_message || "Penyedia pembayaran menolak pembuatan transaksi.");
  const redirectUrl = data.redirect_url ?? data.actions?.find((action) => action.name === "deeplink-redirect")?.url ?? "";
  return { reference: data.transaction_id ?? order.order_id, redirectUrl };
}

export function verifyMidtransSignature(input: { order_id: string; status_code: string; gross_amount: string; signature_key: string }): boolean {
  const key = process.env.PAYMENT_SERVER_KEY;
  if (!key) return false;
  const expected = createHash("sha512").update(input.order_id + input.status_code + input.gross_amount + key).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(input.signature_key);
  return left.length === right.length && require("node:crypto").timingSafeEqual(left, right);
}

export function normalizePaymentStatus(status: string, fraud?: string): "PAID" | "PENDING" | "FAILED" | "EXPIRED" | "REFUNDED" {
  if (status === "settlement" || (status === "capture" && fraud === "accept")) return "PAID";
  if (status === "pending" || (status === "capture" && fraud === "challenge")) return "PENDING";
  if (status === "expire") return "EXPIRED";
  if (status === "refund") return "REFUNDED";
  return "FAILED";
}
