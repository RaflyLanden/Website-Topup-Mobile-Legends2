import { loadEnvConfig } from "@next/env";
import { getSheets, spreadsheetId } from "../lib/server/sheets";

loadEnvConfig(process.cwd());

async function main() {
  const result = await getSheets().spreadsheets.get({
    spreadsheetId: spreadsheetId(),
    fields: "spreadsheetId,properties.title"
  });
  console.log(`Google Sheets connected: ${result.data.properties?.title ?? "spreadsheet access confirmed"}`);
}

main().catch((error: unknown) => {
  const status = typeof error === "object" && error !== null && "code" in error
    ? Number((error as { code: unknown }).code)
    : 0;
  if (status === 403) {
    console.error("Google returned 403: share the spreadsheet with the Service Account email as Editor and confirm Sheets API is enabled.");
  } else if (status === 404) {
    console.error("Google returned 404: check the spreadsheet ID and confirm it is shared with the Service Account.");
  } else {
    const message = error instanceof Error ? error.message : "Unknown connection error.";
    console.error(`Google Sheets connection failed: ${message}`);
  }
  process.exitCode = 1;
});
