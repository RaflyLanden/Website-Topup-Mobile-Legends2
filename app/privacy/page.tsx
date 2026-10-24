import { Footer, SiteHeader } from "@/components/site-header";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell py-12">
        <div className="card p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Privasi</div>
          <h1 className="mt-2 text-4xl font-black">Kebijakan privasi</h1>
          <div className="mt-5 space-y-4 text-sm text-slate-400">
            <p>Data minimum seperti kontak, User ID, dan referensi pembayaran disimpan hanya bila diperlukan untuk pemrosesan order.</p>
            <p>Data sensitif tidak disimpan ke Google Sheets dan tidak dibagikan ke frontend. Secret key, service account, dan token provider dikelola hanya pada server.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
