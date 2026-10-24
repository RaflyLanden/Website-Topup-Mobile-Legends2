import { NextResponse } from "next/server";
import { getRepository } from "@/lib/server/repository";

export async function GET(_request: Request, { params }: { params: { reference: string } }) {
  const order = await getRepository().getOrderByReference(params.reference);
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ order: {
    reference: order.public_order_reference,
    productName: order.product_name_snapshot,
    category: order.category_snapshot,
    quantity: order.quantity,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    fulfillmentStatus: order.fulfillment_status,
    totalAmount: order.total_amount,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    failureReason: order.failure_reason
  } }, { headers: { "Cache-Control": "no-store" } });
}
