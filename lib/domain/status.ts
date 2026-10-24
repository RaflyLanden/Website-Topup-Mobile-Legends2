import type { FulfillmentStatus, Order, PaymentStatus } from "./types";

const paymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["PAID", "FAILED", "EXPIRED"],
  PAID: ["REFUNDED"],
  FAILED: [],
  EXPIRED: [],
  REFUNDED: []
};
const fulfillmentTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  WAITING_PAYMENT: ["QUEUED", "REFUND_PENDING"],
  QUEUED: ["PROCESSING", "FAILED", "REFUND_PENDING"],
  PROCESSING: ["COMPLETED", "FAILED", "REFUND_PENDING"],
  COMPLETED: [],
  FAILED: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: []
};

export function transitionPayment(order: Order, status: PaymentStatus, now = new Date().toISOString()): Order {
  if (order.payment_status === status) return order;
  if (!paymentTransitions[order.payment_status].includes(status)) throw new Error("Transisi pembayaran tidak diizinkan.");
  return { ...order, payment_status: status, paid_at: status === "PAID" ? now : order.paid_at, updated_at: now };
}

export function transitionFulfillment(order: Order, status: FulfillmentStatus, now = new Date().toISOString()): Order {
  if (order.fulfillment_status === status) return order;
  if (!fulfillmentTransitions[order.fulfillment_status].includes(status)) throw new Error("Transisi fulfillment tidak diizinkan.");
  if (status === "QUEUED" && order.payment_status !== "PAID") throw new Error("Pesanan harus sudah dibayar sebelum antrean fulfillment.");
  if ((status === "REFUND_PENDING" || status === "REFUNDED") && order.payment_status !== "PAID" && order.payment_status !== "REFUNDED") {
    throw new Error("Refund hanya dapat diproses untuk pembayaran yang terverifikasi.");
  }
  return {
    ...order,
    fulfillment_status: status,
    completed_at: status === "COMPLETED" ? now : order.completed_at,
    updated_at: now
  };
}
