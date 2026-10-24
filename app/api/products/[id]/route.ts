import { NextResponse } from "next/server";
import type { Product } from "@/lib/domain/types";
import { getRepository } from "@/lib/server/repository";

function publicProduct({ cost_price: _costPrice, ...product }: Product) { return product; }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getRepository().getProduct(id);
  if (!product?.is_active) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ product: publicProduct(product) }, { headers: { "Cache-Control": "no-store" } });
}
