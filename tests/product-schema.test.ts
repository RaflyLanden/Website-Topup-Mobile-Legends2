import { describe, expect, it } from "vitest";
import { productCreateSchema, productSchema } from "@/lib/domain/schemas";

const fields = {
  category_id: "100000000010",
  category_name: "Diamonds",
  product_name: "86 Diamonds",
  description: "",
  diamond_amount: 86,
  starlight_type: "",
  delivery_method: "gift",
  price: 10000,
  cost_price: 8000,
  is_active: true,
  is_featured: false,
  sort_order: 1,
  processing_estimate: "Manual"
};

describe("product ID schema", () => {
  it("accepts product IDs made of digits only", () => {
    expect(productSchema.safeParse({ ...fields, product_id: "123456789012" }).success).toBe(true);
  });

  it("rejects IDs containing letters or punctuation", () => {
    expect(productSchema.safeParse({ ...fields, product_id: "mlbb-86" }).success).toBe(false);
  });

  it("rejects category IDs that are not numeric", () => {
    expect(productSchema.safeParse({ ...fields, category_id: "diamonds", product_id: "123456789012" }).success).toBe(false);
  });

  it("allows product creation without a client-provided ID", () => {
    expect(productCreateSchema.safeParse(fields).success).toBe(true);
  });
});
