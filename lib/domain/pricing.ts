import type { Product } from "./types";

export function calculateTotal(product: Pick<Product, "price">, quantity: number, adminFee = 0): number {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error("Jumlah pesanan tidak valid.");
  if (!Number.isSafeInteger(product.price) || product.price < 0) throw new Error("Harga produk tidak valid.");
  if (!Number.isSafeInteger(adminFee) || adminFee < 0) throw new Error("Biaya admin tidak valid.");
  const total = product.price * quantity + adminFee;
  if (!Number.isSafeInteger(total)) throw new Error("Total pembayaran di luar batas.");
  return total;
}
