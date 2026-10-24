import { HelpCircle, ShieldCheck } from "lucide-react";
import { Footer, SiteHeader } from "@/components/site-header";

const faqs = [
  { question: "Bagaimana cara top-up?", answer: "Pilih produk, masukkan User ID dan Zone ID, lalu lanjutkan checkout sesuai metode pembayaran yang tersedia." },
  { question: "Apakah semua produk menggunakan gift?", answer: "Tidak. Setiap produk memiliki metode pengiriman yang dipilih admin. Starlight dan login akun bisa memiliki aturan yang berbeda." },
  { question: "Apa yang harus dilakukan bila pembayaran pending?", answer: "Cek status dan tunggu verifikasi provider. Jika lebih dari 30 menit, laporkan referensi pesanan ke support." }
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell py-10">
        <div className="eyebrow mb-2">Bantuan</div>
        <h1 className="text-3xl font-bold tracking-tight">Bantuan transaksi</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#a0aaa7]">Panduan ringkas terkait pemesanan, metode pengiriman, dan status pembayaran.</p>
        <div className="mt-7 grid gap-3 lg:grid-cols-2">
          {faqs.map((item) => (
            <div key={item.question} className="border border-[#2a3439] bg-[#131a1e] p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold"><HelpCircle className="h-4 w-4 text-[#c9f36a]" /> {item.question}</div>
              <p className="text-sm text-[#a0aaa7]">{item.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 border-l-2 border-[#c9f36a] bg-[#131a1e] p-4">
          <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-[#c9f36a]" /> Pembayaran dan refund</div>
          <p className="mt-2 text-sm text-[#a0aaa7]">Status pembayaran menunggu verifikasi provider. Refund hanya diproses setelah status pembayaran dan kemampuan pemenuhan diperiksa.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
