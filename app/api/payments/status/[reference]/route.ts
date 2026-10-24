import { NextResponse } from "next/server";
import { getRepository } from "@/lib/server/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await getRepository().getOrderByReference(reference);
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  return NextResponse.json({
    reference: order.public_order_reference,
    paymentStatus: order.payment_status,
    fulfillmentStatus: order.fulfillment_status,
    total: order.total_amount
  });
}
