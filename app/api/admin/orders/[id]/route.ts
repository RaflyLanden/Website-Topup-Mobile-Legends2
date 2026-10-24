import { NextRequest, NextResponse } from "next/server";
import { transitionFulfillment, transitionPayment } from "@/lib/domain/status";
import { requireAdmin } from "@/lib/server/admin-guard";
import { getRepository } from "@/lib/server/repository";
import { generateNumericId } from "@/lib/server/numeric-id";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  if (!/^\d{1,20}$/.test(params.id)) return NextResponse.json({ error: "ID pesanan tidak valid." }, { status: 400 });
  const body = await request.json().catch(() => null);
  const order = await getRepository().getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  const nextOrder = { ...order };
  if (body?.paymentStatus) nextOrder.payment_status = transitionPayment(order, body.paymentStatus).payment_status;
  if (body?.fulfillmentStatus) nextOrder.fulfillment_status = transitionFulfillment({ ...nextOrder, payment_status: nextOrder.payment_status }, body.fulfillmentStatus).fulfillment_status;
  if (typeof body?.internalNote === "string") nextOrder.internal_note = body.internalNote;
  if (typeof body?.failureReason === "string") nextOrder.failure_reason = body.failureReason;
  nextOrder.updated_at = new Date().toISOString();
  const repository = getRepository();
  await repository.updateOrder(nextOrder as any);
  await repository.appendAudit({ log_id: generateNumericId((await repository.listAudit()).map((item) => item.log_id)), admin_id: admin.email, action: "ORDER_UPDATED", target_type: "order", target_id: params.id, details: JSON.stringify({ paymentStatus: nextOrder.payment_status, fulfillmentStatus: nextOrder.fulfillment_status }), created_at: nextOrder.updated_at });
  return NextResponse.json({ order: nextOrder });
}
