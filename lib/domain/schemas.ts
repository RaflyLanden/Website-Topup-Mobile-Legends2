import { z } from "zod";

export const createOrderSchema = z.object({
  productId: z.string().regex(/^\d{1,20}$/, "Kode produk tidak valid."),
  userId: z.string().regex(/^\d{4,16}$/, "User ID harus berupa 4–16 angka."),
  zoneId: z.string().regex(/^\d{1,8}$/, "Zone ID harus berupa angka."),
  quantity: z.number().int().min(1).max(10).default(1),
  paymentMethod: z.enum(["gopay", "dana", "shopeepay", "bank_transfer"]),
  contact: z.string().trim().max(160).optional().default(""),
  acceptedTerms: z.literal(true)
});

export const productSchema = z.object({
  product_id: z.string().regex(/^\d{1,20}$/, "ID produk harus berupa angka."),
  category_id: z.string().regex(/^\d{1,20}$/, "ID kategori harus berupa angka."),
  category_name: z.string().min(1).max(100),
  product_name: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  diamond_amount: z.coerce.number().int().min(0),
  starlight_type: z.string().max(80).default(""),
  delivery_method: z.string().min(1).max(120),
  price: z.coerce.number().int().nonnegative(),
  cost_price: z.coerce.number().int().nonnegative().default(0),
  is_active: z.boolean(),
  is_featured: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
  processing_estimate: z.string().max(120).default("Manual"),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export const productCreateSchema = productSchema.omit({ product_id: true });
