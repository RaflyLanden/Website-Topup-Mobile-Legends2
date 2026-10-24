import { NextRequest, NextResponse } from "next/server";
import { productCreateSchema } from "@/lib/domain/schemas";
import { requireAdmin } from "@/lib/server/admin-guard";
import { getRepository } from "@/lib/server/repository";
import type { Product } from "@/lib/domain/types";
import { generateNumericId } from "@/lib/server/numeric-id";

export async function GET() {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  try {
    const repository = getRepository();
    const [products, categories] = await Promise.all([
      repository.listProducts(false),
      repository.listCategories()
    ]);
    return NextResponse.json({ products, categories }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Produk dan kategori tidak dapat dimuat." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  const parsed = productCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data produk tidak valid." }, { status: 400 });
  try {
    const repository = getRepository();
    const category = (await repository.listCategories()).find((item) => item.category_id === parsed.data.category_id);
    if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan atau sedang nonaktif." }, { status: 400 });
    const now = new Date().toISOString();
    const productId = generateNumericId((await repository.listProducts(false)).map((item) => item.product_id));
    const product: Product = { ...parsed.data, product_id: productId, category_name: category.category_name, created_at: now, updated_at: now };
    await repository.saveProduct(product);
    await repository.appendAudit({ log_id: generateNumericId((await repository.listAudit()).map((item) => item.log_id)), admin_id: admin.email, action: "PRODUCT_CREATED", target_type: "product", target_id: product.product_id, details: "Create product", created_at: now });
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Produk tidak dapat disimpan. Periksa koneksi Google Sheets." }, { status: 503 });
  }
}
