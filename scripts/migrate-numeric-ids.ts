import { loadEnvConfig } from "@next/env";
import { generateNumericId } from "../lib/server/numeric-id";
import { readRows, replaceRow } from "../lib/server/sheets";

loadEnvConfig(process.cwd());

type SheetRow = Record<string, string>;
type RowChange = { sheet: "Categories" | "Products" | "Orders" | "PaymentLogs" | "AdminAuditLogs"; key: string; oldId: string; row: SheetRow };

async function main() {
  const [categories, products, orders, paymentLogs, auditLogs] = await Promise.all([
    readRows<SheetRow>("Categories"),
    readRows<SheetRow>("Products"),
    readRows<SheetRow>("Orders"),
    readRows<SheetRow>("PaymentLogs"),
    readRows<SheetRow>("AdminAuditLogs")
  ]);
  const usedIds = new Set<string>();
  const internalIds = [
    ...categories.map((row) => row.category_id),
    ...products.map((row) => row.product_id),
    ...orders.map((row) => row.order_id),
    ...paymentLogs.map((row) => row.log_id),
    ...auditLogs.map((row) => row.log_id)
  ].filter(Boolean);
  if (new Set(internalIds).size !== internalIds.length) throw new Error("Duplicate internal IDs exist. Resolve duplicates before migration.");
  internalIds.forEach((id) => usedIds.add(id));

  function createMap(ids: string[]): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const id of ids) {
      if (!id || /^\d+$/.test(id)) continue;
      const numeric = generateNumericId(usedIds);
      usedIds.add(numeric);
      mapping.set(id, numeric);
    }
    return mapping;
  }

  const categoryIds = createMap(categories.map((row) => row.category_id));
  const productIds = createMap(products.map((row) => row.product_id));
  const orderIds = createMap(orders.map((row) => row.order_id));
  const paymentLogIds = createMap(paymentLogs.map((row) => row.log_id));
  const auditLogIds = createMap(auditLogs.map((row) => row.log_id));

  const knownLegacyProductIds = new Map([
    ["mlbb-diamond-5", "208867512291"],
    ["mlbb-diamond-slow-4956414c", "339135441302"]
  ]);
  for (const [legacyId, numericId] of knownLegacyProductIds) {
    if (products.some((row) => row.product_id === numericId)) productIds.set(legacyId, numericId);
  }

  const changes: RowChange[] = [];
  function queueRows(sheet: RowChange["sheet"], rows: SheetRow[], key: string, update: (row: SheetRow) => SheetRow) {
    for (const row of rows) {
      const next = update(row);
      if (JSON.stringify(next) !== JSON.stringify(row)) changes.push({ sheet, key, oldId: row[key], row: next });
    }
  }
  queueRows("Categories", categories, "category_id", (row) => ({
    ...row,
    category_id: categoryIds.get(row.category_id) ?? row.category_id
  }));
  queueRows("Products", products, "product_id", (row) => ({
    ...row,
    product_id: productIds.get(row.product_id) ?? row.product_id,
    category_id: categoryIds.get(row.category_id) ?? row.category_id
  }));
  queueRows("Orders", orders, "order_id", (row) => ({
    ...row,
    order_id: orderIds.get(row.order_id) ?? row.order_id,
    product_id: productIds.get(row.product_id) ?? row.product_id
  }));
  queueRows("PaymentLogs", paymentLogs, "log_id", (row) => ({
    ...row,
    log_id: paymentLogIds.get(row.log_id) ?? row.log_id,
    order_id: orderIds.get(row.order_id) ?? row.order_id
  }));
  queueRows("AdminAuditLogs", auditLogs, "log_id", (row) => {
    const targetMap = row.target_type === "product" ? productIds
      : row.target_type === "category" ? categoryIds
      : row.target_type === "order" ? orderIds
      : undefined;
    const targetId = row.target_type === "settings" && !/^\d+$/.test(row.target_id)
      ? "1"
      : targetMap?.get(row.target_id) ?? row.target_id;
    if (targetId && !/^\d+$/.test(targetId)) {
      throw new Error(`Cannot resolve non-numeric audit target ID for ${row.target_type}; no changes were written.`);
    }
    return {
      ...row,
      log_id: auditLogIds.get(row.log_id) ?? row.log_id,
      target_id: targetId
    };
  });

  for (const change of changes) {
    if (!await replaceRow(change.sheet, change.key, change.oldId, change.row)) {
      throw new Error(`Could not update ${change.sheet} record ${change.oldId}. Migration stopped.`);
    }
    console.log(`Updated ${change.sheet} ID ${change.oldId} -> ${change.row[change.key]}`);
  }

  const [verifiedCategories, verifiedProducts, verifiedOrders, verifiedPaymentLogs, verifiedAuditLogs] = await Promise.all([
    readRows<SheetRow>("Categories"),
    readRows<SheetRow>("Products"),
    readRows<SheetRow>("Orders"),
    readRows<SheetRow>("PaymentLogs"),
    readRows<SheetRow>("AdminAuditLogs")
  ]);
  const verificationRows = [
    ...verifiedCategories.map((row) => [row.category_id]),
    ...verifiedProducts.map((row) => [row.product_id, row.category_id]),
    ...verifiedOrders.map((row) => [row.order_id, row.product_id]),
    ...verifiedPaymentLogs.map((row) => [row.log_id, row.order_id]),
    ...verifiedAuditLogs.map((row) => [row.log_id, row.target_id])
  ];
  const invalid = verificationRows.flat().filter((id) => id && !/^\d+$/.test(id));
  if (invalid.length) throw new Error(`Migration verification failed for IDs: ${invalid.join(", ")}`);
  const categoryIdSet = new Set(verifiedCategories.map((row) => row.category_id));
  const productIdSet = new Set(verifiedProducts.map((row) => row.product_id));
  const orderIdSet = new Set(verifiedOrders.map((row) => row.order_id));
  if (verifiedProducts.some((row) => !categoryIdSet.has(row.category_id))) throw new Error("Migration verification failed: a product references a missing category.");
  if (verifiedOrders.some((row) => !productIdSet.has(row.product_id))) throw new Error("Migration verification failed: an order references a missing product.");
  if (verifiedPaymentLogs.some((row) => !orderIdSet.has(row.order_id))) throw new Error("Migration verification failed: a payment log references a missing order.");
  if (verifiedAuditLogs.some((row) =>
    (row.target_type === "product" && !productIdSet.has(row.target_id)) ||
    (row.target_type === "category" && !categoryIdSet.has(row.target_id)) ||
    (row.target_type === "order" && !orderIdSet.has(row.target_id))
  )) throw new Error("Migration verification failed: an audit record references a missing entity.");
  console.log(`Migration complete: updated ${changes.length} rows. All internal entity/reference IDs are numeric.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Could not migrate internal IDs.");
  process.exitCode = 1;
});
