import { loadEnvConfig } from "@next/env";
import { getSheets, spreadsheetId } from "../lib/server/sheets";

loadEnvConfig(process.cwd());

async function main() {
  const sheets = getSheets();
  const id = spreadsheetId();
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: id });
  for (const sheet of metadata.data.sheets ?? []) {
    const name = sheet.properties?.title;
    if (!name) continue;
    const escaped = name.replace(/'/g, "''");
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `'${escaped}'!A:Z` });
    const rows = response.data.values ?? [];
    const headers = rows[0] ?? [];
    const columns = headers.map((header: string, index: number) => ({ header, index }))
      .filter(({ header }) => header.endsWith("_id") && header !== "admin_id");
    console.log(JSON.stringify({
      sheet: name,
      fields: columns.map(({ header }) => header),
      rows: rows.slice(1).filter((row) => row.some((cell) => cell !== "")).map((row) =>
        Object.fromEntries(columns.map(({ header, index }) => [header, row[index] ?? ""]))
      )
    }));
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Could not inspect spreadsheet IDs.");
  process.exitCode = 1;
});
