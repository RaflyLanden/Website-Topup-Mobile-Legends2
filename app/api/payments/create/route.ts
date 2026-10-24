import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateTotal } from "@/lib/domain/pricing";
import { getRepository } from "@/lib/server/repository";
import { createProviderPayment } from "@/lib/server/payment";
import { allowAttempt } from "@/lib/server/rate-limit";
import { generateNumericId } from "@/lib/server/numeric-id";
import type { Order } from "@/lib/domain/types";

const schema = z.object({
  productId: z.string().regex(/^\d{1,20}$/),
  userId: z.string().regex(/^\d{4,16}$/),
  zoneId: z.string().regex(/^\d{1,8}$/),
  quantity: z.number().int().min(1).max(10),
  paymentMethod: z.enum(["gopay", "dana", "shopeepay", "bank_transfer"]),
  contact: z.string().max(160).optional().default(""),
  acceptedTerms: z.literal(true)
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowAttempt(`checkout:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi sebentar." }, { status: 429 });
  }
  const payload = schema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Data transaksi tidak valid." }, { status: 400 });
  }
  const enabledMethods = (process.env.PAYMENT_ENABLED_METHODS ?? "")
    .split(",").map((method) => method.trim().toLowerCase());
  if (process.env.PAYMENT_PROVIDER !== "midtrans" || !process.env.PAYMENT_SERVER_KEY || !enabledMethods.includes(payload.data.paymentMethod)) {
    return NextResponse.json({ error: "Metode pembayaran ini belum diaktifkan oleh operator." }, { status: 503 });
  }
  try {
    const repo = getRepository();
    const product = await repo.getProduct(payload.data.productId);
    if (!product || !product.is_active) return NextResponse.json({ error: "Produk tidak tersedia." }, { status: 404 });
    const createdAt = new Date().toISOString();
    const order: Order = {
      order_id: generateNumericId((await repo.listOrders()).map((item) => item.order_id)),
      public_order_reference: randomBytes(24).toString("base64url"),
      customer_contact: payload.data.contact,
      user_id: payload.data.userId,
      zone_id: payload.data.zoneId,
      product_id: product.product_id,
      product_name_snapshot: product.product_name,
      category_snapshot: product.category_name,
      quantity: payload.data.quantity,
      unit_price_snapshot: product.price,
      admin_fee: 0,
      total_amount: calculateTotal(product, payload.data.quantity),
      payment_method: payload.data.paymentMethod,
      payment_reference: "",
      payment_status: "PENDING",
      fulfillment_status: "WAITING_PAYMENT",
      customer_note: "",
      internal_note: "",
      failure_reason: "",
      created_at: createdAt,
      paid_at: "",
      completed_at: "",
      updated_at: createdAt
    };
    const provider = await createProviderPayment(order);
    if (!provider?.redirectUrl) {
      return NextResponse.json({ error: "Gateway belum mengembalikan instruksi pembayaran. Pesanan belum dibuat." }, { status: 502 });
    }
    order.payment_reference = provider.reference;
    await repo.createOrder(order);
    return NextResponse.json({ ok: true, reference: order.public_order_reference, paymentUrl: provider.redirectUrl, paymentReady: true }, { status: 201 });
  } catch (error) {
    console.error("Payment creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Transaksi pembayaran tidak dapat dibuat." }, { status: 503 });
  }
}
