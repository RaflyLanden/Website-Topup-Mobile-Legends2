import { NextRequest, NextResponse } from "next/server";
import { productSchema } from "@/lib/domain/schemas";
import { requireAdmin } from "@/lib/server/admin-guard";
import { getRepository } from "@/lib/server/repository";
import type { Product } from "@/lib/domain/types";
import { generateNumericId } from "@/lib/server/numeric-id";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  if (!/^\d{1,20}$/.test(params.id)) return NextResponse.json({ error: "ID produk tidak valid." }, { status: 400 });
  const body: unknown = await request.json().catch(() => null);
  const parsed = productSchema.safeParse({ ...(typeof body === "object" && body !== null ? body : {}), product_id: params.id });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data produk tidak valid." }, { status: 400 });
  try {
    const repository = getRepository();
    const existing = await repository.getProduct(params.id);
    if (!existing) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    const category = (await repository.listCategories()).find((item) => item.category_id === parsed.data.category_id);
    if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan atau sedang nonaktif." }, { status: 400 });
    const updatedAt = new Date().toISOString();
    const product: Product = {
      ...existing,
      ...parsed.data,
      category_name: category.category_name,
      product_id: params.id,
      created_at: existing.created_at,
      updated_at: updatedAt
    };
    await repository.saveProduct(product);
    await repository.appendAudit({ log_id: generateNumericId((await repository.listAudit()).map((item) => item.log_id)), admin_id: admin.email, action: "PRODUCT_UPDATED", target_type: "product", target_id: params.id, details: "Update product", created_at: product.updated_at });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Produk tidak dapat diperbarui. Periksa koneksi Google Sheets." }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  if (!/^\d{1,20}$/.test(params.id)) return NextResponse.json({ error: "ID produk tidak valid." }, { status: 400 });
  try {
    const repository = getRepository();
    if (!await repository.getProduct(params.id)) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    await repository.archiveProduct(params.id);
    await repository.appendAudit({ log_id: generateNumericId((await repository.listAudit()).map((item) => item.log_id)), admin_id: admin.email, action: "PRODUCT_ARCHIVED", target_type: "product", target_id: params.id, details: "Archive product", created_at: new Date().toISOString() });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Produk tidak dapat diarsipkan. Periksa koneksi Google Sheets." }, { status: 503 });
  }
}
