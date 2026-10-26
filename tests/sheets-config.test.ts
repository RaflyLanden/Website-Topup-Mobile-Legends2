import { afterEach, describe, expect, it, vi } from "vitest";
import { spreadsheetId } from "@/lib/server/sheets";

describe("spreadsheetId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a configuration error when the spreadsheet ID is unset", () => {
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", undefined);

    expect(() => spreadsheetId()).toThrow("GOOGLE_SHEETS_SPREADSHEET_ID");
  });

  it("throws a configuration error when the spreadsheet ID is empty", () => {
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "");

    expect(() => spreadsheetId()).toThrow("GOOGLE_SHEETS_SPREADSHEET_ID");
  });

  it("returns the configured spreadsheet ID unchanged", () => {
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "configured-spreadsheet-id");

    expect(spreadsheetId()).toBe("configured-spreadsheet-id");
  });
});
