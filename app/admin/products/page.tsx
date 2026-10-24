import { AdminShell } from "@/components/admin-shell";
import { AdminProductsManager } from "@/components/admin-products-manager";
import { getRepository } from "@/lib/server/repository";
import type { Category, Product } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products: Product[] = [];
  let categories: Category[] = [];
  let error = false;
  try {
    const repository = getRepository();
    [products, categories] = await Promise.all([
      repository.listProducts(false),
      repository.listCategories()
    ]);
  } catch {
    error = true;
  }

  return (
    <AdminShell>
      <AdminProductsManager initialProducts={products} categories={categories} initialError={error} />
    </AdminShell>
  );
}
