import { Footer, SiteHeader } from "@/components/site-header";

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell py-12">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">FAQ</div>
        <h1 className="mt-2 text-4xl font-black">Frequently Asked Questions</h1>
        <div className="mt-8 space-y-4">
          {[
            ["Apakah harus login sebelum checkout?", "Tidak. Checkout dapat dilakukan tanpa akun pelanggan, namun status pesanan harus diakses dengan token atau referensi yang aman."],
            ["Apakah data akun disimpan?", "Tidak, data sensitif seperti kata sandi, OTP, atau token login tidak disimpan di Google Sheets."],
            ["Bagaimana jika top-up belum masuk?", "Admin akan mengecek status fulfillment dan menindaklanjuti bila pesanan masih tertunda atau gagal."]
          ].map(([question, answer]) => (
            <div key={question} className="card p-5"><div className="font-semibold">{question}</div><p className="mt-2 text-sm text-slate-400">{answer}</p></div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
