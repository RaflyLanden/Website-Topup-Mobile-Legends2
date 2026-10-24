import type { AuditLog, Category, Order, Product, StoreRepository } from "@/lib/domain/types";
import { appendRow, readRows, replaceRow } from "./sheets";

export class SheetsRepository implements StoreRepository {
  async listCategories(): Promise<Category[]> {
    return (await readRows<Record<string, string>>("Categories"))
      .filter((r) => truthy(r.is_active))
      .map((r) => ({ ...r, is_active: truthy(r.is_active), sort_order: Number(r.sort_order) })) as Category[];
  }
  async listProducts(activeOnly = true): Promise<Product[]> {
    return (await readRows<Record<string, string>>("Products"))
      .filter((r) => !activeOnly || truthy(r.is_active))
      .map((r) => ({
        ...r, diamond_amount: Number(r.diamond_amount), price: Number(r.price), cost_price: Number(r.cost_price),
        is_active: truthy(r.is_active), is_featured: truthy(r.is_featured), sort_order: Number(r.sort_order)
      })) as Product[];
  }
  async getProduct(id: string): Promise<Product | null> {
    return (await this.listProducts(false)).find((p) => p.product_id === id) ?? null;
  }
  async saveProduct(product: Product): Promise<void> {
    const exists = await this.getProduct(product.product_id);
    if (exists) {
      if (!await replaceRow("Products", "product_id", product.product_id, product)) throw new Error("Produk tidak ditemukan saat pembaruan.");
    } else await appendRow("Products", product);
  }
  async archiveProduct(id: string): Promise<void> {
    const product = await this.getProduct(id);
    if (!product) throw new Error("Produk tidak ditemukan.");
    await this.saveProduct({ ...product, is_active: false, updated_at: new Date().toISOString() });
  }
  async createOrder(order: Order): Promise<void> { await appendRow("Orders", order); }
  async getOrderByReference(reference: string): Promise<Order | null> {
    return (await this.listOrders()).find((o) => o.public_order_reference === reference) ?? null;
  }
  async getOrderById(id: string): Promise<Order | null> {
    return (await this.listOrders()).find((o) => o.order_id === id) ?? null;
  }
  async updateOrder(order: Order): Promise<void> {
    if (!await replaceRow("Orders", "order_id", order.order_id, order)) throw new Error("Pesanan tidak ditemukan.");
  }
  async listOrders(): Promise<Order[]> {
    return (await readRows<Record<string, string>>("Orders")).map((r) => ({
      ...r, quantity: Number(r.quantity), unit_price_snapshot: Number(r.unit_price_snapshot),
      admin_fee: Number(r.admin_fee), total_amount: Number(r.total_amount)
    })) as Order[];
  }
  async appendAudit(log: AuditLog): Promise<void> { await appendRow("AdminAuditLogs", log); }
  async listAudit(): Promise<AuditLog[]> { return readRows<AuditLog>("AdminAuditLogs"); }
  async listSettings(): Promise<Record<string, string>> {
    const rows = await readRows<{ setting_key: string; setting_value: string }>("Settings");
    return Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
  }
  async saveSettings(settings: Record<string, string>): Promise<void> {
    const existing = await readRows<{ setting_key: string; setting_value: string; updated_at: string }>("Settings");
    const now = new Date().toISOString();
    for (const [setting_key, setting_value] of Object.entries(settings)) {
      const row = existing.find((item) => item.setting_key === setting_key);
      const record = { setting_key, setting_value, updated_at: now };
      if (row) {
        if (!await replaceRow("Settings", "setting_key", setting_key, record)) throw new Error("Pengaturan tidak ditemukan saat pembaruan.");
      } else {
        await appendRow("Settings", record);
      }
    }
  }
}

let repository: StoreRepository | undefined;
export function getRepository(): StoreRepository {
  if (!repository) repository = new SheetsRepository();
  return repository;
}
function truthy(value: string): boolean { return value === "TRUE" || value === "true" || value === "1"; }
