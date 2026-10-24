import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { getRepository } from "@/lib/server/repository";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  return NextResponse.json({ orders: await getRepository().listOrders() });
}
