"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

type Settings = { store_name: string; support_contact: string; operating_hours: string; announcement: string };
const emptySettings: Settings = { store_name: "", support_contact: "", operating_hours: "", announcement: "" };

export function AdminSettingsForm() {
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { settings?: Partial<Settings>; error?: string };
        if (!response.ok) throw new Error(result.error || "Pengaturan tidak dapat dimuat.");
        setSettings({ ...emptySettings, ...result.settings });
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Pengaturan tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const result = await response.json() as { settings?: Settings; error?: string };
      if (!response.ok) throw new Error(result.error || "Pengaturan tidak dapat disimpan.");
      setSettings({ ...emptySettings, ...result.settings });
      setMessage("Pengaturan tersimpan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pengaturan tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof Settings, value: string) { setSettings((current) => ({ ...current, [key]: value })); }

  if (loading) return <div className="flex items-center gap-2 py-4 text-sm text-[#a0aaa7]"><LoaderCircle className="h-4 w-4 animate-spin" /> Memuat pengaturan…</div>;
  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="store-name" className="mb-1.5 block text-sm font-medium">Nama toko</label>
        <input id="store-name" className="input" maxLength={80} value={settings.store_name} onChange={(event) => update("store_name", event.target.value)} />
      </div>
      <div>
        <label htmlFor="support-contact" className="mb-1.5 block text-sm font-medium">Kontak bantuan</label>
        <input id="support-contact" className="input" maxLength={160} value={settings.support_contact} onChange={(event) => update("support_contact", event.target.value)} aria-describedby="support-help" />
        <p id="support-help" className="mt-1 text-xs text-[#77827e]">Email atau URL kontak bantuan; jangan masukkan secret.</p>
      </div>
      <div>
        <label htmlFor="operating-hours" className="mb-1.5 block text-sm font-medium">Jam operasional</label>
        <input id="operating-hours" className="input" maxLength={120} value={settings.operating_hours} onChange={(event) => update("operating_hours", event.target.value)} />
      </div>
      <div>
        <label htmlFor="announcement" className="mb-1.5 block text-sm font-medium">Pengumuman</label>
        <textarea id="announcement" className="input min-h-28 resize-y" maxLength={500} value={settings.announcement} onChange={(event) => update("announcement", event.target.value)} />
      </div>
      {message ? <p role="status" className="text-sm text-[#a0aaa7]">{message}</p> : null}
      <button className="btn-primary" disabled={saving}><Save className="h-4 w-4" />{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
    </form>
  );
}
