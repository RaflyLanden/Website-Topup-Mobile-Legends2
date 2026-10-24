# Deploy ke Cloudflare Workers

Aplikasi ini menggunakan Next.js server-side dan API routes. Deploy sebagai **Cloudflare Worker dengan OpenNext**, bukan Cloudflare Pages static export.

## Persiapan lokal

1. Gunakan Node.js 22 atau lebih baru dan jalankan `npm ci`.
2. Buat `.dev.vars` dari `.dev.vars.example`, lalu isi konfigurasi untuk preview Worker lokal.
3. Jalankan `npm run preview` untuk membangun dan menguji aplikasi di runtime Cloudflare sebelum deploy.
4. Deploy manual dengan `npm run deploy`, setelah login melalui `npx wrangler login`.

Jangan commit `.env.local`, `.dev.vars`, Google service-account JSON, atau output `.open-next`. Untuk workflow Git deployment, gunakan konfigurasi build di bawah.

## Konfigurasi Cloudflare

Buat Worker baru atau sambungkan repository menggunakan **Workers Builds**. Gunakan root directory repository ini, Node.js 22+, perintah build `npm run cf:build`, dan perintah deploy `npx wrangler deploy`. Pastikan `wrangler.jsonc` dipakai sebagai konfigurasi Worker. Untuk proyek yang terhubung langsung ke Git, lakukan autentikasi dan buat Worker dari dashboard; perintah `npm run deploy` ditujukan untuk deployment dari CLI.

Di Worker → **Settings → Variables and Secrets**, tambahkan:

| Nama | Jenis | Catatan |
| --- | --- | --- |
| `ADMIN_EMAIL` | Secret | Email admin production |
| `ADMIN_PASSWORD` | Secret | Password unik dan kuat; jangan gunakan password lokal |
| `ADMIN_AUTH_SECRET` | Secret | Secret acak minimal 32 karakter |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Secret | Email service account Google |
| `GOOGLE_PRIVATE_KEY` | Secret | Private key service account dalam format PEM |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Variable | ID spreadsheet database |
| `NEXT_PUBLIC_APP_URL` | Build variable | URL production lengkap, misalnya `https://domain-anda.com` |
| `PAYMENT_PROVIDER` | Variable | `disabled` sampai Midtrans siap diuji |
| `PAYMENT_SERVER_KEY` | Secret | Server key Midtrans, jika pembayaran diaktifkan |
| `PAYMENT_WEBHOOK_SECRET` | Secret | Isi hanya bila integrasi menggunakannya |
| `PAYMENT_ENABLED_METHODS` | Variable | Metode yang diaktifkan, pisahkan dengan koma |
| `MIDTRANS_ENVIRONMENT` | Variable | `sandbox` saat pengujian; `production` setelah verifikasi |

Set variabel runtime pada **production** dan **preview** secara terpisah jika keduanya digunakan. Untuk Workers Builds, isi juga `NEXT_PUBLIC_APP_URL` pada bagian **Build variables and secrets** agar URL production tersedia saat build (nilai `NEXT_PUBLIC_*` dapat dimasukkan ke bundle). Jangan pernah memberi prefix `NEXT_PUBLIC_` ke credential. Variabel build tidak otomatis menjadi variabel runtime Worker; atur keduanya di lokasi masing-masing.

Aktifkan Google Sheets API di Google Cloud, lalu bagikan spreadsheet kepada service account dengan akses editor. Jangan mengatur `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` di Worker; opsi file hanya untuk lingkungan yang memiliki filesystem.

Sebelum membuka traffic production:

- Ganti dan rotasi password admin, `ADMIN_AUTH_SECRET`, serta Google service-account key yang sebelumnya tersimpan di file lokal.
- Pastikan halaman login dan seluruh API production berjalan, cookie hanya dikirim melalui HTTPS, dan callback/webhook Midtrans memakai domain production.
- Mulai dengan pembayaran `disabled` atau Midtrans sandbox. Aktifkan key production dan metode pembayaran setelah alur webhook berhasil diuji.
- Pasang Cloudflare WAF/rate-limiting rule untuk `/api/auth/login`; limiter in-memory aplikasi tidak dibagi antar-isolate Worker.

Google Sheets cocok untuk volume kecil, tetapi bukan database transaksional: pembuatan ID dan penulisan bersamaan dapat berbenturan. Untuk volume transaksi production yang signifikan, pindahkan pesanan ke database transaksional seperti Cloudflare D1 sebelum mengandalkannya untuk konsistensi stok/pesanan.
