import { describe, expect, it } from "vitest";
import { transitionFulfillment, transitionPayment } from "@/lib/domain/status";

const baseOrder = {
  order_id: "100000000020",
  public_order_reference: "ref-1",
  customer_contact: "test@example.com",
  user_id: "12345678",
  zone_id: "1234",
  product_id: "100000000001",
  product_name_snapshot: "170 Diamonds",
  category_snapshot: "Diamond Gift",
  quantity: 1,
  unit_price_snapshot: 42000,
  admin_fee: 0,
  total_amount: 42000,
  payment_method: "gopay",
  payment_reference: "",
  payment_status: "PENDING",
  fulfillment_status: "WAITING_PAYMENT",
  customer_note: "",
  internal_note: "",
  failure_reason: "",
  created_at: "2026-01-01Z",
  paid_at: "",
  completed_at: "",
  updated_at: "2026-01-01Z"
};

describe("status transitions", () => {
  it("allows payment to advance to PAID then fulfillment queue", () => {
    const paid = transitionPayment(baseOrder as any, "PAID");
    expect(paid.payment_status).toBe("PAID");
    const queued = transitionFulfillment({ ...paid, payment_status: "PAID" } as any, "QUEUED");
    expect(queued.fulfillment_status).toBe("QUEUED");
  });

  it("blocks fulfillment before payment confirmation", () => {
    expect(() => transitionFulfillment(baseOrder as any, "QUEUED")).toThrow();
  });
});
