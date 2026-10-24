"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CircleAlert, CreditCard, LoaderCircle } from "lucide-react";
import type { Category, Product } from "@/lib/domain/types";

type PaymentMethod = "gopay" | "dana" | "shopeepay" | "bank_transfer";
const methodLabels: Record<PaymentMethod, string> = {
  gopay: "GoPay",
  dana: "DANA",
  shopeepay: "ShopeePay",
  bank_transfer: "Transfer bank"
};

export function CustomerTopup() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | "">("");
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [contact, setContact] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/products", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Katalog belum dapat dimuat.");
        return response.json() as Promise<{ products: Product[]; categories?: Category[] }>;
      }),
      fetch("/api/payment-methods", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return { methods: [] as PaymentMethod[] };
        return response.json() as Promise<{ methods: PaymentMethod[] }>;
      })
    ]).then(([catalog, paymentConfig]) => {
      if (!active) return;
      const available = [...catalog.products].filter((product) => product.is_active).sort((a, b) => a.sort_order - b.sort_order);
      setProducts(available);
      setCategories(catalog.categories ?? Array.from(new Map(available.map((product) => [
        product.category_id,
        { category_id: product.category_id, category_name: product.category_name, slug: product.category_id, description: "", icon: "", is_active: true, sort_order: product.sort_order }
      ])).values()));
      setMethods(paymentConfig.methods);
      setCatalogState("ready");
    }).catch(() => {
      if (active) setCatalogState("error");
    });
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(
    () => products.filter((product) => !selectedCategory || product.category_id === selectedCategory),
    [products, selectedCategory]
  );
  const product = products.find((item) => item.product_id === selectedProduct);
  const userIdValid = /^\d{4,16}$/.test(userId);
  const zoneIdValid = /^\d{1,8}$/.test(zoneId);
  const canSubmit = Boolean(product && userIdValid && zoneIdValid && selectedMethod && acceptedTerms && !submitting);

  function chooseCategory(categoryId: string) {
    setSelectedCategory(categoryId);
    setSelectedProduct("");
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    if (!product || !userIdValid || !zoneIdValid || !selectedMethod || !acceptedTerms || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.product_id,
          userId,
          zoneId,
          quantity: 1,
          paymentMethod: selectedMethod,
          contact,
          acceptedTerms: true
        })
      });
      const result = await response.json() as { error?: string; reference?: string; paymentUrl?: string; paymentReady?: boolean; order?: { reference: string; paymentReady: boolean } };
      if (!response.ok) throw new Error(result.error || "Pesanan belum berhasil dibuat.");
      const reference = result.reference ?? result.order?.reference;
      if (!reference) throw new Error("Server tidak mengembalikan referensi pesanan.");
      if (result.paymentReady && result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      router.push(`/order/${encodeURIComponent(reference)}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Pesanan belum berhasil dibuat. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitOrder} className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-7">
        <section aria-labelledby="account-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="account-heading" className="text-lg font-bold">01 <span className="ml-2">Data akun</span></h2>
            <span className="text-xs text-[#77827e]">Tidak ada pengecekan nama akun</span>
          </div>
          <div className="grid gap-3 rounded-lg border border-[#2a3439] bg-[#131a1e] p-4 sm:grid-cols-2">
            <div>
              <label htmlFor="user-id" className="mb-1.5 block text-sm font-medium">User ID</label>
              <input id="user-id" className="input" inputMode="numeric" autoComplete="off" placeholder="Contoh: 12345678" value={userId} onChange={(event) => setUserId(event.target.value.replace(/\D/g, "").slice(0, 16))} aria-describedby="user-id-help user-id-error" required />
              <p id="user-id-help" className="mt-1.5 text-xs text-[#77827e]">Masukkan angka User ID pada profil game (4–16 digit).</p>
              {userId.length > 0 && !userIdValid ? <p id="user-id-error" className="mt-1 text-xs text-[#efc271]">Format belum sesuai. Gunakan 4–16 angka.</p> : null}
            </div>
            <div>
              <label htmlFor="zone-id" className="mb-1.5 block text-sm font-medium">Zone ID / Server ID</label>
              <input id="zone-id" className="input" inputMode="numeric" autoComplete="off" placeholder="Contoh: 1234" value={zoneId} onChange={(event) => setZoneId(event.target.value.replace(/\D/g, "").slice(0, 8))} aria-describedby="zone-id-help zone-id-error" required />
              <p id="zone-id-help" className="mt-1.5 text-xs text-[#77827e]">Angka di dalam kurung setelah User ID (1–8 digit).</p>
              {zoneId.length > 0 && !zoneIdValid ? <p id="zone-id-error" className="mt-1 text-xs text-[#efc271]">Format belum sesuai. Gunakan 1–8 angka.</p> : null}
            </div>
            <div className="sm:col-span-2">
              <p className="border-t border-[#2a3439] pt-3 text-xs text-[#77827e]">Pemeriksaan di sini hanya memvalidasi format, bukan memastikan akun atau nama pemain.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="product-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="product-heading" className="text-lg font-bold">02 <span className="ml-2">Pilih produk</span></h2>
            {catalogState === "ready" ? <span className="text-xs text-[#77827e]">{products.length} tersedia</span> : null}
          </div>
          {catalogState === "loading" ? (
            <div className="space-y-2" aria-label="Memuat produk">
              {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse border border-[#2a3439] bg-[#131a1e]" />)}
            </div>
          ) : catalogState === "error" ? (
            <div className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#a0aaa7]">Katalog tidak dapat dimuat. Pastikan Google Sheets terhubung, lalu muat ulang halaman.</div>
          ) : products.length === 0 ? (
            <div className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#a0aaa7]">Belum ada produk aktif di katalog.</div>
          ) : (
            <>
              <div className="mb-3 flex max-w-full gap-1 overflow-x-auto border-b border-[#2a3439]" role="tablist" aria-label="Kategori produk">
                <button type="button" onClick={() => chooseCategory("")} role="tab" aria-selected={!selectedCategory} className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold ${!selectedCategory ? "border-[#c9f36a] text-[#c9f36a]" : "border-transparent text-[#a0aaa7] hover:text-white"}`}>Semua</button>
                {categories.map((category) => (
                  <button key={category.category_id} type="button" onClick={() => chooseCategory(category.category_id)} role="tab" aria-selected={selectedCategory === category.category_id} className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold ${selectedCategory === category.category_id ? "border-[#c9f36a] text-[#c9f36a]" : "border-transparent text-[#a0aaa7] hover:text-white"}`}>
                    {category.category_name}
                  </button>
                ))}
              </div>
              {visibleProducts.length === 0 ? (
                <p className="py-4 text-sm text-[#a0aaa7]">Belum ada produk aktif pada kategori ini.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {visibleProducts.map((item) => {
                    const selected = selectedProduct === item.product_id;
                    return (
                      <button key={item.product_id} type="button" onClick={() => setSelectedProduct(item.product_id)} aria-pressed={selected} className={`relative min-h-[92px] border p-3 text-left transition-colors ${selected ? "border-[#c9f36a] bg-[#1a2515]" : "border-[#2a3439] bg-[#131a1e] hover:border-[#59665e]"}`}>
                        {selected ? <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-[#c9f36a]" /> : null}
                        <span className="block pr-5 text-sm font-semibold leading-snug">{item.product_name}</span>
                        <span className={`mt-2 block text-sm font-bold tabular-nums ${selected ? "text-[#c9f36a]" : "text-[#e4eae5]"}`}>Rp {item.price.toLocaleString("id-ID")}</span>
                        <span className="mt-1 block truncate text-[11px] text-[#77827e]">{item.processing_estimate || item.delivery_method}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {product?.description ? <p className="mt-3 text-xs text-[#a0aaa7]">{product.description}</p> : null}
              {product ? <p className="mt-1 text-xs text-[#77827e]">Metode pengiriman: {product.delivery_method}. Estimasi mengikuti ketersediaan layanan.</p> : null}
            </>
          )}
        </section>

        <section aria-labelledby="payment-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="payment-heading" className="text-lg font-bold">03 <span className="ml-2">Pembayaran</span></h2>
          </div>
          {methods.length === 0 ? (
            <div className="flex gap-3 border border-[#2a3439] bg-[#131a1e] p-4 text-sm">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#efc271]" />
              <div><p className="font-semibold">Pembayaran belum tersedia</p><p className="mt-1 text-[#a0aaa7]">Gateway atau metode pembayaran belum dikonfigurasi oleh operator. Pesanan belum dapat dibayar.</p></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {methods.map((method) => {
                const item = methodLabels[method];
                const selected = method === selectedMethod;
                return (
                  <button key={method} type="button" onClick={() => setSelectedMethod(method)} aria-pressed={selected} className={`flex min-h-14 items-center gap-2.5 border px-3 text-left text-sm font-semibold transition-colors ${selected ? "border-[#c9f36a] bg-[#1a2515]" : "border-[#2a3439] bg-[#131a1e] hover:border-[#59665e]"}`}>
                    <CreditCard className={`h-4 w-4 shrink-0 ${selected ? "text-[#c9f36a]" : "text-[#77827e]"}`} aria-hidden="true" />
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-4 max-w-sm">
            <label htmlFor="contact" className="mb-1.5 block text-sm font-medium">Email / kontak <span className="font-normal text-[#77827e]">(opsional)</span></label>
            <input id="contact" type="text" className="input" autoComplete="email" placeholder="Untuk kabar status pesanan" maxLength={160} value={contact} onChange={(event) => setContact(event.target.value)} />
          </div>
        </section>
      </div>

      <aside className="h-fit border border-[#2a3439] bg-[#131a1e] p-4 lg:sticky lg:top-24">
        <div className="eyebrow mb-3">Ringkasan pesanan</div>
        <div className="min-h-14 border-b border-[#2a3439] pb-3">
          <div className="font-semibold">{product?.product_name ?? "Pilih produk untuk melanjutkan"}</div>
          {product ? <div className="mt-1 text-xs text-[#77827e]">{product.category_name}</div> : null}
        </div>
        <div className="flex justify-between py-3 text-sm text-[#a0aaa7]">
          <span>Harga produk</span><span className="font-medium tabular-nums text-[#e4eae5]">{product ? `Rp ${product.price.toLocaleString("id-ID")}` : "—"}</span>
        </div>
        <div className="flex justify-between border-t border-[#2a3439] py-3 font-bold">
          <span>Total sementara</span><span className="tabular-nums text-[#c9f36a]">{product ? `Rp ${product.price.toLocaleString("id-ID")}` : "—"}</span>
        </div>
        <p className="mb-4 text-xs text-[#77827e]">Biaya tambahan, bila ada, ditampilkan provider sebelum pembayaran dikonfirmasi.</p>
        <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-xs text-[#a0aaa7]">
          <input type="checkbox" className="mt-0.5 accent-[#c9f36a]" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
          <span>Saya menyetujui <a href="/terms" className="underline underline-offset-2">syarat layanan</a> dan kebijakan refund.</span>
        </label>
        {feedback ? <p role="alert" className="mb-3 text-sm text-[#ee8181]">{feedback}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={!canSubmit || methods.length === 0}>
          {submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Membuat pesanan…</> : <>Lanjut ke pembayaran <ArrowRight className="h-4 w-4" /></>}
        </button>
        <p className="mt-3 text-center text-[11px] text-[#77827e]">Harga final dihitung dan diverifikasi oleh server.</p>
      </aside>
    </form>
  );
}
