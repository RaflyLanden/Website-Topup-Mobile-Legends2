import { google, sheets_v4 } from "googleapis";

export const SHEET_HEADERS = {
  Products: ["product_id", "category_id", "category_name", "product_name", "description", "diamond_amount", "starlight_type", "delivery_method", "price", "cost_price", "is_active", "is_featured", "sort_order", "processing_estimate", "created_at", "updated_at"],
  Categories: ["category_id", "category_name", "slug", "description", "icon", "is_active", "sort_order"],
  Orders: ["order_id", "public_order_reference", "customer_contact", "user_id", "zone_id", "product_id", "product_name_snapshot", "category_snapshot", "quantity", "unit_price_snapshot", "admin_fee", "total_amount", "payment_method", "payment_reference", "payment_status", "fulfillment_status", "customer_note", "internal_note", "failure_reason", "created_at", "paid_at", "completed_at", "updated_at"],
  PaymentLogs: ["log_id", "order_id", "provider", "provider_reference", "event_type", "verification_status", "event_timestamp", "processed_at", "error_code"],
  AdminAuditLogs: ["log_id", "admin_id", "action", "target_type", "target_id", "details", "created_at"],
  Settings: ["setting_key", "setting_value", "updated_at"]
} as const;

let sheetsClient: sheets_v4.Sheets | undefined;
export function getSheets(): sheets_v4.Sheets {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_KEY_FILE, GOOGLE_SHEETS_SPREADSHEET_ID } = process.env;
  if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID belum diatur.");
  }
  if (!GOOGLE_SERVICE_ACCOUNT_KEY_FILE && (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY)) {
    throw new Error("Kredensial Google belum lengkap. Atur GOOGLE_SERVICE_ACCOUNT_KEY_FILE atau GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY.");
  }
  if (!sheetsClient) {
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    const auth = GOOGLE_SERVICE_ACCOUNT_KEY_FILE
      ? new google.auth.GoogleAuth({ keyFile: GOOGLE_SERVICE_ACCOUNT_KEY_FILE, scopes })
      : new google.auth.JWT({
          email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          scopes
        });
    sheetsClient = google.sheets({ version: "v4", auth });
  }
  return sheetsClient;
}

export function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID belum diatur.");
  return id;
}

export async function readRows<T extends object>(sheet: keyof typeof SHEET_HEADERS): Promise<T[]> {
  const response = await getSheets().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(), range: `${sheet}!A:${columnName(SHEET_HEADERS[sheet].length)}`
  });
  const [headers, ...rows] = response.data.values ?? [];
  if (!headers) return [];
  return rows.filter((row) => row.some((cell) => cell !== "")).map((row) =>
    Object.fromEntries(headers.map((header: string, index: number) => [header, row[index] ?? ""])) as T
  );
}

export async function appendRow(sheet: keyof typeof SHEET_HEADERS, row: object): Promise<void> {
  const headers = SHEET_HEADERS[sheet] as readonly string[];
  const values = headers.map((key) => serialize((row as Record<string, unknown>)[key]));
  await getSheets().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(), range: `${sheet}!A:${columnName(headers.length)}`,
    valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values: [values] }
  });
}

export async function replaceRow(sheet: keyof typeof SHEET_HEADERS, key: string, id: string, row: object): Promise<boolean> {
  const rows = await getSheets().spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: `${sheet}!A:${columnName(SHEET_HEADERS[sheet].length)}` });
  const values = rows.data.values ?? [];
  const headers = values[0] ?? [];
  const keyIndex = headers.indexOf(key);
  const index = values.findIndex((value, rowIndex) => rowIndex > 0 && value[keyIndex] === id);
  if (index < 1) return false;
  const replacement = headers.map((header: string) => serialize((row as Record<string, unknown>)[header]));
  await getSheets().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(), range: `${sheet}!A${index + 1}:${columnName(headers.length)}${index + 1}`,
    valueInputOption: "RAW", requestBody: { values: [replacement] }
  });
  return true;
}

export async function appendPaymentLog(entry: Record<string, unknown>): Promise<void> {
  await appendRow("PaymentLogs", entry);
}

function serialize(value: unknown): string | number | boolean {
  if (typeof value === "boolean" || typeof value === "number") return value;
  return value == null ? "" : String(value);
}
function columnName(number: number): string {
  let result = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}
