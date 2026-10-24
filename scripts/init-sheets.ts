import { loadEnvConfig } from "@next/env";
import { getSheets, SHEET_HEADERS, spreadsheetId } from "../lib/server/sheets";

loadEnvConfig(process.cwd());

function columnName(value: number): string {
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

async function main() {
  const sheets = getSheets();
  const id = spreadsheetId();
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: id });
  const existing = new Set(metadata.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean));

  const missing = Object.keys(SHEET_HEADERS).filter((name) => !existing.has(name));
  if (missing.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) }
    });
  }

  for (const [name, headers] of Object.entries(SHEET_HEADERS)) {
    const lastColumn = columnName(headers.length);
    const range = `${name}!A1:${lastColumn}1`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: id, range });
    const firstRow = response.data.values?.[0] ?? [];
    if (firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: id,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [[...headers]] }
      });
      console.log(`Created headers: ${name}`);
      continue;
    }
    const matches = headers.every((header, index) => firstRow[index] === header);
    if (!matches) {
      throw new Error(`Header tab "${name}" berbeda dari skema aplikasi. Tidak ada data yang ditimpa; periksa baris pertama tab tersebut.`);
    }
    console.log(`Ready: ${name}`);
  }
  console.log("Sheet setup complete. Add product and category rows beneath their headers.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Google Sheets setup failed.");
  process.exitCode = 1;
});
