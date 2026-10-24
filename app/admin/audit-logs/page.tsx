import { AdminShell } from "@/components/admin-shell";
import { getRepository } from "@/lib/server/repository";
import type { AuditLog } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  let logs: AuditLog[] = [];
  let error = false;
  try { logs = (await getRepository().listAudit()).sort((a, b) => b.created_at.localeCompare(a.created_at)); } catch { error = true; }
  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div><div className="eyebrow mb-1">Kontrol</div><h1 className="text-2xl font-bold tracking-tight">Audit log</h1></div>
        <span className="text-sm text-[#77827e]">{error ? "Data tidak tersedia" : `${logs.length} aktivitas`}</span>
      </div>
      {error ? <div role="alert" className="border border-[#2a3439] bg-[#131a1e] p-4 text-sm text-[#efc271]">Audit log tidak dapat dimuat dari Google Sheets.</div> : logs.length === 0 ? (
        <div className="border border-[#2a3439] bg-[#131a1e] p-5"><div className="font-semibold">Belum ada aktivitas tercatat</div><p className="mt-1 text-sm text-[#a0aaa7]">Perubahan admin yang tersimpan akan muncul di sini.</p></div>
      ) : (
        <div className="overflow-x-auto border-y border-[#2a3439]">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#77827e]"><tr><th className="px-3 py-3 font-semibold">Waktu</th><th className="px-3 py-3 font-semibold">Admin</th><th className="px-3 py-3 font-semibold">Aktivitas</th><th className="px-3 py-3 font-semibold">Target</th><th className="px-3 py-3 font-semibold">Detail</th></tr></thead>
            <tbody>
              {logs.map((log) => <tr key={log.log_id} className="border-t border-[#2a3439]">
                <td className="whitespace-nowrap px-3 py-3 text-xs text-[#a0aaa7]">{new Date(log.created_at).toLocaleString("id-ID")}</td>
                <td className="px-3 py-3">{log.admin_id}</td>
                <td className="px-3 py-3 font-semibold">{log.action}</td>
                <td className="px-3 py-3">{log.target_type} <span className="font-mono text-xs text-[#77827e]">{log.target_id}</span></td>
                <td className="max-w-xs truncate px-3 py-3 text-xs text-[#77827e]">{log.details}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
