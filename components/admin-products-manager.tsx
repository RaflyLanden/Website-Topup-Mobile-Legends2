"use client";

import { FormEvent, useMemo, useState } from "react";
import { Archive, LoaderCircle, Pencil, Plus, Save, X } from "lucide-react";
import type { Category, Product } from "@/lib/domain/types";

type ProductDraft = {
  product_id: string;
  category_id: string;
  product_name: string;
  description: string;
  diamond_amount: string;
  starlight_type: string;
  delivery_method: string;
  price: string;
  cost_price: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: string;
  processing_estimate: string;
};

type ApiResult = { product?: Product; error?: string };

function emptyDraft(categoryId = ""): ProductDraft {
  return {
    product_id: "",
    category_id: categoryId,
    product_name: "",
    description: "",
    diamond_amount: "0",
    starlight_type: "",
    delivery_method: "gift",
    price: "0",
    cost_price: "0",
    is_active: true,
    is_featured: false,
    sort_order: "0",
    processing_estimate: "Manual"
  };
}

function draftFromProduct(product: Product): ProductDraft {
  return {
    product_id: product.product_id,
    category_id: product.category_id,
    product_name: product.product_name,
    description: product.description,
    diamond_amount: String(product.diamond_amount),
    starlight_type: product.starlight_type,
    delivery_method: product.delivery_method,
    price: String(product.price),
    cost_price: String(product.cost_price),
    is_active: product.is_active,
    is_featured: product.is_featured,
    sort_order: String(product.sort_order),
    processing_estimate: product.processing_estimate
  };
}

async function readResult(response: Response): Promise<ApiResult> {
  return response.json().catch(() => ({})) as Promise<ApiResult>;
}

export function AdminProductsManager({
  initialProducts,
  categories,
  initialError
}: {
  initialProducts: Product[];
  categories: Category[];
  initialError: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState(initialError ? "Produk atau kategori tidak dapat dimuat. Periksa koneksi Google Sheets." : "");
  const [message, setMessage] = useState("");

  const visibleProducts = useMemo(() => products
    .filter((product) => statusFilter === "all" || (statusFilter === "active" ? product.is_active : !product.is_active))
    .filter((product) => {
      const query = search.trim().toLocaleLowerCase("id-ID");
      return !query || [product.product_name, product.product_id, product.category_name]
        .some((value) => value.toLocaleLowerCase("id-ID").includes(query));
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.product_name.localeCompare(b.product_name, "id-ID")), [products, search, statusFilter]);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft(categories[0]?.category_id ?? ""));
    setError("");
    setMessage("");
  }

  function startEdit(product: Product) {
    setEditingId(product.product_id);
    setDraft(draftFromProduct(product));
    setError("");
    setMessage("");
  }

  function closeForm() {
    if (!saving) {
      setDraft(null);
      setEditingId(null);
    }
  }

  function updateDraft<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");
    setMessage("");
    const category = categories.find((item) => item.category_id === draft.category_id);
    if (!category) {
      setError("Pilih kategori yang tersedia sebelum menyimpan produk.");
      setSaving(false);
      return;
    }

    const payload = {
      ...draft,
      category_name: category.category_name,
      diamond_amount: Number(draft.diamond_amount),
      price: Number(draft.price),
      cost_price: Number(draft.cost_price),
      sort_order: Number(draft.sort_order)
    };
    if (!editingId) delete (payload as Partial<typeof payload>).product_id;

    try {
      const response = await fetch(editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await readResult(response);
      if (!response.ok || !result.product) throw new Error(result.error || "Produk tidak dapat disimpan.");
      setProducts((current) => {
        const next = current.filter((product) => product.product_id !== result.product?.product_id);
        return [...next, result.product!];
      });
      setDraft(null);
      setEditingId(null);
      setMessage(editingId ? "Perubahan produk tersimpan." : "Produk berhasil ditambahkan.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Produk tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function activate(product: Product) {
    setBusyId(product.product_id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.product_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, is_active: true })
      });
      const result = await readResult(response);
      if (!response.ok || !result.product) throw new Error(result.error || "Status produk tidak dapat diubah.");
      setProducts((current) => current.map((item) => item.product_id === product.product_id ? result.product! : item));
      setMessage("Produk diaktifkan kembali.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status produk tidak dapat diubah.");
    } finally {
      setBusyId(null);
    }
  }

  async function archive(product: Product) {
    if (!window.confirm(`Arsipkan "${product.product_name}"? Produk tidak akan tampil di katalog pelanggan, tetapi riwayat pesanan tetap aman.`)) return;
    setBusyId(product.product_id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.product_id)}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await readResult(response);
        throw new Error(result.error || "Produk tidak dapat diarsipkan.");
      }
      setProducts((current) => current.map((item) => item.product_id === product.product_id ? { ...item, is_active: false } : item));
      setMessage("Produk diarsipkan; data dan riwayat pesanan tetap tersimpan.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Produk tidak dapat diarsipkan.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><div className="eyebrow mb-1">Katalog</div><h1 className="text-2xl font-bold tracking-tight">Produk</h1></div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
          <span className="text-sm text-[#77827e]">{products.length} produk</span>
          <button type="button" onClick={startCreate} disabled={categories.length === 0} className="btn-primary">
            <Plus className="h-4 w-4" />Tambah produk
          </button>
        </div>
      </div>

      {error ? <p role="alert" className="mb-4 border border-[#60433b] bg-[#211816] p-3 text-sm text-[#efb79c]">{error}</p> : null}
      {message ? <p role="status" className="mb-4 border border-[#365743] bg-[#121d17] p-3 text-sm text-[#a5ddb8]">{message}</p> : null}
      {categories.length === 0 && !initialError ? (
        <p className="mb-4 border border-[#4c4540] bg-[#1a1916] p-3 text-sm text-[#efc271]">Belum ada kategori aktif. Tambahkan kategori terlebih dahulu di tab Categories Google Sheets.</p>
      ) : null}

      {draft ? (
        <section aria-labelledby="product-form-title" className="mb-6 border border-[#3a4549] bg-[#131a1e] p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 id="product-form-title" className="font-semibold">{editingId ? "Edit produk" : "Produk baru"}</h2>
              <p className="mt-1 text-sm text-[#a0aaa7]">Harga dan detail di bawah akan digunakan pada katalog pelanggan.</p>
            </div>
            <button type="button" className="btn-secondary min-h-10 px-3" onClick={closeForm} disabled={saving} aria-label="Tutup form"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {editingId ? (
                <Field label="ID produk" hint="Kode unik; tidak dapat diubah setelah produk dibuat.">
                  <input className="input" readOnly value={draft.product_id} />
                </Field>
              ) : (
                <div className="flex min-h-[74px] flex-col justify-center border-b border-[#2a3439] text-sm">
                  <span className="font-medium">ID produk</span>
                  <span className="mt-1 text-xs text-[#77827e]">Dibuat otomatis saat produk disimpan.</span>
                </div>
              )}
              <Field label="Nama produk">
                <input className="input" required maxLength={120} value={draft.product_name} onChange={(event) => updateDraft("product_name", event.target.value)} />
              </Field>
              <Field label="Kategori">
                <select className="input" required value={draft.category_id} onChange={(event) => updateDraft("category_id", event.target.value)}>
                  {categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}
                </select>
              </Field>
              <Field label="Jumlah diamond" hint="Isi 0 untuk produk non-diamond">
                <input className="input" type="number" min="0" step="1" required value={draft.diamond_amount} onChange={(event) => updateDraft("diamond_amount", event.target.value)} />
              </Field>
              <Field label="Harga jual (Rp)">
                <input className="input" type="number" min="0" step="1" required value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} />
              </Field>
              <Field label="Harga modal (Rp)">
                <input className="input" type="number" min="0" step="1" required value={draft.cost_price} onChange={(event) => updateDraft("cost_price", event.target.value)} />
              </Field>
              <Field label="Metode pengiriman" hint="Contoh: gift, manual">
                <input className="input" required maxLength={120} value={draft.delivery_method} onChange={(event) => updateDraft("delivery_method", event.target.value)} />
              </Field>
              <Field label="Tipe Starlight">
                <input className="input" maxLength={80} value={draft.starlight_type} onChange={(event) => updateDraft("starlight_type", event.target.value)} />
              </Field>
              <Field label="Estimasi proses">
                <input className="input" maxLength={120} value={draft.processing_estimate} onChange={(event) => updateDraft("processing_estimate", event.target.value)} />
              </Field>
              <Field label="Urutan tampil">
                <input className="input" type="number" step="1" required value={draft.sort_order} onChange={(event) => updateDraft("sort_order", event.target.value)} />
              </Field>
              <Field label="Deskripsi" className="sm:col-span-2 lg:col-span-3">
                <textarea className="input min-h-24 resize-y" maxLength={1000} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_active} onChange={(event) => updateDraft("is_active", event.target.checked)} />Tampilkan di katalog</label>
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_featured} onChange={(event) => updateDraft("is_featured", event.target.checked)} />Tandai sebagai unggulan</label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary" disabled={saving || categories.length === 0}>
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Menyimpan…" : "Simpan produk"}
              </button>
              <button type="button" className="btn-secondary px-4" onClick={closeForm} disabled={saving}>Batal</button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
        <label className="sr-only" htmlFor="product-search">Cari produk</label>
        <input id="product-search" className="input" type="search" placeholder="Cari nama, ID, atau kategori" value={search} onChange={(event) => setSearch(event.target.value)} />
        <label className="sr-only" htmlFor="product-status">Filter status</label>
        <select id="product-status" className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">Semua status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option>
        </select>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="border border-[#2a3439] bg-[#131a1e] p-5">
          <div className="font-semibold">{products.length === 0 ? "Katalog masih kosong" : "Produk tidak ditemukan"}</div>
          <p className="mt-1 text-sm text-[#a0aaa7]">{products.length === 0 ? "Gunakan tombol Tambah produk untuk memasukkan produk ke Google Sheets." : "Ubah kata kunci atau filter status."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-y border-[#2a3439]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#77827e]">
              <tr><th className="px-3 py-3 font-semibold">Produk</th><th className="px-3 py-3 font-semibold">Kategori / metode</th><th className="px-3 py-3 text-right font-semibold">Harga</th><th className="px-3 py-3 text-right font-semibold">Status</th><th className="px-3 py-3 text-right font-semibold">Aksi</th></tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.product_id} className="border-t border-[#2a3439]">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{product.product_name}{product.is_featured ? <span className="ml-2 text-xs font-medium text-[#c9f36a]">Unggulan</span> : null}</div>
                    <div className="mt-0.5 text-xs text-[#77827e]">{product.product_id} · {product.diamond_amount} diamond</div>
                  </td>
                  <td className="px-3 py-3"><div>{product.category_name}</div><div className="mt-0.5 text-xs text-[#77827e]">{product.delivery_method}</div></td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">Rp {product.price.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-3 text-right"><span className={`badge ${product.is_active ? "border-[#365743] text-[#85d2a3]" : "border-[#4c4540] text-[#a0aaa7]"}`}>{product.is_active ? "Aktif" : "Nonaktif"}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => startEdit(product)} disabled={busyId !== null} aria-label={`Edit ${product.product_name}`}><Pencil className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Edit</span></button>
                      {product.is_active ? (
                        <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => void archive(product)} disabled={busyId !== null} aria-label={`Arsipkan ${product.product_name}`}>
                          {busyId === product.product_id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                          <span className="sr-only sm:not-sr-only">Arsip</span>
                        </button>
                      ) : (
                        <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => void activate(product)} disabled={busyId !== null} aria-label={`Pulihkan ${product.product_name}`}>
                          {busyId === product.product_id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <span>Pulihkan</span>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{label}</span>
        {children}
      </label>
      {hint ? <p className="mt-1 text-xs text-[#77827e]">{hint}</p> : null}
    </div>
  );
}
