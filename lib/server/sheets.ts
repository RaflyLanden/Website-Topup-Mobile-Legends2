import { google, sheets_v4 } from "googleapis";

const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export const SHEET_HEADERS = {
  Products: ["product_id", "category_id", "category_name", "product_name", "description", "diamond_amount", "starlight_type", "delivery_method", "price", "cost_price", "is_active", "is_featured", "sort_order", "processing_estimate", "created_at", "updated_at"],
  Categories: ["category_id", "category_name", "slug", "description", "icon", "is_active", "sort_order"],
  Orders: ["order_id", "public_order_reference", "customer_contact", "user_id", "zone_id", "product_id", "product_name_snapshot", "category_snapshot", "quantity", "unit_price_snapshot", "admin_fee", "total_amount", "payment_method", "payment_reference", "payment_status", "fulfillment_status", "customer_note", "internal_note", "failure_reason", "created_at", "paid_at", "completed_at", "updated_at"],
  PaymentLogs: ["log_id", "order_id", "provider", "provider_reference", "event_type", "verification_status", "event_timestamp", "processed_at", "error_code"],
  AdminAuditLogs: ["log_id", "admin_id", "action", "target_type", "target_id", "details", "created_at"],
  Settings: ["setting_key", "setting_value", "updated_at"]
} as const;

let sheetsClient: sheets_v4.Sheets | undefined;
let cachedAccessToken: { value: string; expiresAt: number } | undefined;
let accessTokenRequest: Promise<string> | undefined;

export function getSheets(): sheets_v4.Sheets {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_KEY_FILE } = process.env;
  const useKeyFile = process.env.NODE_ENV !== "production" && Boolean(GOOGLE_SERVICE_ACCOUNT_KEY_FILE);
  if (!useKeyFile && (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY)) {
    throw new Error(process.env.NODE_ENV === "production"
      ? "Kredensial Worker Google belum lengkap. Atur GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY sebagai Worker Secrets."
      : "Kredensial Google belum lengkap. Atur GOOGLE_SERVICE_ACCOUNT_KEY_FILE atau GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY.");
  }
  if (!sheetsClient) {
    const scopes = [GOOGLE_SHEETS_SCOPE];
    const auth = useKeyFile
      ? new google.auth.GoogleAuth({ keyFile: GOOGLE_SERVICE_ACCOUNT_KEY_FILE, scopes })
      : new google.auth.JWT({
          email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: normalizePrivateKey(GOOGLE_PRIVATE_KEY!),
          scopes
        });
    sheetsClient = google.sheets({ version: "v4", auth });
  }
  return sheetsClient;
}

export function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID belum diatur.");
  }
  return id;
}

export async function readRows<T extends object>(sheet: keyof typeof SHEET_HEADERS): Promise<T[]> {
  try {
    const range = `${sheet}!A:${columnName(SHEET_HEADERS[sheet].length)}`;
    const response = await sheetsRequest<{ values?: string[][] }>(`values/${encodeURIComponent(range)}`);
    const [headers, ...rows] = response.values ?? [];
    if (!headers) return [];
    return rows.filter((row) => row.some((cell) => cell !== "")).map((row) =>
      Object.fromEntries(headers.map((header: string, index: number) => [header, row[index] ?? ""])) as T
    );
  } catch (error) {
    logSheetsReadFailure(sheet, error);
    throw error;
  }
}

export async function appendRow(sheet: keyof typeof SHEET_HEADERS, row: object): Promise<void> {
  const headers = SHEET_HEADERS[sheet] as readonly string[];
  const values = headers.map((key) => serialize((row as Record<string, unknown>)[key]));
  const range = `${sheet}!A:${columnName(headers.length)}`;
  await sheetsRequest(`values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [values] })
  });
}

export async function replaceRow(sheet: keyof typeof SHEET_HEADERS, key: string, id: string, row: object): Promise<boolean> {
  const readRange = `${sheet}!A:${columnName(SHEET_HEADERS[sheet].length)}`;
  const rows = await sheetsRequest<{ values?: string[][] }>(`values/${encodeURIComponent(readRange)}`);
  const values = rows.values ?? [];
  const headers = values[0] ?? [];
  const keyIndex = headers.indexOf(key);
  if (keyIndex < 0) throw new Error(`Kolom ${key} tidak ditemukan pada tab ${sheet}.`);
  const index = values.findIndex((value, rowIndex) => rowIndex > 0 && value[keyIndex] === id);
  if (index < 1) return false;
  const replacement = headers.map((header: string) => serialize((row as Record<string, unknown>)[header]));
  const writeRange = `${sheet}!A${index + 1}:${columnName(headers.length)}${index + 1}`;
  await sheetsRequest(`values/${encodeURIComponent(writeRange)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [replacement] })
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
function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

async function sheetsRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getGoogleAccessToken();
  const response = await fetch(`${GOOGLE_SHEETS_API}/${encodeURIComponent(spreadsheetId())}/${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
      Authorization: `Bearer ${token}`
    }
  });
  const text = await response.text();
  let data: { error?: { message?: string } } & T;
  try {
    data = text ? JSON.parse(text) as { error?: { message?: string } } & T : {} as { error?: { message?: string } } & T;
  } catch {
    throw new Error(`Google Sheets returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    const error = new Error(data.error?.message || `Google Sheets request failed (HTTP ${response.status}).`) as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return data;
}

async function getGoogleAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }
  if (!accessTokenRequest) {
    accessTokenRequest = requestGoogleAccessToken().finally(() => {
      accessTokenRequest = undefined;
    });
  }
  return accessTokenRequest;
}

async function requestGoogleAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !privateKey) {
    throw new Error("Kredensial Worker Google belum lengkap. Atur GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY sebagai Worker Secrets.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64UrlEncode(JSON.stringify({
    iss: email,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600
  }));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    decodePrivateKey(normalizePrivateKey(privateKey)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const assertion = `${signingInput}.${base64UrlEncode(signature)}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) {
    const error = new Error(data.error_description || `Google OAuth token request failed (HTTP ${response.status}).`) as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  cachedAccessToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000
  };
  return data.access_token;
}

function decodePrivateKey(pem: string): ArrayBuffer {
  const encoded = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function base64UrlEncode(value: string | ArrayBuffer): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function logSheetsReadFailure(sheet: keyof typeof SHEET_HEADERS, error: unknown): void {
  const details = typeof error === "object" && error !== null ? error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    stack?: unknown;
    response?: { status?: unknown };
    status?: unknown;
  } : {};
  const message = typeof details.message === "string"
    ? details.message
      .replace(/-----BEGIN [\s\S]*?-----[\s\S]*?-----END [\s\S]*?-----/g, "[REDACTED_KEY]")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
      .replace(/\s+/g, " ")
      .slice(0, 240)
    : "Unknown Google Sheets error";
  const stack = typeof details.stack === "string"
    ? details.stack.split("\n").slice(0, 6).join(" ").slice(0, 800)
    : undefined;
  console.error("Google Sheets read failed", {
    sheet,
    status: details.response?.status ?? details.status,
    code: details.code,
    name: details.name,
    message,
    stack
  });
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
