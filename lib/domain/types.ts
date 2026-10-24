export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";
export type FulfillmentStatus =
  | "WAITING_PAYMENT" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
  | "REFUND_PENDING" | "REFUNDED";
export type AdminRole = "SUPER_ADMIN" | "OPERATIONS";

export interface Category {
  category_id: string;
  category_name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  product_id: string;
  category_id: string;
  category_name: string;
  product_name: string;
  description: string;
  diamond_amount: number;
  starlight_type: string;
  delivery_method: string;
  price: number;
  cost_price: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  processing_estimate: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  order_id: string;
  public_order_reference: string;
  customer_contact: string;
  user_id: string;
  zone_id: string;
  product_id: string;
  product_name_snapshot: string;
  category_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  admin_fee: number;
  total_amount: number;
  payment_method: string;
  payment_reference: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  customer_note: string;
  internal_note: string;
  failure_reason: string;
  created_at: string;
  paid_at: string;
  completed_at: string;
  updated_at: string;
}

export interface AuditLog {
  log_id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface StoreRepository {
  listCategories(): Promise<Category[]>;
  listProducts(activeOnly?: boolean): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(product: Product): Promise<void>;
  archiveProduct(id: string): Promise<void>;
  createOrder(order: Order): Promise<void>;
  getOrderByReference(reference: string): Promise<Order | null>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrder(order: Order): Promise<void>;
  listOrders(): Promise<Order[]>;
  appendAudit(log: AuditLog): Promise<void>;
  listAudit(): Promise<AuditLog[]>;
  listSettings(): Promise<Record<string, string>>;
  saveSettings(settings: Record<string, string>): Promise<void>;
}
