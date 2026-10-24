import { NextResponse } from "next/server";
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function publicError(error: unknown): string {
  if (error instanceof Error && /belum dikonfigurasi|wajib diisi/.test(error.message)) return error.message;
  return "Terjadi kendala. Silakan coba kembali atau hubungi bantuan.";
}
