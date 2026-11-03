# typostore — MLBB Top-Up Store

Next.js App Router, TypeScript, and Tailwind storefront for Mobile Legends top-ups. Google Sheets is the initial server-only catalog/order store. The UI only shows configured catalog data; example prices are not presented as live products.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. The storefront shell can load without third-party credentials, but catalog and checkout features require Google Sheets and payment configuration.

## Project layout

- `app/` — public pages, protected admin pages, and serverless route handlers
- `components/` — storefront, checkout, order status, and admin UI
- `lib/domain/` — types, validation, pricing, and status transitions
- `lib/server/` — Sheets repository, authentication, rate limits, and payment adapter
- `scripts/` — Google Sheets initialization
- `tests/` — pricing and status unit tests

## Environment setup

Copy `.env.example` to `.env.local`. Keep credentials server-side; never use a `NEXT_PUBLIC_` prefix for secrets.

### Google Sheets

1. Create/select a project at [Google Cloud Console](https://console.cloud.google.com/), open **APIs & Services → Library**, find **Google Sheets API**, and click **Enable**.
2. Open **IAM & Admin → Service Accounts → Create service account**. This creates a special service account email ending in `iam.gserviceaccount.com`—do not use a personal Gmail address.
3. Open that service account's **Keys → Add key → Create new key → JSON** and download the JSON file.
4. Save the downloaded JSON privately as `C:\xampp\htdocs\TopupML2\private\google-service-account.json`. The `private` folder is excluded by `.gitignore`; never send or commit the file.
5. Create a spreadsheet. Click **Share** and add the `client_email` value from the downloaded JSON as an **Editor**.
6. Copy the spreadsheet ID from its URL (between `/d/` and `/edit`). In `.env.local`, set:

   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=C:\xampp\htdocs\TopupML2\private\google-service-account.json
   GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
   ```

   The downloaded JSON is used directly, so you do not need to copy the long private key into the environment file. The alternative `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` configuration remains supported for hosting environments.
7. Save `.env.local`, then run `npm run sheets:test`. A success message confirms connection; a 403 means the spreadsheet is not shared with the service account or the API is not enabled.
8. Run `npm run sheets:init` to create the required tabs and header rows without overwriting populated header rows. Add category and product records underneath the headers.
9. Restart `npm run dev` and visit `/api/products`. The response should contain `products` and `categories`.

Internal entity IDs (`category_id`, `product_id`, `order_id`, `log_id`, and audit target IDs) use numeric codes. To migrate legacy IDs and their sheet references in the currently configured workbook, run `npm run sheets:migrate-ids`. Customer order access references, administrator email identities, game User ID/Zone ID, and payment-provider transaction references are purpose-specific values and are not rewritten.

### Payment methods

The Midtrans adapter stays disabled unless `PAYMENT_PROVIDER=midtrans`, a server key is present, and `PAYMENT_ENABLED_METHODS` explicitly lists operator-verified channels (comma-separated: `gopay,dana,shopeepay,bank_transfer`). Only enable methods that are supported by the merchant account and verified in sandbox. A valid payment response is required before an order is created. No payment is simulated when these settings are missing.

Configure `PAYMENT_SERVER_KEY`, `MIDTRANS_ENVIRONMENT=sandbox`, and the provider notification URL as `https://<your-domain>/api/payments/webhook`. The webhook verifies the Midtrans signature and amount, records provider events, and queues fulfillment only after a verified paid notification. Do not enable production credentials before completing the provider's current integration and reconciliation requirements. Payment channel/merchant availability may vary.

### Admin login

Set `ADMIN_AUTH_SECRET` to a random secret with at least 32 characters, plus `ADMIN_EMAIL` and `ADMIN_PASSWORD`. `ADMIN_PASSWORD` is plain text in the server-only environment configuration, as requested; use a long unique password, keep `.env.local` private, and never commit or expose it to the browser. Admin pages redirect to `/admin/login` unless the signed, HTTP-only session cookie is valid.

## Useful commands

```powershell
npm run dev
npm test
npm run build
```

## Operational notes

- Storefront catalog is read from Google Sheets at request time; if Sheets is unavailable, the UI shows an explicit unavailable state instead of sample prices.
- Order lookup uses a high-entropy reference as a bearer access token. Treat it as private.
- Admin dashboard values are computed from stored orders; revenue counts only orders with `PAID` payment status.
- Google Sheets does not provide atomic transactions or strong concurrency control. For high volume or financial transaction guarantees, move the repository implementation to PostgreSQL while retaining the domain interface.
- Fulfillment is manual unless a verified supplier adapter is added. Do not claim automated fulfillment without that integration.
- Player IDs are format-checked only; no account name/identity check is claimed.

## Deployment

Deploy to Vercel or another compatible serverless platform. Set the environment variables in the platform's secret manager, configure the provider webhook URL, and run the provider sandbox end-to-end before enabling any payment channel for customers.
