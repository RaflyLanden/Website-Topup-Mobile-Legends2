import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { getRepository } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = requireAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  try {
    const orders = await getRepository().listOrders();
    const today = new Date().toISOString().slice(0, 10);
    const paid = orders.filter((order) => order.payment_status === "PAID");
    return NextResponse.json({
      overview: {
        totalOrders: orders.length,
        todayOrders: orders.filter((order) => order.created_at.slice(0, 10) === today).length,
        revenue: paid.reduce((total, order) => total + order.total_amount, 0),
        pending: orders.filter((order) => order.payment_status === "PENDING").length,
        processing: orders.filter((order) => ["QUEUED", "PROCESSING"].includes(order.fulfillment_status)).length,
        completed: orders.filter((order) => order.fulfillment_status === "COMPLETED").length,
        failed: orders.filter((order) => order.payment_status === "FAILED" || order.fulfillment_status === "FAILED").length
      }
    });
  } catch {
    return NextResponse.json({ error: "Data dashboard tidak tersedia." }, { status: 503 });
  }
}
