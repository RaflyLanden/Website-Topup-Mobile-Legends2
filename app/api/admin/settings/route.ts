import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/admin-guard";
import { getRepository } from "@/lib/server/repository";
import { generateNumericId } from "@/lib/server/numeric-id";

export const dynamic = "force-dynamic";

const schema = z.object({
  store_name: z.string().trim().min(1).max(80).optional(),
  support_contact: z.string().trim().max(160).optional(),
  operating_hours: z.string().trim().max(120).optional(),
  announcement: z.string().trim().max(500).optional()
}).strict();

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  try {
    return NextResponse.json({ settings: await getRepository().listSettings() });
  } catch {
    return NextResponse.json({ error: "Pengaturan tidak dapat dimuat." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: parsed.success ? "Tidak ada pengaturan untuk disimpan." : parsed.error.issues[0]?.message }, { status: 400 });
  }
  try {
    const repo = getRepository();
    await repo.saveSettings(parsed.data);
    const now = new Date().toISOString();
    await repo.appendAudit({
      log_id: generateNumericId((await repo.listAudit()).map((item) => item.log_id)), admin_id: admin.email, action: "SETTINGS_UPDATED",
      target_type: "settings", target_id: "1",
      details: JSON.stringify(Object.keys(parsed.data)), created_at: now
    });
    return NextResponse.json({ settings: await repo.listSettings() });
  } catch {
    return NextResponse.json({ error: "Pengaturan belum dapat disimpan." }, { status: 503 });
  }
}
