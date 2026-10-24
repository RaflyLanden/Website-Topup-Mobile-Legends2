import { NextResponse } from "next/server";
import type { Product } from "@/lib/domain/types";
import { getRepository } from "@/lib/server/repository";

function publicProduct({ cost_price: _costPrice, ...product }: Product) { return product; }

export async function GET() {
  try {
    const [products, categories] = await Promise.all([
      getRepository().listProducts(),
      getRepository().listCategories()
    ]);
    return NextResponse.json({ products: products.map(publicProduct), categories }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Produk belum tersedia." }, { status: 503 });
  }
}
