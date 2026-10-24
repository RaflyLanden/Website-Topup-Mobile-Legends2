import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  repo: {
    getOrderById: vi.fn(),
    updateOrder: vi.fn()
  },
  readRows: vi.fn(),
  appendPaymentLog: vi.fn()
}));

vi.mock("@/lib/server/repository", () => ({ getRepository: () => mocks.repo }));
vi.mock("@/lib/server/sheets", () => ({
  readRows: mocks.readRows,
  appendPaymentLog: mocks.appendPaymentLog
}));

import { POST } from "@/app/api/payments/webhook/route";

const baseOrder = {
  order_id: "100000000021",
  public_order_reference: "random-private-reference-abcdefghijkl",
  customer_contact: "",
  user_id: "12345678",
  zone_id: "1234",
  product_id: "100000000003",
  product_name_snapshot: "170 Diamonds",
  category_snapshot: "Diamond Gift",
  quantity: 1,
  unit_price_snapshot: 42000,
  admin_fee: 0,
  total_amount: 42000,
  payment_method: "gopay",
  payment_reference: "provider-ref",
  payment_status: "PENDING",
  fulfillment_status: "WAITING_PAYMENT",
  customer_note: "",
  internal_note: "",
  failure_reason: "",
  created_at: "2026-10-22T00:00:00.000Z",
  paid_at: "",
  completed_at: "",
  updated_at: "2026-10-22T00:00:00.000Z"
};

function makeRequest(overrides: Record<string, string> = {}) {
  const values = {
    order_id: baseOrder.order_id,
    status_code: "200",
    gross_amount: "42000.00",
    transaction_id: "midtrans-tx-1",
    transaction_status: "settlement",
    fraud_status: "accept",
    ...overrides
  };
  const signature_key = createHash("sha512")
    .update(values.order_id + values.status_code + values.gross_amount + process.env.PAYMENT_SERVER_KEY)
    .digest("hex");
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...values, signature_key })
  });
}

describe("Midtrans payment webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYMENT_SERVER_KEY = "sandbox-server-key";
    mocks.repo.getOrderById.mockResolvedValue({ ...baseOrder });
    mocks.repo.updateOrder.mockResolvedValue(undefined);
    mocks.readRows.mockResolvedValue([]);
    mocks.appendPaymentLog.mockResolvedValue(undefined);
  });

  it("marks a verified matching payment paid and queues fulfillment", async () => {
    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true, ignored: false });
    expect(mocks.repo.updateOrder).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: "PAID",
      fulfillment_status: "QUEUED",
      paid_at: expect.any(String)
    }));
    expect(mocks.appendPaymentLog).toHaveBeenCalledWith(expect.objectContaining({
      verification_status: "VERIFIED",
      event_type: "settlement:accept:200"
    }));
  });

  it("acknowledges duplicate provider events without repeating order updates", async () => {
    mocks.readRows.mockResolvedValue([{
      provider: "midtrans",
      provider_reference: "midtrans-tx-1",
      event_type: "settlement:accept:200"
    }]);

    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(mocks.repo.updateOrder).not.toHaveBeenCalled();
    expect(mocks.appendPaymentLog).not.toHaveBeenCalled();
  });

  it("does not confuse a challenged capture with an accepted capture", async () => {
    mocks.readRows.mockResolvedValue([{
      provider: "midtrans",
      provider_reference: "midtrans-tx-1",
      event_type: "capture:challenge:200"
    }]);

    const response = await POST(makeRequest({ transaction_status: "capture", fraud_status: "accept" }));
    expect(response.status).toBe(200);
    expect(mocks.repo.updateOrder).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: "PAID",
      fulfillment_status: "QUEUED"
    }));
  });

  it("rejects a notification whose signed amount differs from the order", async () => {
    const response = await POST(makeRequest({ gross_amount: "42001.00" }));
    expect(response.status).toBe(400);
    expect(mocks.repo.updateOrder).not.toHaveBeenCalled();
  });
});
