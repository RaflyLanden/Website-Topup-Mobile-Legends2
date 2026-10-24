import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/domain/schemas";
import { calculateTotal } from "@/lib/domain/pricing";
import { getRepository } from "@/lib/server/repository";
import { generateNumericId } from "@/lib/server/numeric-id";

export async function POST(request: Request) {
  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data pesanan tidak valid." }, { status: 400 });
  try {
    const repository = getRepository();
    const product = await repository.getProduct(parsed.data.productId);
    if (!product || !product.is_active) return NextResponse.json({ error: "Produk tidak tersedia." }, { status: 404 });
    const now = new Date().toISOString();
    const order = {
      order_id: generateNumericId((await repository.listOrders()).map((item) => item.order_id)),
      public_order_reference: randomBytes(24).toString("base64url"),
      customer_contact: parsed.data.contact,
      user_id: parsed.data.userId,
      zone_id: parsed.data.zoneId,
      product_id: product.product_id,
      product_name_snapshot: product.product_name,
      category_snapshot: product.category_name,
      quantity: parsed.data.quantity,
      unit_price_snapshot: product.price,
      admin_fee: 0,
      total_amount: calculateTotal(product, parsed.data.quantity),
      payment_method: parsed.data.paymentMethod,
      payment_reference: "",
      payment_status: "PENDING",
      fulfillment_status: "WAITING_PAYMENT",
      customer_note: "",
      internal_note: "",
      failure_reason: "",
      created_at: now,
      paid_at: "",
      completed_at: "",
      updated_at: now
    };
    await repository.createOrder(order as any);
    return NextResponse.json({ order: { reference: order.public_order_reference, status: order.payment_status } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Pesanan belum dapat dibuat." }, { status: 503 });
  }
}
