import { NextResponse } from "next/server";
import type { PaymentMethod } from "@/lib/server/payment";

export const dynamic = "force-dynamic";

const allowedMethods: PaymentMethod[] = ["gopay", "dana", "shopeepay", "bank_transfer"];

export async function GET() {
  const configured = process.env.PAYMENT_PROVIDER === "midtrans" && Boolean(process.env.PAYMENT_SERVER_KEY);
  const explicitlyEnabled = (process.env.PAYMENT_ENABLED_METHODS ?? "")
    .split(",")
    .map((method) => method.trim().toLowerCase())
    .filter((method): method is PaymentMethod => allowedMethods.includes(method as PaymentMethod));

  return NextResponse.json({
    methods: configured ? explicitlyEnabled : [],
    configured,
    message: configured ? undefined : "Payment provider belum dikonfigurasi."
  }, { headers: { "Cache-Control": "no-store" } });
}
