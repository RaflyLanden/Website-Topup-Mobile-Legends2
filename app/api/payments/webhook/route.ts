import { NextResponse } from "next/server";
import { z } from "zod";
import { transitionFulfillment, transitionPayment } from "@/lib/domain/status";
import { getRepository } from "@/lib/server/repository";
import { appendPaymentLog, readRows } from "@/lib/server/sheets";
import { normalizePaymentStatus, verifyMidtransSignature } from "@/lib/server/payment";
import { generateNumericId } from "@/lib/server/numeric-id";

export const dynamic = "force-dynamic";

const notificationSchema = z.object({
  order_id: z.string().regex(/^\d{1,20}$/),
  status_code: z.string().regex(/^\d{3}$/),
  gross_amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  signature_key: z.string().regex(/^[a-fA-F0-9]{128}$/),
  transaction_id: z.string().min(1).max(200),
  transaction_status: z.enum(["capture", "settlement", "pending", "deny", "cancel", "expire", "failure", "refund"]),
  fraud_status: z.enum(["accept", "challenge", "deny"]).optional()
});

export async function POST(request: Request) {
  const parsed = notificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Payload notifikasi tidak valid." }, { status: 400 });
  const notification = parsed.data;
  if (!verifyMidtransSignature(notification)) return NextResponse.json({ error: "Signature notifikasi tidak valid." }, { status: 401 });

  try {
    const repo = getRepository();
    const order = await repo.getOrderById(notification.order_id);
    if (!order || Number(notification.gross_amount) !== order.total_amount) {
      return NextResponse.json({ error: "Order atau nominal transaksi tidak cocok." }, { status: 400 });
    }

    const existingEvents = await readRows<Record<string, string>>("PaymentLogs");
    const eventType = `${notification.transaction_status}:${notification.fraud_status ?? "none"}:${notification.status_code}`;
    if (existingEvents.some((event) =>
      event.provider === "midtrans" &&
      event.provider_reference === notification.transaction_id &&
      event.event_type === eventType
    )) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const nextStatus = normalizePaymentStatus(notification.transaction_status, notification.fraud_status);
    const now = new Date().toISOString();
    let verificationStatus = "VERIFIED";
    let errorCode = "";
    if (order.payment_status !== nextStatus) {
      let transitioned: ReturnType<typeof transitionPayment> | null = null;
      try {
        transitioned = transitionPayment(order, nextStatus, now);
      } catch {
        verificationStatus = "VERIFIED_IGNORED";
        errorCode = "STALE_OR_TERMINAL_STATUS";
      }
      if (transitioned) {
        const updated = { ...order, payment_status: transitioned.payment_status, paid_at: transitioned.paid_at, updated_at: now };
        if (nextStatus === "PAID" && updated.fulfillment_status === "WAITING_PAYMENT") {
          updated.fulfillment_status = transitionFulfillment(updated, "QUEUED", now).fulfillment_status;
        }
        if (nextStatus === "REFUNDED" && ["QUEUED", "PROCESSING", "FAILED"].includes(updated.fulfillment_status)) {
          updated.fulfillment_status = transitionFulfillment(updated, "REFUND_PENDING", now).fulfillment_status;
        }
        await repo.updateOrder(updated);
      }
    }

    await appendPaymentLog({
      log_id: generateNumericId(existingEvents.map((event) => event.log_id)),
      order_id: order.order_id,
      provider: "midtrans",
      provider_reference: notification.transaction_id,
      event_type: eventType,
      verification_status: verificationStatus,
      event_timestamp: now,
      processed_at: now,
      error_code: errorCode
    });
    return NextResponse.json({ received: true, ignored: verificationStatus === "VERIFIED_IGNORED" });
  } catch (error) {
    console.error("Midtrans notification processing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Notifikasi pembayaran belum dapat diproses." }, { status: 503 });
  }
}
