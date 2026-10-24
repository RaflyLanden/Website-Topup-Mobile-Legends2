import { AdminShell } from "@/components/admin-shell";
import { AdminSettingsForm } from "@/components/admin-settings-form";

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <div className="mb-6"><div className="eyebrow mb-1">Konfigurasi</div><h1 className="text-2xl font-bold tracking-tight">Pengaturan layanan</h1></div>
      <section className="max-w-3xl border border-[#2a3439] bg-[#131a1e] p-4 sm:p-5">
        <div className="mb-5">
          <h2 className="font-semibold">Informasi storefront</h2>
          <p className="mt-1 text-sm text-[#a0aaa7]">Disimpan ke tab Settings. Kredensial Google dan payment gateway tetap dikelola sebagai environment server-side.</p>
        </div>
        <AdminSettingsForm />
      </section>
      <p className="mt-4 max-w-3xl text-xs text-[#77827e]">Metode pembayaran hanya diaktifkan melalui konfigurasi server setelah merchant mengonfirmasi channel dan uji sandbox.</p>
    </AdminShell>
  );
}
