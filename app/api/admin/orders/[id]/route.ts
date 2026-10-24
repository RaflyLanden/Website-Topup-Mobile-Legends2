import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transitionFulfillment, transitionPayment } from "@/lib/domain/status";
import { requireAdmin } from "@/lib/server/admin-guard";
import { getRepository } from "@/lib/server/repository";
import { generateNumericId } from "@/lib/server/numeric-id";

const updateSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"]).optional(),
  fulfillmentStatus: z.enum(["WAITING_PAYMENT", "QUEUED", "PROCESSING", "COMPLETED", "FAILED", "REFUND_PENDING", "REFUNDED"]).optional(),
  internalNote: z.string().optional(),
  failureReason: z.string().optional()
}).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  if (!/^\d{1,20}$/.test(id)) return NextResponse.json({ error: "ID pesanan tidak valid." }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });
  const body = parsed.data;
  const order = await getRepository().getOrderById(id);
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  const nextOrder = { ...order };
  if (body.paymentStatus) nextOrder.payment_status = transitionPayment(order, body.paymentStatus).payment_status;
  if (body.fulfillmentStatus) nextOrder.fulfillment_status = transitionFulfillment({ ...nextOrder, payment_status: nextOrder.payment_status }, body.fulfillmentStatus).fulfillment_status;
  if (body.internalNote !== undefined) nextOrder.internal_note = body.internalNote;
  if (body.failureReason !== undefined) nextOrder.failure_reason = body.failureReason;
  nextOrder.updated_at = new Date().toISOString();
  const repository = getRepository();
  await repository.updateOrder(nextOrder as any);
  await repository.appendAudit({ log_id: generateNumericId((await repository.listAudit()).map((item) => item.log_id)), admin_id: admin.email, action: "ORDER_UPDATED", target_type: "order", target_id: id, details: JSON.stringify({ paymentStatus: nextOrder.payment_status, fulfillmentStatus: nextOrder.fulfillment_status }), created_at: nextOrder.updated_at });
  return NextResponse.json({ order: nextOrder });
}
